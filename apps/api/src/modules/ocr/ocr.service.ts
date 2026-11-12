import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class OcrService {
  async processDocument(_userId: string, _file: Express.Multer.File) {
    throw new NotImplementedException('Document OCR is not implemented');
  }

  async validateDynamicField(_dto: unknown) {
    throw new NotImplementedException('Dynamic field validation is not implemented');
  }
}
