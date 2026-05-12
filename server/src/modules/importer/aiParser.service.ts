import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { z } from 'zod';
import { env } from '../../config/env';
import { importerLogger } from './logger';
import { EnrichmentResult } from './types';

const EnrichmentSchema = z.object({
  subjects: z.array(z.string()).nullish(),
  classes: z.array(z.string()).nullish(),
  courses: z.array(z.string()).nullish(),
  boards: z.array(z.string()).nullish(),
  examPreparation: z.array(z.string()).nullish(),
  skills: z.array(z.string()).nullish(),
  whatsappNumber: z.string().nullish(),
  socialLinks: z.preprocess(
    (val) => (Array.isArray(val) && val.length === 0 ? {} : val),
    z.object({
      facebook: z.string().nullish(),
      instagram: z.string().nullish(),
      youtube: z.string().nullish(),
    })
  ).nullish(),
  enrichedDescription: z.string().nullish(),
  confidence: z.record(z.number()),
});

export class AiParserService {
  private genAI: GoogleGenerativeAI | null = null;
  private readonly CONFIDENCE_THRESHOLD = 0.65;

  constructor() {
    if (env.GEMINI_API_KEY) {
      this.genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
    }
  }

  async parseContent(text: string, reviews: string[] = []): Promise<EnrichmentResult | null> {
    if (!this.genAI) {
      importerLogger.warn('Gemini API key missing. Skipping AI enrichment.');
      return null;
    }

    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-flash-latest' });

      const prompt = `
        You are an expert at extracting structured educational data from website content and reviews.
        
        DATA:
        ---
        WEBSITE CONTENT:
        ${text.substring(0, 3000)}
        
        REVIEWS:
        ${reviews.join('\n\n').substring(0, 1000)}
        ---

        INSTRUCTIONS:
        Extract the following fields into a JSON object. 
        For each field, also provide a confidence score between 0 and 1.
        
        FIELDS:
        - subjects: List of subjects taught (e.g., Physics, Mathematics, Guitar).
        - classes: List of classes/standard ranges (e.g., Class 5, Class 10, XII).
        - courses: Specific course names (e.g., NEET Crash Course, Computer Basics).
        - boards: Educational boards (e.g., CBSE, ICSE, WBCHSE).
        - examPreparation: Competitive exams (e.g., JEE, NEET, UPSC).
        - skills: Non-academic skills (e.g., Coding, Bharatanatyam, Vocal).
        - whatsappNumber: Detect any WhatsApp number mentioned.
        - socialLinks: Detect Facebook, Instagram, or YouTube URLs.
        - enrichedDescription: A professional, 2-3 sentence summary of the offerings.
        - confidence: An object mapping each field name to its confidence score.

        RESPONSE FORMAT:
        Strict JSON only.
      `;

      const result = await model.generateContent(prompt);
      const response = result.response;
      const textResponse = response.text();
      
      importerLogger.debug(`[AI] Raw Response: ${textResponse}`);
      
      let jsonText = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const rawData = JSON.parse(jsonText);
      const validated = EnrichmentSchema.parse(rawData);

      // Token estimation (rough: 1 token ~= 4 chars)
      const inputTokens = Math.ceil(prompt.length / 4);
      const outputTokens = Math.ceil(textResponse.length / 4);
      importerLogger.info(`[AI] Token usage estimate: Input=${inputTokens}, Output=${outputTokens}, Total=${inputTokens + outputTokens}`);

      // Apply confidence threshold & discard low-confidence fields
      const filtered: Partial<EnrichmentResult> = {
        confidence: {},
        source: reviews.length > 0 ? 'mixed' : 'website'
      };

      for (const [key, value] of Object.entries(validated)) {
        if (key === 'confidence') continue;
        
        const confidence = validated.confidence[key] || 0;
        if (confidence >= this.CONFIDENCE_THRESHOLD) {
          (filtered as any)[key] = value;
          filtered.confidence![key] = confidence;
        } else {
          importerLogger.info(`[AI] Discarding low-confidence field: ${key} (${confidence})`);
        }
      }

      importerLogger.info(`[AI] Structured Output for ${reviews.length > 0 ? 'Mixed' : 'Website'} source:`, JSON.stringify(filtered, null, 2));
      return filtered as EnrichmentResult;

    } catch (err: any) {
      importerLogger.error('AI Parser Error:', err?.message || 'Unknown error');
      return null;
    }
  }
}
