import { Injectable, NotImplementedException } from '@nestjs/common';

@Injectable()
export class AiService {
  async processVoiceCommand(_userId: string, _dto: unknown) {
    throw new NotImplementedException('Voice command processing is not implemented');
  }
}
