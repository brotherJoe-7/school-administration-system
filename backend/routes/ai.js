const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const tenantMiddleware = require('../middleware/tenantMiddleware');
const { GoogleGenerativeAI } = require("@google/generative-ai");

// GET /api/ai/suggestions
router.get('/suggestions', authenticate, tenantMiddleware, async (req, res) => {
  try {
    const suggestions = [
      { id: 1, type: 'alert', message: 'Attendance is below 70% in Computer Science Year 2. Send reminder?' },
      { id: 2, type: 'info', message: 'Tuition collection is 15% higher this month compared to last month.' },
      { id: 3, type: 'action', message: '3 pending payroll approvals require your attention.' }
    ];
    res.json({ success: true, data: suggestions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch AI suggestions' });
  }
});

// POST /api/ai/query - Natural language queries via Gemini
router.post('/query', authenticate, tenantMiddleware, async (req, res) => {
  const { query, contextData, contextType } = req.body;
  if (!query) return res.status(400).json({ success: false, message: 'Query is required' });

  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
      // Mock fallback if API key is not yet set
      let answer = `I've analyzed the ${contextType || 'school'} data. Everything is operating normally. (Add GEMINI_API_KEY to backend/.env for real responses)`;
      
      if (contextType === 'global platform') {
        if (query.toLowerCase().includes('revenue') || query.toLowerCase().includes('mrr')) {
          answer = "Looking at the global platform data, current MRR is $12,450. We've seen a 12% growth from last month. (Mock response without API key)";
        } else if (query.toLowerCase().includes('schools') || query.toLowerCase().includes('tenant')) {
          answer = "You currently have active tenants deployed. All isolated databases are fully synced and online. No anomalies detected. (Mock response without API key)";
        }
      } else {
        if (query.toLowerCase().includes('attendance')) {
          answer = "Looking at your school's attendance trends, there is a slight dip in Year 2 classes. 12 students have missed more than 3 classes this week. (Mock response without API key)";
        } else if (query.toLowerCase().includes('payroll')) {
          answer = "Your November payroll is ready for review. Total disbursement is $48,200 across 34 staff members in your institution. (Mock response without API key)";
        }
      }
      return res.json({ success: true, data: { answer } });
    }

    // Call Real Gemini API
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const prompt = `You are an AI Assistant for a School Administration Platform. You are talking to an admin of a ${contextType || 'school'}. 
Please answer the following administrative query in a helpful, concise, professional tone. 
Query: "${query}"
Use this context data to answer if relevant: ${JSON.stringify(contextData || {})}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    res.json({ success: true, data: { answer: text } });
  } catch (error) {
    console.error("Gemini Error:", error);
    // Return 200 so axios doesn't throw. We want the frontend to see the exact API key error!
    res.status(200).json({ success: false, message: `Gemini API Error: ${error.message}` });
  }
});

module.exports = router;
