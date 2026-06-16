import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest<Request>();
    const method: string = request.method;
    const url: string = request.url;
    const body: unknown = request.body;
    const headers: unknown = request.headers;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data: unknown) => {
          const response = context.switchToHttp().getResponse<Response>();
          const statusCode = response.statusCode;
          const delay = Date.now() - now;
          this.logger.log(`${method} ${url} ${statusCode} +${delay}ms`);
          // Log payload for debugging
          this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
          this.logger.debug(`Request Headers: ${JSON.stringify(headers)}`);
          this.logger.debug(`Response Data: ${JSON.stringify(data)}`);
        },
        error: (err: { status?: number; message?: string }) => {
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${err.status || 500} +${delay}ms - Error: ${err.message}`,
          );
        },
      }),
    );
  }
}
