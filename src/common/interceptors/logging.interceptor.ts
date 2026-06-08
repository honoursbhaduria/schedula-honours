import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body, headers } = request;
    const now = Date.now();

    return next.handle().pipe(
      tap({
        next: (data) => {
          const response = context.switchToHttp().getResponse();
          const statusCode = response.statusCode;
          const delay = Date.now() - now;
          this.logger.log(
            `${method} ${url} ${statusCode} +${delay}ms`,
          );
          // Log payload for debugging
          this.logger.debug(`Request Body: ${JSON.stringify(body)}`);
          this.logger.debug(`Request Headers: ${JSON.stringify(headers)}`);
          this.logger.debug(`Response Data: ${JSON.stringify(data)}`);
        },
        error: (err) => {
          const delay = Date.now() - now;
          this.logger.error(
            `${method} ${url} ${err.status || 500} +${delay}ms - Error: ${err.message}`,
          );
        },
      }),
    );
  }
}
