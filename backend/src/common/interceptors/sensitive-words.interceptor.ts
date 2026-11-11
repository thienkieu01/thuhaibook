import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class SensitiveWordsInterceptor implements NestInterceptor {
  private blacklist = ['từ_cấm_1', 'từ_cấm_2', 'lừa_đảo']; // Sau này sẽ load từ DB

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    if (request.body && request.body.content) {
      const containsSensitive = this.blacklist.some((word) =>
        request.body.content.toLowerCase().includes(word),
      );
      // Tự động đánh dấu ẩn để Admin kiểm duyệt (FR-60)[cite: 1]
      if (containsSensitive) {
        request.body.isHidden = true;
      }
    }
    return next.handle();
  }
}