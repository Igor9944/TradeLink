import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth() {
    return {
      status: 'ok',
      service: 'TradeLink API',
      version: '5.0.0',
      timestamp: new Date().toISOString(),
    };
  }
}
