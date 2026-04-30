import {
  Controller, Post, Get,
  Body, Param, Query, Res,
} from '@nestjs/common'
import { Response }    from 'express'
import { AiService }   from './ai.service'
import { CurrentUser } from '../../common/decorators/current-user.decorator'

@Controller('ai')
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Post('generate')
  generate(@CurrentUser() user: any, @Body() dto: any) {
    return this.aiService.generateDocument({ userId: user.sub, ...dto })
  }

  @Post('generate/stream')
  async generateStream(
    @CurrentUser() user: any,
    @Body() dto: any,
    @Res() res: Response,
  ) {
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
  getHistory(@Query('orgId') orgId: string) {
    return this.aiService.getHistory(orgId)
  }

  @Get('docs/:id')
  getDoc(@Query('orgId') orgId: string, @Param('id') id: string) {
    return this.aiService.getDoc(orgId, id)
  }
}
