import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function listModels() {
  if (!process.env.GEMINI_API_KEY) {
    console.error('No API key');
    return;
  }
  
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    const data = await response.json();
    console.log(JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(err);
  }
}

listModels();
