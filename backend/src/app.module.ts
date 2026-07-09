import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ScheduleModule } from '@nestjs/schedule';
import * as Joi from 'joi';
import { APP_FILTER, APP_INTERCEPTOR, APP_GUARD } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';

import appConfig from './config/app.config';
import supabaseConfig from './config/supabase.config';
import larkConfig from './config/lark.config';
import { SupabaseModule } from './database/supabase.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { BlogsModule } from './modules/blogs/blogs.module';
import { CoursesModule } from './modules/courses/courses.module';
import { InstructorsModule } from './modules/instructors/instructors.module';
import { RegistrationsModule } from './modules/registrations/registrations.module';
import { EnrollmentsModule } from './modules/enrollments/enrollments.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { PromoCodesModule } from './modules/promo-codes/promo-codes.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, supabaseConfig, larkConfig],
      validationSchema: Joi.object({
        NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
        PORT: Joi.number().default(3001),
        SUPABASE_URL: Joi.string().uri().required(),
        SUPABASE_SERVICE_ROLE_KEY: Joi.string().required(),
        SUPABASE_ANON_KEY: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        FRONTEND_URL: Joi.string().default('http://localhost:3000'),
        LARK_WEBHOOK_URL: Joi.string().uri().optional().allow(''),
      }),
    }),
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 1 minute
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    SupabaseModule,
    AuthModule,
    BlogsModule,
    CoursesModule,
    InstructorsModule,
    RegistrationsModule,
    EnrollmentsModule,
    ReviewsModule,
    PromoCodesModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ResponseTransformInterceptor },
  ],
})
export class AppModule {}
