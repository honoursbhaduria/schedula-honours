import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { DoctorService } from '../doctor/doctor.service';

@Injectable()
export class AiRecommendationService {
  private genAI: GoogleGenerativeAI;
  private model: any;

  constructor(
    private configService: ConfigService,
    private doctorService: DoctorService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined in environment variables');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
  }

  async recommendDoctor(file: Express.Multer.File) {
    try {
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
      
      // Find the first occurrence of '{' and the last occurrence of '}'
      const jsonStartIndex = text.indexOf('{');
      const jsonEndIndex = text.lastIndexOf('}');
      
      if (jsonStartIndex === -1 || jsonEndIndex === -1) {
        throw new Error('Failed to find JSON in AI response');
      }

      const jsonString = text.substring(jsonStartIndex, jsonEndIndex + 1);
      const aiAnalysis = JSON.parse(jsonString);

      // Search for doctors based on the specialist type
      const doctors = await this.doctorService.findAllDoctors({
        specialization: aiAnalysis.specialistType,
        availability: 'true',
      });

      return {
        analysis: aiAnalysis,
        recommendedDoctors: doctors.data,
      };
    } catch (error) {
      console.error('AI Recommendation Error:', error);
      throw new InternalServerErrorException('Failed to process report with AI');
    }
  }
}
