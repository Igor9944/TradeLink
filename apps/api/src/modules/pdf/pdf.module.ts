import { Module } from '@nestjs/common';
import { PdfService } from '../invoices/pdf.service';

@Module({
  providers: [PdfService],
  exports: [PdfService],
})
export class PdfModule {}
