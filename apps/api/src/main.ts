import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { rawBody: true });
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');

  // Global prefix
  app.setGlobalPrefix('api');

  // CORS
  const corsOrigins = configService.get<string>('CORS_ORIGINS', 'http://localhost:3000');
  app.enableCors({
    origin: corsOrigins.split(',').map((o) => o.trim()),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept-Language'],
  });

  // Global Validation Pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Swagger
  const config = new DocumentBuilder()
    .setTitle('TradeLink API')
    .setDescription('API REST complète pour la plateforme TradeLink v5.0')
    .setVersion('5.0')
    .addBearerAuth({ type: 'http', scheme: 'bearer', bearerFormat: 'JWT' }, 'JWT')
    .addTag('Auth', 'Authentification et gestion des sessions')
    .addTag('Users', 'Gestion des utilisateurs')
    .addTag('KYC', 'Vérification KYC')
    .addTag('Products', 'Catalogue et stocks')
    .addTag('Orders', 'Commandes et devis')
    .addTag('Invoices', 'Facturation')
    .addTag('Payments', 'Paiements Stripe')
    .addTag('Shipments', 'Logistique et transport')
    .addTag('Accounting', 'Comptabilité et calculs')
    .addTag('OCR', 'OCR Intelligent')
    .addTag('AI', 'Assistant IA Vocal')
    .addTag('Rooms', 'Room Live collaboratif')
    .addTag('Tickets', 'Support et tickets')
    .addTag('Notifications', 'Notifications')
    .addTag('Floating Buttons', 'Boutons flottants')
    .addTag('Admin', 'Console administration')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = configService.get<number>('PORT', 3001);
  await app.listen(port);
  logger.log(`🚀 TradeLink API running on http://localhost:${port}/api`);
  logger.log(`📖 Swagger docs at http://localhost:${port}/api/docs`);
}

bootstrap();
