import { Global, Module } from '@nestjs/common';
import { CryptoUtil } from './crypto.util';

@Global()
@Module({
  providers: [CryptoUtil],
  exports: [CryptoUtil],
})
export class CryptoModule {}
