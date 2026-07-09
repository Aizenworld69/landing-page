import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Gọi sang frontend (Next.js) để xóa cache ISR ngay khi admin thay đổi
 * dữ liệu (đăng/tắt/sửa/xóa blog, khóa học...), giúp trang public cập
 * nhật ngay lập tức thay vì phải chờ hết chu kỳ revalidate theo thời gian.
 *
 * Lỗi ở đây KHÔNG được làm fail request chính (update/create/delete) —
 * nếu revalidate lỗi, FE vẫn tự cập nhật sau khi hết cache theo thời gian
 * (fallback an toàn), chỉ là chậm hơn.
 */
@Injectable()
export class RevalidationService {
  private readonly logger = new Logger(RevalidationService.name);

  constructor(private readonly config: ConfigService) {}

  async revalidate(paths: string[]): Promise<void> {
    const secret = this.config.get<string>('app.revalidateSecret');
    const frontendUrl = this.config.get<string>('app.frontendUrl');

    if (!secret) {
      this.logger.warn(
        'REVALIDATE_SECRET chưa cấu hình — bỏ qua revalidate tức thì, FE sẽ tự cập nhật theo cache time.',
      );
      return;
    }

    try {
      const res = await fetch(`${frontendUrl}/api/revalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-revalidate-secret': secret,
        },
        body: JSON.stringify({ paths }),
        signal: AbortSignal.timeout(5000),
      });

      if (!res.ok) {
        this.logger.warn(`Revalidate FE thất bại (${res.status}): ${paths.join(', ')}`);
      }
    } catch (err) {
      this.logger.warn(`Không gọi được FE để revalidate: ${(err as Error).message}`);
    }
  }
}
