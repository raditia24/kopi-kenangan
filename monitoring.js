// Inisialisasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyBA_C0CVbAMipzGPE2wD9hY3-YoyNYPLMU",
  authDomain: "gps-tracker-4a27c.firebaseapp.com",
  projectId: "gps-tracker-4a27c",
  storageBucket: "gps-tracker-4a27c.appspot.com",
  messagingSenderId: "334120793213",
  appId: "1:334120793213:web:71b868b85bc6f01261ed14"
};
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// Tombol Sidebar
const dashboardBtn = document.getElementById("menu-dashboard");
const validasiBtn = document.getElementById("menu-validasi");
const informasiBtn = document.getElementById("menu-informasi");

// Navigasi Halaman (div main-*)
function tampilkanHalaman(id) {
  const halamanList = document.querySelectorAll("main > div");
  halamanList.forEach((div) => div.classList.add("hidden"));

  const target = document.getElementById(id);
  if (target) target.classList.remove("hidden");
}

// Navigasi Tombol Sidebar
if (dashboardBtn)
  dashboardBtn.addEventListener("click", () => window.location.href = "index.html");

if (validasiBtn)
  validasiBtn.addEventListener("click", () => tampilkanHalaman("main-validasi"));

if (informasiBtn)
  informasiBtn.addEventListener("click", () => tampilkanHalaman("main-informasi"));

// Tampilkan halaman validasi secara default saat pertama kali
tampilkanHalaman("main-validasi");

// Data Firestore → Tabel
const tabelBody = document.getElementById("validasi-body");

function loadDataMember() {
  db.collection("formulir").get().then((querySnapshot) => {
    if (!tabelBody) return;
    tabelBody.innerHTML = "";
    let no = 1;

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      const tr = document.createElement("tr");

      const start = data.periode?.start || "";
      const end = data.periode?.end || "";
      const role = data.role || "";

      const isExpired = () => {
        if (!start || !end) return true;
        const now = new Date();
        const endDate = new Date(end);
        return now > endDate;
      };

      tr.innerHTML = `
        <td class="border px-2 py-1 text-center">${no++}</td>
        <td class="border px-2 py-1">${data.nama || ""}</td>
        <td class="border px-2 py-1">${data.email || ""}</td>
        <td class="border px-2 py-1">
          <input type="date" value="${start}" class="periode-awal border rounded px-1"> –
          <input type="date" value="${end}" class="periode-akhir border rounded px-1">
        </td>
        <td class="border px-2 py-1">
          <input type="text" value="${role}" class="input-role border rounded px-1">
        </td>
        <td class="border px-2 py-1 text-center status ${isExpired() ? 'text-red-600' : 'text-green-600'}">
          ${isExpired() ? "Expired" : "Aktif"}
        </td>
      `;

      // Event Listener update Firestore
      tr.querySelector(".periode-awal").addEventListener("change", (e) => {
        updatePeriode(doc.id, e.target.value, tr.querySelector(".periode-akhir").value);
      });
      tr.querySelector(".periode-akhir").addEventListener("change", (e) => {
        updatePeriode(doc.id, tr.querySelector(".periode-awal").value, e.target.value);
      });
      tr.querySelector(".input-role").addEventListener("change", (e) => {
        db.collection("members").doc(doc.id).update({
          role: e.target.value
        });
      });

      tabelBody.appendChild(tr);
    });
  });
}

function updatePeriode(id, start, end) {
  db.collection("formulir").doc(id).update({
    periode: { start, end }
  }).then(() => {
    loadDataMember(); // Refresh untuk update status
  });
}

// Jalankan saat halaman selesai dimuat
document.addEventListener("DOMContentLoaded", loadDataMember);

// Referensi elemen
const pilihMember = document.getElementById("pilih-member");
const formChat = document.getElementById("chat-send-form");
const inputChat = document.getElementById("chat-input-admin");
const chatLog = document.getElementById("chat-log");

// 🔁 Load daftar member ke dropdown
function loadMemberList() {
  const pilihMember = document.getElementById("pilih-member");

  // Kosongkan dropdown sebelum isi ulang
  pilihMember.innerHTML = `<option value="">🔽 Pilih Member Tujuan</option>`;

  // Ambil semua data user dari Firestore
  db.collection("users")
    .orderBy("nama") // Opsional: urut berdasarkan nama
    .get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        const data = doc.data();
        const option = document.createElement("option");
        option.value = doc.id; // Gunakan doc.id sebagai ID unik
        option.textContent = data.nama || doc.id; // Tampilkan nama, fallback ke ID jika kosong
        pilihMember.appendChild(option);
      });
    })
    .catch(err => {
      console.error("Gagal memuat daftar member:", err);
      pilihMember.innerHTML = `<option disabled>⚠️ Gagal memuat data member</option>`;
    });
}

// 📩 Kirim pesan ke Firestore (koleksi: chat)
formChat.addEventListener("submit", (e) => {
  e.preventDefault();
  const pesan = inputChat.value.trim();
  const tujuanId = pilihMember.value;

  if (!pesan || !tujuanId) {
    alert("Pilih member dan isi pesan.");
    return;
  }

  db.collection("chat").add({
    dari: "admin",
    kepada: tujuanId,
    pesan,
    waktu: firebase.firestore.FieldValue.serverTimestamp()
  }).then(() => {
    inputChat.value = "";
  });
});

// 🔁 Tampilkan chat antara admin dan member yang dipilih
function listenToChat() {
  const pilihMember = document.getElementById("pilih-member");
  const chatLog = document.getElementById("chat-log");

  pilihMember.addEventListener("change", () => {
    const selectedId = pilihMember.value;

    if (!selectedId) {
      chatLog.innerHTML = "<p class='text-gray-400 text-sm italic'>Silakan pilih member untuk melihat riwayat chat.</p>";
      return;
    }

    // Dengarkan perubahan data secara realtime
    db.collection("chat")
      .where("kepada", "in", [selectedId, "admin"])
      .orderBy("waktu")
      .onSnapshot(snapshot => {
        chatLog.innerHTML = "";
        snapshot.forEach(doc => {
          const d = doc.data();

          // Tampilkan hanya chat terkait member terpilih
          const isDariAdmin = d.dari === "admin" && d.kepada === selectedId;
          const isDariUser = d.dari === selectedId && d.kepada === "admin";
          if (!isDariAdmin && !isDariUser) return;

          const bubble = document.createElement("div");
          bubble.className = "p-2 rounded mb-1 text-sm max-w-[70%] " + 
                             (d.dari === "admin" ? "bg-yellow-100 text-right ml-auto" : "bg-gray-100 text-left");
          bubble.textContent = d.pesan;
          chatLog.appendChild(bubble);
        });

        chatLog.scrollTop = chatLog.scrollHeight;
      });
  });
}

window.addEventListener("DOMContentLoaded", () => {
  loadMemberList();   // ⬅️ Panggil fungsi untuk isi dropdown member
  listenToChat();     // ⬅️ Panggil fungsi untuk pantau percakapan realtime
});


