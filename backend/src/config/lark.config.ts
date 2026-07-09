import { registerAs } from '@nestjs/config';

export default registerAs('lark', () => ({
  webhookUrl: process.env.LARK_WEBHOOK_URL ?? '',
}));
