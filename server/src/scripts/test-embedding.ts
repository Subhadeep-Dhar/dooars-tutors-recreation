import { GoogleGenerativeAI } from '@google/generative-ai';
import { env } from '../config/env';

async function testEmbedding() {
  if (!env.GEMINI_API_KEY) {
    console.error('No GEMINI_API_KEY found');
    process.exit(1);
  }

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const modelName = 'text-embedding-004';
  console.log('Testing embedding with model: ' + modelName);

  try {
    const model = genAI.getGenerativeModel({ model: modelName });
    const text = 'Testing the embedding generation.';
    const result = await model.embedContent(text);
    const embedding = result.embedding;
    console.log('Successfully generated embedding!');
    console.log('Dimensions: ' + embedding.values.length);
  } catch (error) {
    console.error('Failed to generate embedding:', error);
  }
}

testEmbedding().catch(console.error);