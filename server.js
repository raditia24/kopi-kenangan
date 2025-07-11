const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// ✅ Tambahkan ini untuk memastikan fetch tersedia di Node.js
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

const app = express();
const PORT = 3000;

// ✅ API Key Gemini
const apiKey = "AIzaSyBoGgQAT-AGuiFv8DQ6t0nBnQMhf05T1rQ";

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// ✅ Redirect ke login.html saat buka root
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "login.html"));
});

// ✅ Konfigurasi penyimpanan untuk data form
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const folderPath = path.join(__dirname, "data");
    fs.mkdirSync(folderPath, { recursive: true });
    cb(null, folderPath);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  }
});
const upload = multer({ storage: storage });

// ✅ Endpoint AI Chat
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
    console.error("❌ Gagal mengambil jawaban dari AI:", err);
    res.status(500).json({ reply: "Gagal mengambil jawaban dari AI." });
  }
});

// ✅ Endpoint simpan data form + foto
app.post("/submit-form", upload.single("foto"), (req, res) => {
  const data = {
    nama: req.body.nama,
    email: req.body.email,
    nohp: req.body.nohp,
    usia: req.body.usia,
    cerita: req.body.cerita,
    opsi: req.body.opsi,
    filename: req.file ? req.file.filename : null,
    waktu: new Date().toISOString()
  };

  const filePath = path.join(__dirname, "data", `${Date.now()}-data.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

  res.send('<h2>✅ Terima kasih! Data kamu sudah tersimpan.</h2><a href="/form.html">Kembali ke Form</a>');
});

// ✅ Jalankan server
app.listen(PORT, () => {
  console.log("🚀 Server aktif dan siap menerima request!");
  console.log(`Server berjalan di http://localhost:${PORT}`);
});
