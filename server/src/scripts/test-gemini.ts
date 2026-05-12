import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('No API key');
    return;
  }
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  
  const models = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro'];
  
  for (const m of models) {
    try {
      console.log(`Testing model: ${m}...`);
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('ping');
      console.log(`✅ ${m} works: ${result.response.text()}`);
    } catch (err: any) {
      console.error(`❌ ${m} failed: ${err.message}`);
    }
  }
}

testModels();
