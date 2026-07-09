import {
  Controller, Get, Post, Patch, Delete,
  Param, Query, Body, UseGuards, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { BlogsService } from './blogs.service';
import { QueryBlogDto } from './dto/query-blog.dto';
import { CreateBlogDto } from './dto/create-blog.dto';
import { UpdateBlogDto } from './dto/update-blog.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

@ApiTags('Blogs')
@Controller('blogs')
export class BlogsController {
  constructor(private readonly blogsService: BlogsService) {}

  // ── Public ────────────────────────────────────────────────

  @Get()
  @ApiOperation({ summary: 'Lay danh sach blog (published)' })
  findAll(@Query() query: QueryBlogDto) {
    return this.blogsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lay chi tiet blog theo slug (published)' })
  findOne(@Param('slug') slug: string) {
    return this.blogsService.findBySlug(slug);
  }

  // ── Admin ─────────────────────────────────────────────────

  @Get('admin/list')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lay tat ca blog (moi status)' })
  adminFindAll(@Query() query: QueryBlogDto) {
    return this.blogsService.adminFindAll(query);
  }

  @Get('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Lay chi tiet blog theo ID' })
  adminFindById(@Param('id') id: string) {
    return this.blogsService.adminFindById(id);
  }

  @Post('admin')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Tao blog moi' })
  adminCreate(@Body() dto: CreateBlogDto) {
    return this.blogsService.adminCreate(dto);
  }

  @Patch('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: '[Admin] Cap nhat blog' })
  adminUpdate(@Param('id') id: string, @Body() dto: UpdateBlogDto) {
    return this.blogsService.adminUpdate(id, dto);
  }

  @Delete('admin/:id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '[Admin] Xoa blog' })
  adminDelete(@Param('id') id: string) {
    return this.blogsService.adminDelete(id);
  }
}