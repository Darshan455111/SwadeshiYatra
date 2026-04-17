import { GoogleGenerativeAI } from '@google/generative-ai';

const key = 'AIzaSyD96HaWG-eoJGJdrquD7ywoTbOycepZmjo';
const genAI = new GoogleGenerativeAI(key);
const models = ['gemini-2.0-flash', 'gemini-2.0-flash-lite', 'gemini-2.5-flash'];

for (const m of models) {
  try {
    const model = genAI.getGenerativeModel({ model: m });
    const result = await model.generateContent('Say OK in JSON: {"status":"ok"}');
    console.log('✅ OK:', m, '->', result.response.text().slice(0, 60));
  } catch(e) {
    console.log('❌ FAIL:', m, '->', e.message.slice(0, 120));
  }
}
