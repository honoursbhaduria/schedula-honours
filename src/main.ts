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
      # Testing Flow Guide
      To test the system properly, follow this sequence:
      
      ### 1. Authentication
      * Use **Signup** to create a Doctor and a Patient.
      * Use **Login** to get an \`accessToken\`.
      * Click **"Authorize"** at the top and paste the token as \`Bearer <your_token>\`.
      
      ### 2. Doctor Setup
      * **Create Profile**: Use \`POST /doctor/profile\` to set up doctor details.
      * **Set Availability**: Use \`POST /doctor/availability\` for recurring slots.
      * **Set Override**: Use \`POST /doctor/availability/override\` for specific date changes.
      * **Quick Test Data**: Use \`GET /doctor/debug/seed\` to automatically add availability and 1 appointment for Doctor 43 (if a patient exists).
      
      ### 3. Patient Flow
      * **Discover Doctors**: Use \`GET /doctor\` to find doctors.
      * **Check Slots**: Use \`GET /doctor/{id}/slots\` with a date (e.g., 2026-06-20) to see generated slots.
      
      ### 4. Appointment Management
      * **Book Appointment**: Use \`POST /appointment\` with the details from step 3.
      * **View My Appointments (Patient)**: Use \`GET /appointment/my\`.
      * **Cancel Appointment**: Use \`PATCH /appointment/{id}/cancel\` (only for future dates).
      * **View Appointments (Doctor)**: Use \`GET /doctor/appointments\` to see patients who booked with you.
      
      ### 5. AI Medical Assistant (LangChain)
      * **Report Analysis**: Use \`POST /ai/recommend-doctor\` to upload a report. Note the recommended doctors in the response.
      * **Interactive Agent**: Use \`POST /ai/chat\`.
        * Pass the report analysis in the \`context\` field.
        * Ask: *"Find a specialist for my condition"* or *"What are Dr. Smith's slots for tomorrow?"*
        * Finally: *"Book the 10:00 AM slot with Dr. Smith"*.
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
