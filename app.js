// Warna tema untuk kartu member
const warnaTema = [
  "bg-blue-100 text-blue-800",
  "bg-red-100 text-red-800",
  "bg-green-100 text-green-800",
  "bg-yellow-100 text-yellow-800",
  "bg-purple-100 text-purple-800",
  "bg-pink-100 text-pink-800",
  "bg-indigo-100 text-indigo-800",
  "bg-teal-100 text-teal-800",
  "bg-orange-100 text-orange-800",
];

// Firebase config dan inisialisasi
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

let map;
let markers = [];
let watchId = null;

function initMap() {
  const lokasiAwal = { lat: -6.200000, lng: 106.816666 }; // contoh: Jakarta
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 10,
    center: lokasiAwal,
  });

  new google.maps.Marker({
    position: lokasiAwal,
    map: map,
    title: "Lokasi Awal",
  });
}

// Navigasi
const sections = {
  profil: document.getElementById("main-profil"),
  member: document.getElementById("main-member"),
  location: document.getElementById("main-location"),
};

function showSection(id) {
  document.querySelectorAll("[id^='main-']").forEach((el) => {
    el.classList.add("hidden");
  });

  const target = document.getElementById("main-" + id);
  if (target) {
    target.classList.remove("hidden");
    target.scrollIntoView({ behavior: "smooth" });
  }

  if (id === "member") {
    renderDaftarMember();
  }
}

document.getElementById("menu-profil").addEventListener("click", (e) => {
  e.preventDefault();
  showSection("profil");
});

document.getElementById("menu-member").addEventListener("click", (e) => {
  e.preventDefault();
  showSection("member");
});

document.getElementById("menu-location").addEventListener("click", (e) => {
  e.preventDefault();
  showSection("location");

  if (!map) initMap();

  ambilDanTampilkanLokasiMember();

  if (window._refreshInterval) clearInterval(window._refreshInterval);
  window._refreshInterval = setInterval(ambilDanTampilkanLokasiMember, 30000);
});

function tampilkanMarker(memberList) {
  markers.forEach(marker => marker.setMap(null));
  markers.length = 0;

  memberList.forEach(member => {
    if (member.latitude && member.longitude) {
      const marker = new google.maps.Marker({
        position: { lat: member.latitude, lng: member.longitude },
        map,
        title: member.nama || "Member"
      });

      const infoWindow = new google.maps.InfoWindow({
        content: `<div><strong>${member.nama}</strong><br/>${member.role || "Member"}</div>`
      });

      marker.addListener("click", () => infoWindow.open(map, marker));
      markers.push(marker);
    }
  });
}

function logout() {
  firebase.auth().signOut()
    .then(() => {
      window.location.href = "login.html";
    })
    .catch(error => {
      console.error("Gagal logout:", error);
    });
}

function mulaiPantauLokasiRealTime(user) {
  if (!navigator.geolocation) {
    console.warn("Geolocation tidak didukung oleh browser ini.");
    return;
  }

  watchId = navigator.geolocation.watchPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lng = pos.coords.longitude;

      try {
        const userRef = await firebase.firestore().collection("user").where("email", "==", user.email).get();
        if (!userRef.empty) {
          const docId = userRef.docs[0].id;
          await firebase.firestore().collection("user").doc(docId).update({
            latitude: lat,
            longitude: lng,
            terakhirAktif: firebase.firestore.FieldValue.serverTimestamp()
          });
          console.log("Lokasi diperbarui:", lat, lng);
        }
      } catch (err) {
        console.error("Gagal memperbarui lokasi:", err);
      }
    },
    (err) => {
      console.error("Gagal mendapatkan lokasi:", err.message);
    },
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 10000
    }
  );
}

document.addEventListener("DOMContentLoaded", () => {
  showSection("profil");

  firebase.auth().onAuthStateChanged((user) => {
    if (user) {
      tampilkanDataPengguna(user);
      mulaiPantauLokasiRealTime(user);
    } else {
      console.warn("User belum login.");
      window.location.href = "login.html";
    }
  });
});

async function ambilDanTampilkanLokasiMember() {
  try {
    const snapshot = await firebase.firestore().collection("user").get();
    const members = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.latitude && data.longitude) {
        members.push({
          nama: data.nama,
          latitude: data.latitude,
          longitude: data.longitude,
          role: data.role
        });
      }
    });

    tampilkanMarker(members);

    if (members.length > 0) {
      map.setCenter({ lat: members[0].latitude, lng: members[0].longitude });
    }
  } catch (error) {
    console.error("Gagal mengambil data lokasi:", error);
  }
}

// ... sisanya tetap seperti sebelumnya tanpa diubah (fungsi tampilkanDataPengguna, renderDaftarMember, dsb.)
async function tampilkanDataPengguna(user) {
  console.log("User login:", user.email);
  try {
    const snapshot = await firebase.firestore()
      .collection("user")
      .where("uid", "==", user.uid)
      .get();

    if (snapshot.empty) {
      console.warn("Data tidak ditemukan untuk:", user.uid);
      return;
    }

    const data = snapshot.docs[0].data();

    document.getElementById("profil-uid").textContent = data.uid || "-";
    document.getElementById("profil-nama").textContent = data.nama || "-";
    document.getElementById("profil-email").textContent = data.email || user.email || "-";
    document.getElementById("profil-usia").textContent = data.usia || "-";
    document.getElementById("profil-hp").textContent = data.hp || "-";
    document.getElementById("profil-asal").textContent = data.asal || "-";
    document.getElementById("profil-alasan").textContent = data.alasan || "-";
    document.getElementById("profil-cerita").textContent = data.cerita || "-";
    document.getElementById("badge-status").textContent = data.role || "Member";

    const interpretasi = data.interpretasi;
    const container = document.getElementById("profil-interpretasi");
    container.innerHTML = "";

    const warnaGradasi = [
      { bg: "from-rose-100 via-pink-50 to-red-100", border: "border-rose-400", text: "text-rose-700" },
      { bg: "from-yellow-100 via-orange-50 to-yellow-200", border: "border-yellow-400", text: "text-yellow-700" },
      { bg: "from-blue-100 via-indigo-50 to-sky-100", border: "border-blue-400", text: "text-blue-700" },
      { bg: "from-purple-100 via-pink-50 to-fuchsia-100", border: "border-purple-400", text: "text-purple-700" },
      { bg: "from-green-100 via-lime-50 to-emerald-100", border: "border-green-400", text: "text-green-700" },
      { bg: "from-cyan-100 via-sky-50 to-teal-100", border: "border-cyan-400", text: "text-cyan-700" }
    ];

    if (interpretasi) {
      if (Array.isArray(interpretasi)) {
        interpretasi.forEach((item, i) => {
          const warna = warnaGradasi[i % warnaGradasi.length];
          const div = document.createElement("div");
          div.className = `p-4 rounded-xl shadow-md bg-gradient-to-r ${warna.bg} border-l-4 ${warna.border} animate-fadeIn`;
          div.innerHTML = `<div class="text-sm ${warna.text} font-semibold mb-1">Poin ${i + 1}</div>
                            <div class="text-gray-800 text-sm leading-relaxed">${item}</div>`;
          container.appendChild(div);
        });
      } else if (typeof interpretasi === "object") {
        Object.entries(interpretasi).forEach(([key, value], i) => {
          const warna = warnaGradasi[i % warnaGradasi.length];
          const div = document.createElement("div");
          div.className = `p-4 rounded-xl shadow-md bg-gradient-to-r ${warna.bg} border-l-4 ${warna.border} animate-fadeIn`;
          div.innerHTML = `<div class="text-sm ${warna.text} font-semibold mb-1">${key}</div>
                           <div class="text-gray-800 text-sm leading-relaxed">${value}</div>`;
          container.appendChild(div);
        });
      } else {
        const div = document.createElement("div");
        div.className = `p-4 rounded-xl shadow-md bg-gradient-to-r from-gray-100 via-white to-gray-50 border-l-4 border-gray-400 text-gray-800 animate-fadeIn`;
        div.innerHTML = `<div class="text-sm leading-relaxed">${interpretasi}</div>`;
        container.appendChild(div);
      }
    } else {
      container.innerHTML = `<div class="bg-gray-100 p-3 rounded text-gray-600">Belum ada hasil interpretasi.</div>`;
    }

  } catch (error) {
    console.error("Gagal mengambil data profil:", error);
  }
}

function formatAktif(timestamp) {
  if (!timestamp || !timestamp.toDate) return "-";
  const waktu = timestamp.toDate();
  return `Aktif: ${waktu.toLocaleDateString()} ${waktu.toLocaleTimeString()}`;
}

function bukaChat(email) {
  const modal = document.getElementById("chatModal");
  const title = document.getElementById("chatModalTitle");
  modal.classList.remove("hidden");
  title.textContent = "Chat dengan " + email;
}

function closeChatModal() {
  document.getElementById("chatModal").classList.add("hidden");
}

function kirimChat() {
  alert("Fungsi kirimChat belum diimplementasikan.");
}

function buatKartuMember(member) {
  const div = document.createElement("div");
  const warna = member.warna || "bg-white";

  div.className = `${warna} border-2 border-black rounded-2xl p-4 relative overflow-hidden shadow min-h-[120px] flex`;

  // Elemen kiri (teks + tombol)
  const kiri = document.createElement("div");
  kiri.className = "flex flex-col justify-between flex-1 pr-4";

  const status = document.createElement("div");
  status.innerHTML = `
    <p class="text-sm font-semibold text-gray-600 mb-1">Status</p>
    <h2 class="text-xl font-bold text-gray-800 mb-1">${member.nama || "-"}</h2>
    <p class="text-sm text-red-600 mb-2">Members are required to follow all membership condition.⚠️</p>
  `;
  kiri.appendChild(status);

  // Garis horizontal tipis
  const garis = document.createElement("div");
  garis.className = "w-full border-t border-gray-300 my-1";
  kiri.appendChild(garis);

  // Tombol member dan chat
  const rowAksi = document.createElement("div");
  rowAksi.className = "flex justify-between items-center mt-1";
  const btnMember = document.createElement("button");
  btnMember.className = "bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold shadow";
  btnMember.textContent = "member";

  const btnChat = document.createElement("button");
  btnChat.className = "bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm font-semibold shadow";
  btnChat.textContent = "CHAT";
  btnChat.onclick = () => bukaChat(member.email);

  rowAksi.appendChild(btnMember);
  rowAksi.appendChild(btnChat);
  kiri.appendChild(rowAksi);

  // Waktu aktif
  const waktu = document.createElement("p");
  waktu.className = "text-center text-xs text-gray-500 mt-2 mb-1";
  waktu.textContent = `Aktif: ${formatAktif(member.terakhirAktif)}`;
  kiri.appendChild(waktu);

  // Elemen kanan (foto)
  const kanan = document.createElement("div");
  kanan.className = "w-[96px] h-[128px] rounded-xl overflow-hidden border border-black shadow-md";
  const img = document.createElement("img");
  img.src = member.foto;
  img.alt = `Foto ${member.nama}`;
  img.className = "w-full h-full object-cover";
  kanan.appendChild(img);

  // Gabung ke kartu utama
  div.appendChild(kiri);
  div.appendChild(kanan);

  // === Tambah indikator status online/offline di pojok kanan bawah kartu ===
  const indikatorStatus = document.createElement("div");
  indikatorStatus.className = `w-3 h-3 rounded-full absolute bottom-2 right-2 border-2 border-white ${
    member.aktif ? "bg-green-500" : "bg-red-500"
  }`;
  div.appendChild(indikatorStatus);

  return div;
}

let semuaMember = []; // Untuk menyimpan semua data member

async function renderDaftarMember() {
  try {
    const snapshot = await firebase.firestore().collection("user").get();
    semuaMember = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      semuaMember.push({
        ...data,
        id: doc.id,
        warna: warnaTema[Math.floor(Math.random() * warnaTema.length)]
      });
    });

    tampilkanMemberDenganFilter(); // render awal
  } catch (error) {
    console.error("Gagal memuat data member:", error);
  }
}

function tampilkanMemberDenganFilter() {
  const keyword = document.getElementById("searchMember").value.toLowerCase();
  const role = document.getElementById("filterRole").value;

  const hasil = semuaMember.filter(member => {
    const cocokRole = role === "" || member.role === role;
    const cocokNama = member.nama?.toLowerCase().includes(keyword);
    return cocokRole && cocokNama;
  });

  const list = document.getElementById("member-list");
  list.innerHTML = "";

  hasil.forEach(member => {
    list.appendChild(buatKartuMember(member));
  });

  // info halaman bisa ditambahkan di sini nanti
}

// setelah semua fungsi di atas di buat, tambahkan event listener
document.getElementById("searchMember").addEventListener("input", tampilkanMemberDenganFilter);
document.getElementById("filterRole").addEventListener("change", tampilkanMemberDenganFilter);


// Fungsi menghitung jarak antara dua koordinat
function hitungJarak(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius bumi dalam km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Tampilkan lokasi semua member di map
async function ambilDanTampilkanLokasiMember() {
  try {
    const snapshot = await firebase.firestore().collection("user").get();
    const members = [];

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.latitude && data.longitude) {
        members.push({
          nama: data.nama,
          latitude: data.latitude,
          longitude: data.longitude,
          role: data.role
        });
      }
    });

    tampilkanMarker(members);

    if (members.length > 0) {
      map.setCenter({ lat: members[0].latitude, lng: members[0].longitude });
    }
  } catch (error) {
    console.error("Gagal mengambil data lokasi:", error);
  }
}

// Tampilkan data lokasi ke tabel dan marker
async function muatDataLokasiMember(radiusFilter = null) {
  const user = firebase.auth().currentUser;
  if (!user) return;

  const userSnapshot = await db.collection("user").where("email", "==", user.email).get();
  if (userSnapshot.empty) return;

  const userData = userSnapshot.docs[0].data();
  const userLat = userData.latitude;
  const userLng = userData.longitude;

  const snapshot = await db.collection("user").get();
  const memberData = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    if (data.latitude && data.longitude) {
      const jarak = hitungJarak(userLat, userLng, data.latitude, data.longitude);
      if (!radiusFilter || jarak <= radiusFilter) {
        memberData.push({
          id: data.uid || doc.id,
          nama: data.nama || "-",
          kota: data.kota || "-",
          updated: data.terakhirAktif ? new Date(data.terakhirAktif.toDate()).toLocaleString() : "-",
          latitude: data.latitude,
          longitude: data.longitude,
          jarak: jarak.toFixed(2)
        });
      }
    }
  });

  // Tampilkan di tabel
  const tabelBody = document.getElementById("tabelLokasiMember");
  tabelBody.innerHTML = "";
  memberData.forEach(member => {
    const row = document.createElement("tr");
    row.className = "hover:bg-green-50";
    row.innerHTML = `
      <td class="px-4 py-2">${member.nama}</td>
      <td class="px-4 py-2">${member.id}</td>
      <td class="px-4 py-2">${member.kota}</td>
      <td class="px-4 py-2">${member.updated}</td>
      <td class="px-4 py-2">${member.jarak}</td>
    `;
    tabelBody.appendChild(row);
  });

  // Update marker di map
  tampilkanMarker(memberData);
}

// Tombol filter radius
document.getElementById("filterRadiusBtn").addEventListener("click", () => {
  const radiusValue = parseFloat(document.getElementById("radiusFilter").value);
  if (!isNaN(radiusValue)) {
    muatDataLokasiMember(radiusValue);
  }
});
