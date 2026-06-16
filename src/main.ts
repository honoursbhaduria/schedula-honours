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
      `
      # Schedula End-to-End Testing Guide

      Follow this sequenced journey to test the full Schedula ecosystem in production.

      ### PHASE 1: Identity & Security
      *   **Signup & Login**: Create both a **PATIENT** and **DOCTOR** account.
      *   **Authorize**: Click the **Authorize** button at the top and paste your token as \`Bearer <TOKEN>\`.

      ### PHASE 2: Doctor Onboarding (Use Doctor Token)
      *   **Create Profile**: Initialize your professional profile in **Tag 2**.
      *   **Availability**: Define your recurring schedule (Tag 2) or use the **Quick Seed** (\`GET /doctor/debug/seed\`) to instantly set up Doctor 43 for testing.

      ### PHASE 3: Patient Journey (Use Patient Token)
      *   **Discovery**: Find doctors using filters or fuzzy search in **Tag 2**.
      *   **Check Slots**: Choose a date and view available 30-min windows.
      *   **Booking**: Book your preferred slot in **Tag 4**.

      ### PHASE 4: The AI Assistant Experience
      *   **Report Analysis**: Upload a medical report in **Tag 5** to get instant specialist recommendations.
      *   **Agentic Chat**: Open a chat in **Tag 5**. Use the analysis as \`context\`. 
      *   **Agent Flow**: Ask: *"Find a specialist for my condition"* -> *"When is Dr. Smith free?"* -> *"Book the 10:00 AM slot"*.

      ### PHASE 5: Management
      *   **Verification**: Check your personal dashboard (Tag 4 for Patients, Tag 2 for Doctors).
      *   **Lifecycle**: Cancel future appointments to test state transitions.
      `,

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
