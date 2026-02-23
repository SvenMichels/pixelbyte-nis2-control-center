import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
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
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
