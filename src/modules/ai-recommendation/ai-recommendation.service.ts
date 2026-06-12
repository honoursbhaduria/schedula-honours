import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import { DoctorService } from '../doctor/doctor.service';

@Injectable()
export class AiRecommendationService {
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;

  constructor(
    private readonly configService: ConfigService,
    private readonly doctorService: DoctorService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async recommendDoctor(file: Express.Multer.File) {
    console.log('Received file for AI analysis:', {
      filename: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    });

    try {
      if (!file || !file.buffer) {
        throw new Error('File buffer is missing');
      }

      const prompt = `
        Analyze this medical report and provide the following in JSON format:
        {
          "condition": "Brief description of the medical condition",
          "specialistType": "The type of medical specialist needed (e.g., Cardiologist, Dermatologist, General Physician, etc.)",
          "summary": "A professional summary of the report for the patient",
          "preMedicine": "Safe, over-the-counter pre-medicine or first-aid advice that the patient can take before seeing a doctor. If none are safe, state that."
        }
        Only return the JSON.
      `;

      console.log('Calling Gemini AI...');
      const result = await this.model.generateContent([
        prompt,
        {
          inlineData: {
            data: file.buffer.toString('base64'),
            mimeType: file.mimetype,
          },
        },
      ]);

      const response = await result.response;
      const text = response.text();
      console.log('AI Raw Response:', text);

      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error(`Failed to find JSON in AI response. Raw text: ${text}`);
      }

      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      const aiAnalysis = JSON.parse(jsonString);
      console.log('AI Parsed Analysis:', aiAnalysis);

      const doctors = await this.doctorService.findAllDoctors({
        specialization: aiAnalysis.specialistType,
        availability: 'true',
      });

      return {
        analysis: aiAnalysis,
        recommendedDoctors: doctors.data,
      };
    } catch (error) {
      console.error('DETAILED AI ERROR:', error);
      throw new InternalServerErrorException(`AI Processing Error: ${error.message}`);
    }
  }
}
