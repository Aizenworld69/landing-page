import { Module } from '@nestjs/common';
import { BlogsController } from './blogs.controller';
import { BlogsRepository } from './blogs.repository';
import { BlogsService } from './blogs.service';
import { RevalidationService } from '../../common/services/revalidation.service';

@Module({
  controllers: [BlogsController],
  providers: [BlogsService, BlogsRepository, RevalidationService],
  exports: [BlogsService],
})
export class BlogsModule {}
