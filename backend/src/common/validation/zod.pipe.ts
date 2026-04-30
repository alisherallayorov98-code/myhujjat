import { PipeTransform, ArgumentMetadata, BadRequestException } from '@nestjs/common'
import { ZodSchema, ZodError } from 'zod'

/**
 * Zod schema'sini Nest pipe sifatida ishlatish.
 *
 * Foydalanish:
 *   @Post()
 *   create(@Body(new ZodValidationPipe(CreateContractSchema)) dto: CreateContractDto)
 */
export class ZodValidationPipe implements PipeTransform {
  constructor(private schema: ZodSchema) {}

  transform(value: unknown, _meta: ArgumentMetadata) {
    try {
      return this.schema.parse(value)
    } catch (err) {
      if (err instanceof ZodError) {
        const errors = err.issues.map(e => ({
          field:   e.path.join('.'),
          message: e.message,
        }))
        throw new BadRequestException({
          message: 'Kiritilgan ma\'lumotlar noto\'g\'ri',
          errors,
        })
      }
      throw err
    }
  }
}
