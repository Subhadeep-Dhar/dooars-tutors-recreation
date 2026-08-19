// @ts-nocheck
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { streamText, convertToModelMessages, tool } from 'ai';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const lastMsg = messages[messages.length - 1];
    const latestMessage = lastMsg?.content || lastMsg?.parts?.map((p: any) => p.text).join('') || '';

    let contextText = 'No specific tutors found for this query.';

    if (latestMessage) {
      try {
        // Fetch context from our backend
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
        const res = await fetch(`${apiUrl}/search/ai-context?q=${encodeURIComponent(latestMessage)}`);
        
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.context && data.context.length > 0) {
            contextText = JSON.stringify(data.context, null, 2);
          }
        }
      } catch (err) {
        console.error('Failed to fetch AI context from backend:', err);
      }
    }

    const systemPrompt = `You are a helpful and friendly AI assistant for "Dooars Tutors", a platform that connects students with private tutors, coaching centers, and trainers.
    
Your goal is to help users find the right tutor based on their query. 

Here are the top matching tutor profiles from our database based on the user's latest query:
${contextText}

Instructions:
1. Answer the user's question conversationally.
2. If the context contains relevant tutors, recommend them by name, mention their rating, fee, and subjects.
3. Be concise but helpful. Do not hallucinate tutors that are not in the provided context.
4. If no tutors are found in the context, politely inform the user that you couldn't find an exact match and suggest they adjust their search terms.
5. Keep your tone professional and encouraging.
6. When recommending specific tutors from the context, YOU MUST call the \`showTutorProfiles\` tool and YOU MUST pass the array of tutor objects to the \`tutors\` parameter. Never call the tool without providing the tutors data!`;

    const googleProvider = createGoogleGenerativeAI({
      apiKey: process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY || '',
    });

    const result = await streamText({
      model: googleProvider('gemini-3.6-flash') as any, // or whichever model is active
      system: systemPrompt,
      messages: await convertToModelMessages(messages),
      tools: {
        // @ts-ignore - Bypass Vercel AI SDK generic type inference bug for client-side tools
        showTutorProfiles: tool({
          description: 'Show tutor profiles as interactive cards in the chat UI. Call this tool when recommending specific tutors to the user.',
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
          })
        })
      }
    });

    return result.toUIMessageStreamResponse();
  } catch (error: any) {
    console.error('Chat API Error:', error);
    // If we get a 429 quota error, we handle it gracefully here so the UI doesn't break
    if (error?.message?.includes('429') || error?.status === 429 || error?.message?.includes('credits')) {
      return new Response(
        JSON.stringify({ error: 'I am currently experiencing high traffic and my API limits have been reached. Please try again later.' }),
        { status: 429, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(JSON.stringify({ error: 'An error occurred during chat processing.' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
