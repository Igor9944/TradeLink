import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Headers,
  RawBodyRequest,
  Req,
  UseGuards,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { Role } from '@prisma/client';
import { Request } from 'express';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT, Role.SUPPLIER, Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Lister les paiements accessibles à l’utilisateur' })
  findAll(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Query() pagination: PaginationDto,
  ) {
    return this.paymentsService.findAll(userId, userRole, pagination);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.CLIENT, Role.ADMIN)
  @Post('intent')
  @ApiOperation({ summary: 'Créer un PaymentIntent Stripe' })
  @ApiResponse({ status: 201, description: 'PaymentIntent créé avec succès' })
  @ApiResponse({ status: 400, description: 'Erreur Stripe ou facture invalide' })
  createIntent(
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.paymentsService.createPaymentIntent(dto, userId, userRole);
  }

  @Public()
  @Post('webhook')
  @ApiExcludeEndpoint() // Ne pas exposer dans Swagger
  @ApiOperation({ summary: 'Webhook Stripe (signature vérifiée)' })
  async handleWebhook(
    @Headers('stripe-signature') signature: string,
    @Req() req: RawBodyRequest<Request>,
  ) {
    // Le rawBody est fourni par NestJS avec le middleware approprié
    const rawBody = req.rawBody;
    if (!rawBody) {
      throw new Error('Raw body not available');
    }
    
    return this.paymentsService.handleStripeWebhook(signature, rawBody);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({ summary: 'Obtenir un paiement par ID' })
  @ApiResponse({ status: 200, description: 'Détails du paiement' })
  @ApiResponse({ status: 404, description: 'Paiement introuvable' })
  findOne(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.paymentsService.findById(id, userId, userRole);
  }

  @ApiBearerAuth('JWT')
  @UseGuards(JwtAuthGuard)
  @Get('invoice/:invoiceId')
  @ApiOperation({ summary: 'Liste des paiements pour une facture' })
  @ApiResponse({ status: 200, description: 'Liste des paiements' })
  findByInvoice(
    @Param('invoiceId') invoiceId: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: Role,
  ) {
    return this.paymentsService.findByInvoice(invoiceId, userId, userRole);
  }
}
