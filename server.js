const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();
const port = 5500;

// 👉 Ini yang perlu ditambahkan:
app.use(express.static(__dirname)); // Menyajikan file dari folder root proyek

// Konfigurasi multer (lokasi folder simpan data)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "data"); // folder penyimpanan
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});
const upload = multer({ storage });

// Endpoint untuk terima formulir
app.post("/submit-form", upload.any(), (req, res) => {
  const data = {
    nama: req.body.nama,
    email: req.body.email,
    hp: req.body.hp,
    usia: req.body.usia,
    cerita: req.body.cerita,
    alasan: req.body.alasan,
    waktu: new Date().toLocaleString()
  };

  fs.writeFileSync(
    `data/${Date.now()}-${data.nama.replace(/\s/g, "_")}.json`,
    JSON.stringify(data, null, 2)
  );

  // ✅ redirect ke index.html (pastikan file ini ada)
  res.json({ success: true, redirect: "/index.html" });
});

app.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
});
