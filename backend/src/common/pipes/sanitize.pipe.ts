import { PipeTransform, Injectable, ArgumentMetadata } from '@nestjs/common'

@Injectable()
export class SanitizePipe implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (typeof value === 'string') {
      return value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .trim()
    }
    if (typeof value === 'object' && value !== null) {
      return Object.fromEntries(
        Object.entries(value).map(([k, v]) => [k, this.transform(v, metadata)])
      )
    }
    return value
  }
}
