import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AccountingService } from './accounting.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CalculateAccountingDto } from './dto/calculate-accounting.dto';

@ApiTags('Accounting')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard)
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Post('calculate')
  calculate(@Body() dto: CalculateAccountingDto) {
    return this.accountingService.calculate(dto);
  }
}
