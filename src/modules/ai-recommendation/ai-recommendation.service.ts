import {
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import {
  HumanMessage,
  SystemMessage,
  ToolMessage,
} from '@langchain/core/messages';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { DoctorService } from '../doctor/doctor.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { DoctorAvailabilityService } from '../doctor/doctor-availability.service';
import { PatientService } from '../patient/patient.service';
import { AiChatDto } from './dto/ai-chat.dto';

@Injectable()
export class AiRecommendationService {
  private readonly logger = new Logger(AiRecommendationService.name);
  private model: ChatGoogleGenerativeAI;
  private visionModel: ChatGoogleGenerativeAI;

  constructor(
    private readonly configService: ConfigService,
    private readonly doctorService: DoctorService,
    private readonly appointmentsService: AppointmentsService,
    private readonly availabilityService: DoctorAvailabilityService,
    private readonly patientService: PatientService,
  ) {
    const apiKey = this.configService.get<string>('GEMINI_API_KEY');
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not defined');
    }

    this.model = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0,
    });

    this.visionModel = new ChatGoogleGenerativeAI({
      apiKey,
      model: 'gemini-2.5-flash',
      temperature: 0,
    });
  }

  private getTools(userId: number) {
    return [
      new DynamicStructuredTool({
        name: 'get_available_slots',
        description:
          'Get available appointment slots for a doctor on a specific date.',
        schema: z.object({
          doctorId: z.number().describe('The ID of the doctor'),
          date: z.string().describe('The date in YYYY-MM-DD format'),
        }),
        func: async ({ doctorId, date }) => {
          const slots = await this.availabilityService.getAvailableSlots(
            doctorId,
            date,
          );
          return JSON.stringify(slots);
        },
      }),
      new DynamicStructuredTool({
        name: 'book_appointment',
        description: 'Book an appointment for the patient with a doctor.',
        schema: z.object({
          doctorId: z.number().describe('The ID of the doctor'),
          date: z.string().describe('The date in YYYY-MM-DD format'),
          startTime: z.string().describe('Start time in HH:MM format'),
          endTime: z.string().describe('End time in HH:MM format'),
        }),
        func: async ({ doctorId, date, startTime, endTime }) => {
          const appointment = await this.appointmentsService.bookAppointment(
            userId,
            {
              doctorId,
              date,
              startTime,
              endTime,
            },
          );
          return JSON.stringify(appointment);
        },
      }),
      new DynamicStructuredTool({
        name: 'search_doctors',
        description: 'Search for doctors by name or specialization.',
        schema: z.object({
          search: z
            .string()
            .optional()
            .describe('Search term (name or specialization)'),
          specialization: z
            .string()
            .optional()
            .describe('Specific specialization to filter by'),
        }),
        func: async ({ search, specialization }) => {
          const doctors = await this.doctorService.findAllDoctors({
            search,
            specialization,
          });
          return JSON.stringify(doctors);
        },
      }),
    ];
  }

  async recommendDoctor(file: Express.Multer.File) {
    this.logger.log(`Analyzing report: ${file.originalname} using LangChain`);

    try {
      const prompt = `
        Analyze this medical report and provide the following in JSON format:
        {
          "condition": "Brief description of the medical condition",
          "specialistType": "A comma-separated list of EXACT medical specialist titles ONLY (e.g. 'Endocrinologist, Hematologist, General Physician').",
          "summary": "A professional summary of the report for the patient",
          "preMedicine": "Safe, over-the-counter pre-medicine or first-aid advice."
        }
        Only return the JSON.
      `;

      const message = new HumanMessage({
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          },
        ],
      });

      const response = await this.visionModel.invoke([message]);
      const text = response.content as string;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error('No JSON found in AI response');

      const aiAnalysis = JSON.parse(jsonMatch[0]) as {
        condition: string;
        specialistType: string;
        summary: string;
        preMedicine: string;
      };

      const specialistSuggestions = aiAnalysis.specialistType
        .split(/[,/]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 2);

      const recommendedDoctors: { id: number; [key: string]: unknown }[] = [];
      for (const spec of specialistSuggestions) {
        const doctorsResult = await this.doctorService.findAllDoctors({
          specialization: spec,
          availability: 'true',
          limit: 3,
        });
        if (doctorsResult.data) {
          const formattedDoctors = (doctorsResult.data as unknown as any[]).map(
            (d: any) => ({
              ...d,
              id: d.id as number,
            }),
          );
          recommendedDoctors.push(...formattedDoctors);
        }
      }

      const uniqueDoctors = Array.from(
        new Map(recommendedDoctors.map((d) => [d.id, d])).values(),
      );

      return {
        analysis: aiAnalysis,
        recommendedDoctors: uniqueDoctors,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI Recommendation Error: ${errorMessage}`);
      throw new InternalServerErrorException(errorMessage);
    }
  }

  async chatWithAgent(userId: number, dto: AiChatDto) {
    const profile = await this.patientService.getProfile(userId);
    if (!profile) throw new NotFoundException('Patient profile not found');

    const patientProfile = profile as {
      fullName: string;
      age: number;
      gender: string;
    };

    const systemInstruction = `
      You are Schedula AI, a professional Medical Assistant.

      PATIENT PROFILE:
      - Name: ${patientProfile.fullName}
      - Age: ${patientProfile.age}
      - Gender: ${patientProfile.gender}

      
      MEDICAL CONTEXT (from uploaded reports/analysis):
      ${dto.context || 'No specific report context provided yet.'}
      
      YOUR ROLE:
      Help the patient navigate their healthcare journey. You MUST verify that the doctor and their availability are real before attempting to book.
      
      SECURITY & VERIFICATION PROTOCOLS:
      - PROFILE VERIFICATION: You are chatting with a real patient (${patientProfile.fullName}). All bookings you make will be tied to their verified ID.
      - DOCTOR VALIDATION: Use 'search_doctors' or find details in context to ensure you are booking with a real, active doctor.
      - AVAILABILITY VERIFICATION: NEVER assume a slot is open. You MUST call 'get_available_slots' for a specific date before calling 'book_appointment'.
      - DOUBLE BOOKING: The system will automatically prevent you from booking the same slot twice.
      
      CAPABILITIES:
      1. search_doctors: Find real doctors by name or specialization.
      2. get_available_slots: Verify real-time slot availability for a doctor.
      3. book_appointment: Call this ONLY when you have confirmed a specific slot with a specific, real doctor and the patient has agreed.
      
      CONSTRAINTS:
      - ALWAYS check availability before booking.
      - If the patient refers to "the recommended doctor", look into the MEDICAL CONTEXT to find who they are.
      - Be empathetic but concise. 
      - Do not provide medical prescriptions.
      - If a tool returns data, summarize it naturally for the patient.
    `;

    try {
      const tools = this.getTools(userId);
      const modelWithTools = this.model.bindTools(tools);

      const messages = [
        new SystemMessage(systemInstruction),
        new HumanMessage(dto.message),
      ];

      const response = await modelWithTools.invoke(messages);

      if (response.tool_calls && response.tool_calls.length > 0) {
        const toolCall = response.tool_calls[0];
        const tool = tools.find((t) => t.name === toolCall.name);

        if (tool) {
          const toolArgs = toolCall.args as Record<string, unknown>;
          this.logger.log(
            `LangChain triggering tool: ${tool.name} with args: ${JSON.stringify(toolArgs)}`,
          );

          const toolResult = (await (tool as any).invoke(
            toolArgs as any,
          )) as string;

          const finalResponse = await this.model.invoke([
            ...messages,
            response,
            new ToolMessage({
              tool_call_id: toolCall.id ?? '',
              content: toolResult,
            }),
          ]);

          return {
            message: finalResponse.content as string,
            toolUsed: tool.name,
            toolResult: JSON.parse(toolResult) as unknown,
          };
        }
      }

      return {
        message: response.content as string,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      this.logger.error(`AI Agent Error: ${errorMessage}`);
      throw new InternalServerErrorException(errorMessage);
    }
  }
}
