import { BadRequestException, Injectable } from '@nestjs/common';
import { CalculateAccountingDto } from './dto/calculate-accounting.dto';

@Injectable()
export class AccountingService {
  calculate(dto: CalculateAccountingDto) {
    const { amount, rate, startDate, endDate } = dto;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (end < start) {
      throw new BadRequestException('endDate must be on or after startDate');
    }

    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    const result = (amount * (rate / 100) * days) / 365;
    return {
      amount,
      rate,
      days,
      result: result.toFixed(2),
      detail: `${amount} × (${rate}/100) × (${days}/365) = ${result.toFixed(2)}`,
    };
  }
}
