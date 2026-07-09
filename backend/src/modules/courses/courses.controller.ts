import {
  Controller,
  Get,
  Param,
  Query,
  Post,
  Put,
  Body,
  Patch,
  Delete,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiTags, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { QueryCourseDto } from './dto/query-course.dto';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { UpdateCourseModulesDto } from './dto/update-modules.dto';
import { AdminGuard } from '../../common/guards/admin.guard';

const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_UPLOAD_SIZE_BYTES = 5 * 1024 * 1024; // 5MB

@ApiTags('Courses')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Get()
  @ApiOperation({ summary: 'Lay danh sach khoa hoc' })
  findAll(@Query() query: QueryCourseDto) {
    return this.coursesService.findAll(query);
  }

  @Post('sync-status')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Dong bo thu cong status=completed xuong DB cho khoa hoc da qua start_date (Admin only)' })
  syncCompletedStatuses() {
    return this.coursesService.syncCompletedStatuses();
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Lay chi tiet khoa hoc theo slug' })
  findOne(@Param('slug') slug: string) {
    return this.coursesService.findBySlug(slug);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Them khoa hoc moi (Admin only)' })
  create(@Body() createCourseDto: CreateCourseDto) {
    return this.coursesService.create(createCourseDto);
  }

  @Patch(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat khoa hoc (Admin only)' })
  update(@Param('id') id: string, @Body() updateCourseDto: UpdateCourseDto) {
    return this.coursesService.update(id, updateCourseDto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Xoa khoa hoc (Admin only)' })
  remove(@Param('id') id: string) {
    return this.coursesService.delete(id);
  }

  @Post('upload')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
      fileFilter: (_req, file, callback) => {
        if (!ALLOWED_IMAGE_MIME_TYPES.includes(file.mimetype)) {
          callback(
            new BadRequestException('Chi chap nhan file anh dinh dang JPG, PNG, WEBP hoac GIF'),
            false,
          );
          return;
        }
        callback(null, true);
      },
    }),
  )
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiOperation({ summary: 'Upload anh khoa hoc lên Supabase Storage (Admin only, toi da 5MB)' })
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('Khong tim thay file de upload');
    }
    return this.coursesService.uploadThumbnail(file);
  }

  @Put(':id/modules')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cap nhat danh sach module cho khoa hoc (Admin only)' })
  updateModules(@Param('id') id: string, @Body() dto: UpdateCourseModulesDto) {
    return this.coursesService.updateModules(id, dto.modules);
  }

  @Get(':id/modules')
  @UseGuards(AdminGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Lay danh sach module cua khoa hoc (Admin only)' })
  findModules(@Param('id') id: string) {
    return this.coursesService.findModulesByCourseId(id);
  }
}
