document.addEventListener("DOMContentLoaded", () => {
  const videoContainer = document.getElementById("videoContainer");
  const koleksiContainer = document.getElementById("koleksiContainer");

  if (videoContainer) {
    videoContainer.innerHTML = `
      <video src="video1.mp4" controls class="w-full rounded-lg"></video>
      <button onclick="tambahKeKoleksi('video1.mp4')" class="mt-2 bg-accent text-black px-3 py-1 rounded">Tambahkan ke Koleksi</button>
    `;
  }

  if (koleksiContainer) {
    const koleksi = JSON.parse(localStorage.getItem("koleksiSaya") || "[]");
    if (koleksi.length === 0) {
      koleksiContainer.innerHTML = "<p class='text-gray-400'>Belum ada video.</p>";
    } else {
      koleksi.forEach((src) => {
        koleksiContainer.innerHTML += `<video src="${src}" controls class="w-full rounded-lg"></video>`;
      });
    }
  }

  // 👇 Inisialisasi chatbot hanya jika elemen chat tersedia
  const chatForm = document.getElementById("chat-form");
  const chatInput = document.getElementById("chat-input");
  const chatMessages = document.getElementById("chat-messages");

  if (chatForm && chatInput && chatMessages) {
    chatForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const message = chatInput.value.trim();
      if (!message) return;

      // Tampilkan pesan pengguna
      appendMessage("Kamu", message, "user");
      chatInput.value = "";

      // Kirim ke server
      try {
        const res = await fetch("/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: message }), // ✅ WAJIB gunakan 'prompt'
        });

        const data = await res.json();
        appendMessage("Robo", data.reply, "robo");
      } catch (err) {
        appendMessage("Robo", "Maaf, terjadi kesalahan saat menghubungi AI.", "robo");
        console.error(err);
      }
    });

    // Tampilkan pesan otomatis saat awal
    appendMessage("Robo", "Hai! Saya Robo, siap bantu kamu menggunakan VideoLucu+ 😊", "robo");
  }
});

// Fungsi helper
function tambahKeKoleksi(videoSrc) {
  const koleksi = JSON.parse(localStorage.getItem("koleksiSaya") || "[]");
  if (!koleksi.includes(videoSrc)) {
    koleksi.push(videoSrc);
    localStorage.setItem("koleksiSaya", JSON.stringify(koleksi));
    alert("Video ditambahkan ke koleksi!");
  }
}

function appendMessage(sender, text, role) {
  const chatMessages = document.getElementById("chat-messages");
  if (!chatMessages) return;
  const warna = role === "user" ? "blue" : "black";
  chatMessages.innerHTML += `
    <div style="margin-bottom: 8px;">
      <strong style="color: ${warna};">${sender}:</strong>
      <span>${text}</span>
    </div>
  `;
  chatMessages.scrollTop = chatMessages.scrollHeight;
}
