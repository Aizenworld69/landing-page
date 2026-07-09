import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { EnrollmentsService } from './enrollments.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser, type JwtPayload } from '../../common/decorators/current-user.decorator';

@ApiTags('My Courses')
@ApiBearerAuth()
@Controller('my-courses')
@UseGuards(JwtAuthGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  @Get()
  @ApiOperation({ summary: 'Lay danh sach khoa hoc cua toi' })
  getMyEnrollments(@CurrentUser() user: JwtPayload) {
    return this.enrollmentsService.getMyEnrollments(user);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Dang ky tham gia khoa hoc' })
  enroll(@Body() dto: CreateEnrollmentDto, @CurrentUser() user: JwtPayload) {
    return this.enrollmentsService.enroll(dto, user);
  }

  @Get(':id/certificate')
  @ApiOperation({ summary: 'Tai chung chi khoa hoc' })
  getCertificate(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.enrollmentsService.getCertificate(id, user);
  }
}
