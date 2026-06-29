const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
const prompt = "You are an AI Assistant for a School Administration Platform. You are talking to a Super Administrator (platform-wide access) of a global platform. Query: 'hello'. Use this context data to answer if relevant: {}";
model.generateContent(prompt).then(r => console.log('SUCCESS')).catch(e => console.log('ERROR:', e.message));
