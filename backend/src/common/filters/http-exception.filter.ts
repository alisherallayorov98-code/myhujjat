import {
  ExceptionFilter, Catch, ArgumentsHost,
  HttpException, HttpStatus, Logger
} from '@nestjs/common'

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private logger = new Logger('ExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx    = host.switchToHttp()
    const res    = ctx.getResponse()
    const req    = ctx.getRequest()
    const status = exception instanceof HttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR

    const message = exception instanceof HttpException
      ? (exception.getResponse() as any)?.message || exception.message
      : 'Ichki server xatoligi'

    if (status >= 500) {
      this.logger.error(`${req.method} ${req.url}`, exception)
    }

    res.status(status).json({
      statusCode: status,
      message,
      timestamp:  new Date().toISOString(),
      path:       req.url,
    })
  }
}
