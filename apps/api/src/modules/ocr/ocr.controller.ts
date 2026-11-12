import { Controller, Post, Body, UseGuards, UploadedFile, UseInterceptors } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { OcrService } from './ocr.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('OCR')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('ocr')
export class OcrController {
  constructor(private readonly ocrService: OcrService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  uploadDocument(@CurrentUser('id') userId: string, @UploadedFile() file: Express.Multer.File) {
    return this.ocrService.processDocument(userId, file);
  }

  @Post('validate-field')
  validateDynamicField(@Body() dto: any) {
    return this.ocrService.validateDynamicField(dto);
  }
}
