import {
  Controller, Post, Get,
  Body, Param, Query, Res,
} from '@nestjs/common'
import { Response }    from 'express'
import { AiService }   from './ai.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { TenantAccessService } from '../../common/services/tenant-access.service'
import { GenerateAiDocDto } from './dto/generate.dto'

@Controller('ai')
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly tenant:    TenantAccessService,
  ) {}

  @Post('generate')
  async generate(@CurrentUser() user: any, @Body() dto: GenerateAiDocDto) {
    await this.tenant.requireOrgAccess(user.sub, dto.orgId)
    return this.aiService.generateDocument({ userId: user.sub, ...dto })
  }

  @Post('generate/stream')
  async generateStream(
    @CurrentUser() user: any,
    @Body() dto: GenerateAiDocDto,
    @Res() res: Response,
  ) {
    await this.tenant.requireOrgAccess(user.sub, dto.orgId)

    res.setHeader('Content-Type',  'text/event-stream')
    res.setHeader('Cache-Control', 'no-cache')
    res.setHeader('Connection',    'keep-alive')

    try {
      const stream   = await this.aiService.generateStream({ userId: user.sub, ...dto })
      let fullText   = ''
      let tokensUsed = 0

      for await (const chunk of stream) {
        if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
          const text = chunk.delta.text
          fullText  += text
          res.write(`data: ${JSON.stringify({ text })}\n\n`)
        }
        if (chunk.type === 'message_delta') {
          tokensUsed = (chunk as any).usage?.output_tokens || 0
        }
      }

      const saved = await this.aiService.saveDoc(
        { orgId: dto.orgId, userId: user.sub, docType: dto.docType, prompt: dto.prompt },
        fullText,
        tokensUsed,
      )

      res.write(`data: ${JSON.stringify({ done: true, id: saved.id })}\n\n`)
      res.end()
    } catch (err: any) {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`)
      res.end()
    }
  }

  @Get('history')
  async getHistory(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Query('page')  page?:  string,
    @Query('limit') limit?: string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.aiService.getHistory(orgId, {
      page:  page  ? Number(page)  : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get('docs/:id')
  async getDoc(
    @CurrentUser() user: any,
    @Query('orgId') orgId: string,
    @Param('id')    id:    string,
  ) {
    await this.tenant.requireOrgAccess(user.sub, orgId)
    return this.aiService.getDoc(orgId, id)
  }
}
