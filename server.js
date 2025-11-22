// server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const app = express();
const PORT = process.env.PORT || 3000;

// Allow your frontend (running on a different port) to access this server
app.use(cors());
app.use(express.json());

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post('/api/analyze', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL is required" });
    }

    console.log(`Analyzing URL: ${url}`);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `
      Analyze this e-commerce competitor URL: ${url}
      Return a valid JSON object with the following structure:
      {
        "title": "Store Name",
        "riskScore": 85,
        "insights": ["Insight 1", "Insight 2", "Insight 3"],
        "plan": ["Tactic 1", "Tactic 2", "Tactic 3"]
      }
      Do NOT use Markdown code blocks. Just return raw JSON.
    `;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean up if the AI accidentally adds markdown
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();

    const data = JSON.parse(text);
    // Attach the URL back to the response so the frontend can display it
    data.url = url;

    res.json(data);

  } catch (error) {
    console.error("Server Error:", error);
    res.status(500).json({ 
      error: "Analysis failed. Ensure your API key is valid.",
      details: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
