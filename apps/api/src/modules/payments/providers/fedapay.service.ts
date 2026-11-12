import { Injectable, NotImplementedException } from '@nestjs/common';

interface FedaPayPaymentRequest {
  amount: number;
  currency: string;
  transactionId: string;
  customerFirstName: string;
  customerLastName: string;
  customerEmail: string;
  customerPhone: string;
  customerCountry: string;
  description?: string;
}

@Injectable()
export class FedaPayService {
  async createPayment(_request: FedaPayPaymentRequest): Promise<{
    transactionId: string;
    paymentUrl: string;
    fedapayId: number;
  }> {
    throw new NotImplementedException('FedaPay payment creation is not implemented');
  }

  async getPaymentStatus(_fedapayId: number): Promise<{
    status: string;
    amount: number;
    currency: string;
  }> {
    throw new NotImplementedException('FedaPay status checks are not implemented');
  }

  async refundPayment(_fedapayId: number, _amount?: number): Promise<void> {
    throw new NotImplementedException('FedaPay refunds are not implemented');
  }

  verifyWebhookSignature(_payload: string, _signature: string): boolean {
    throw new NotImplementedException('FedaPay webhook verification is not implemented');
  }

  async handleWebhook(_payload: unknown): Promise<{
    transactionId: string;
    status: string;
    amount: number;
    currency: string;
  }> {
    throw new NotImplementedException('FedaPay webhook processing is not implemented');
  }
}
