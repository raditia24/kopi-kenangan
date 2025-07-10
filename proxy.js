// proxy.js
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(__dirname)); // Serve HTML, CSS, JS dari folder ini

const GEMINI_API_KEY = 'AIzaSyAnRwXM3U_pCWAPUrWVKxoSNQOtaHeGJJA';
const GEMINI_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';

app.post('/gemini', async (req, res) => {
  try {
    const prompt = req.body.prompt;
    const response = await axios.post(
      `${GEMINI_URL}?key=${GEMINI_API_KEY}`,
      {
        contents: [{ parts: [{ text: prompt }] }]
      }
    );

    const result = response.data.candidates[0].content.parts[0].text;
    res.json({ reply: result });
  } catch (error) {
    console.error('Gemini error:', error.message);
    res.status(500).json({ reply: "Maaf, saya tidak bisa menjawab saat ini." });
  }
});

app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
