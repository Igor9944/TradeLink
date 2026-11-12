import { IsDateString, IsNumber, Min } from 'class-validator';

export class CalculateAccountingDto {
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  amount: number;

  @IsNumber({ maxDecimalPlaces: 4 })
  @Min(0)
  rate: number;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
