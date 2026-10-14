// @ts-nocheck
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, tool } from 'ai';
import { z } from 'zod';

const MAX_QUERY_CHARS = 300;
const MAX_HISTORY_MESSAGES = 6;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!Array.isArray(messages) || messages.length === 0) {
      return new Response(JSON.stringify({ error: 'Messages array is required.' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const lastMsg = messages[messages.length - 1];
    const latestRaw = lastMsg?.content || lastMsg?.parts?.map((p: any) => p.text).join('') || '';

    // 1. Strict length enforcement to minimize useless token consumption
    const latestMessage = latestRaw.trim().slice(0, MAX_QUERY_CHARS);

    let contextText = 'No specific tutors found for this query.';

    if (latestMessage) {
      try {
        // Fetch context from backend with proper port 4000 fallback & timeout
        const apiUrl = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 9000);

        const res = await fetch(`${apiUrl}/search/ai-context?q=${encodeURIComponent(latestMessage)}`, {
          signal: controller.signal,
          headers: { 'Accept': 'application/json' },
        });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json();
          if (data.success && Array.isArray(data.context) && data.context.length > 0) {
            contextText = JSON.stringify(data.context, null, 2);
          }
        }
      } catch (err: any) {
        console.error('Failed to fetch AI context from backend:', err?.message || err);
      }
    }

    const systemPrompt = `You are a helpful and friendly AI educational advisor for "Dooars Tutors", a platform connecting students with verified private tutors, coaching centers, sports trainers, and art mentors in Dooars and North Bengal.

Here are the top matching tutor profiles retrieved from the platform database for the user's request:
${contextText}

Guidelines:
1. Answer the user conversationally, warmly, and helpfully.
2. If matching tutors are present in the context, recommend them by name and highlight their subject, location, rating, and fee.
3. Be concise and accurate. NEVER hallucinate or invent tutor profiles not present in the provided context.
4. If no tutors are found in the context, politely inform the user that no exact match is currently listed for those specific criteria and recommend trying related subjects or nearby towns.
5. CRITICAL: When recommending specific tutors from the context, YOU MUST invoke the 'showTutorProfiles' tool with the tutor details so cards appear in the UI.
6. CRITICAL: Do NOT print repetitive raw data blocks in text; let the interactive cards display the structured details.`;

    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    });

    // Window history to last N messages to maintain low token latency
    const boundedMessages = messages.slice(-MAX_HISTORY_MESSAGES).map((msg: any) => ({
      role: msg.role,
      content: (msg.content || msg.parts?.map((p: any) => p.text).join('') || '').slice(0, MAX_QUERY_CHARS),
    }));

    const result = await streamText({
      model: googleProvider('gemini-2.5-flash') as any,
      system: systemPrompt,
      messages: boundedMessages,
      tools: {
        showTutorProfiles: tool({
          description: 'Show tutor profiles as interactive cards in the chat UI. Call this tool when recommending tutors from the context.',
          parameters: z.object({
            tutors: z.array(z.object({
              id: z.string().describe('The unique ID of the tutor'),
              name: z.string().describe('The name of the tutor or organization'),
              experience: z.number().optional().describe('Years of experience'),
              rating: z.number().optional().describe('Rating out of 5'),
              subjects: z.array(z.string()).optional().describe('List of subjects taught'),
              location: z.string().optional().describe('City or area'),
              fee: z.number().optional().describe('Monthly fee')
            }))
          }),
          execute: async ({ tutors }) => {
            return { tutors };
          }
        })
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    const errorMessage = error?.message || 'An error occurred during chat processing.';
    
    // Quota limits / 429
    if (errorMessage.includes('429') || error?.status === 429 || errorMessage.includes('quota') || errorMessage.includes('credits')) {
      return new Response(
        JSON.stringify({ error: 'I am currently experiencing high demand and API rate limits have been reached. Please try again in a few moments.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    // Invalid / missing API Key
    if (errorMessage.includes('403') || errorMessage.includes('API key') || errorMessage.includes('unregistered callers')) {
      return new Response(
        JSON.stringify({ error: 'The AI Service is temporarily unconfigured. Please contact platform support.' }),
        { status: 403, headers: { 'Content-Type': 'application/json' } }
      );
    }
    
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
