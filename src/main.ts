import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    const enableSwagger = process.env.NODE_ENV !== 'production';
    app.useGlobalPipes(
      new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
      }),
    );


    if (enableSwagger) {
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
