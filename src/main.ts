import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const config = new DocumentBuilder()
    .setTitle('Schedula API')
    .setDescription(
      'The Schedula API documentation for Doctor and Patient management.\n\n' +
      '### ADVANCED SCHEDULING (Day 9)\n' +
      '* **STREAM (Exact Time)**: In Tag 2, set `schedulingType: STREAM`. Availability is sliced into discrete slots using `slotDuration` + `bufferTime`.\n' +
      '* **WAVE (Token-Based)**: In Tag 2, set `schedulingType: WAVE`. Availability is shown as a window (e.g., 10-11 AM) with a `maxCapacity`. Patients are assigned tokens upon booking.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(`Application is running on: http://localhost:${port}`);
  logger.log(
    `Swagger documentation available at: http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
