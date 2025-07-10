const express = require("express");
const cors = require("cors");
const path = require("path");

// ✅ Tambahkan ini untuk memastikan fetch tersedia di Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const app = express();
const PORT = 3000;

// ✅ API Key yang kamu dapat dari AI Studio (BUKAN Google Cloud Console)
const apiKey = "AIzaSyBoGgQAT-AGuiFv8DQ6t0nBnQMhf05T1rQ";

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname)));

app.post("/chat", async (req, res) => {
  const { prompt } = req.body;

  console.log("🔥 Permintaan masuk ke /chat");
  console.log("Prompt:", prompt);

  if (!prompt || prompt.trim() === "") {
    return res.status(400).json({ reply: "Prompt kosong. Harap isi pesan untuk AI." });
  }

  try {
    const response = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      }),
    });

    const data = await response.json();
    console.log("✅ Respons dari Gemini:", JSON.stringify(data, null, 2));

    if (data.error) {
      console.error("❌ Error dari Gemini:", data.error);
      return res.status(500).json({ reply: data.error.message || "Gagal mengambil jawaban dari AI." });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "Maaf, tidak ada jawaban dari AI.";
    res.json({ reply });
  } catch (err) {
    console.error("❌ Gagal mengambil jawaban dari AI:");
    console.error(err);
    res.status(500).json({ reply: "Gagal mengambil jawaban dari AI." });
  }
});

app.listen(PORT, () => {
  console.log("🚀 Server aktif dan siap menerima request!");
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
