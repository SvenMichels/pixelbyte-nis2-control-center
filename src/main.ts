import { NestFactory } from '@nestjs/core';
import { BadRequestException, Logger, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import type { ValidationError } from 'class-validator';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

function flattenValidationErrors(errors: ValidationError[]): string[] {
    const messages: string[] = [];
    for (const err of errors) {
        if (err.constraints) {
            messages.push(...Object.values(err.constraints));
        }
        if (err.children?.length) {
            messages.push(...flattenValidationErrors(err.children));
        }
    }
    return messages;
}

async function bootstrap() {
    const app = await NestFactory.create(AppModule, {
        logger: ['error', 'warn', 'log'],
    });
    app.use(helmet());
    app.enableCors({
        origin: process.env.CORS_ORIGIN ?? 'http://localhost:4200',
        credentials: true,
    });
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
          exceptionFactory: (errors) => {
              const messages = flattenValidationErrors(errors);
              return new BadRequestException({
                  statusCode: 400,
                  error: 'Validierungsfehler',
                  message: messages,
              });
          },
      }),
    );

    if (process.env.NODE_ENV !== 'production') {
        const config = new DocumentBuilder()
          .setTitle('PixelByte NIS2 Compliance API')
          .setDescription('API documentation & test console')
          .setVersion('0.1.0')
          .addBearerAuth(
            { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
            'bearer',
          )
          .build();
        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup('docs', app, document, {
            swaggerOptions: { persistAuthorization: true },
        });
    }

    const port = process.env.PORT ?? 3000;
    await app.listen(port);
    Logger.log(`Server läuft auf Port ${port}`, 'Bootstrap');
}
bootstrap();
