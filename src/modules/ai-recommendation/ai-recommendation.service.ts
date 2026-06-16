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
          "specialistType": "A comma-separated list of EXACT medical specialist titles ONLY (e.g. 'Endocrinologist, Hematologist, General Physician'). Do not include explanations.",
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

      // Improved Recommendation Logic: Clean the specialist string and search
      const specialistSuggestions = aiAnalysis.specialistType
        .replace(/\([^)]*\)/g, '') // Remove everything in parentheses
        .split(/[,\/]/)
        .map((s: string) => 
          s.replace(/and potentially an|or potentially an|and|or|potentially/gi, '') // Remove filler words
           .trim()
        )
        .filter((s: string) => s.length > 2); // Ignore very short/empty strings

      console.log('Extracted specialist keywords for search:', specialistSuggestions);

      let recommendedDoctors: any[] = [];

      // We search for the first few suggested specializations to find matching doctors
      for (const spec of specialistSuggestions) {
        const result = await this.doctorService.findAllDoctors({
          specialization: spec,
          availability: 'true',
          limit: 5,
        });
        if (result.data && result.data.length > 0) {
          recommendedDoctors = [...recommendedDoctors, ...result.data];
        }
        // If we found enough doctors, stop searching
        if (recommendedDoctors.length >= 10) break;
      }

      // Deduplicate by ID
      const uniqueDoctors = Array.from(
        new Map(recommendedDoctors.map((d) => [d.id, d])).values(),
      );

      return {
        analysis: aiAnalysis,
        recommendedDoctors: uniqueDoctors,
      };
    } catch (error) {
      console.error('DETAILED AI ERROR:', error);
      throw new InternalServerErrorException(`AI Processing Error: ${error.message}`);
    }
  }
}
