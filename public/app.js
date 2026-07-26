const KUNCI = 'adminguru_v1';

// <--- Landing&Login Page --->
// ==========================================
// UI NAVIGATION LOGIC (SPA TRANSITIONS)
// ==========================================

const landingStage = document.getElementById('landing-stage');
const loginStage = document.getElementById('login-stage');
const dashboardStage = document.getElementById('dashboard-stage');

// 1. Move from Landing Page to Login Screen
document.getElementById('btn-to-login').addEventListener('click', () => {
    landingStage.style.display = 'none';
    
    // We use 'flex' here instead of 'block' to keep your new CSS centering intact!
    loginStage.style.display = 'flex'; 
});

// 2. Handle the Login Verification
document.getElementById('btn-login').addEventListener('click', async () => {
    const nip = document.getElementById('input-nip').value;
    const pin = document.getElementById('input-pin').value;
    
    // Basic validation
    if (!nip || !pin) {
        alert("NIP dan PIN harus diisi!");
        return;
    }

    // Change button text to show loading state
    const loginBtn = document.getElementById('btn-login');
    loginBtn.textContent = "Memverifikasi...";
    loginBtn.disabled = true;

    try {
        // Send request to your local Node server
        // (We will change this URL later when deploying to Render)
        const response = await fetch('https://sigap-backendthehans-production.up.railway.app/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nip, pin })
        });

        const data = await response.json();

        if (data.success) {
            // Login matches the database!
            alert(`Selamat datang, ${data.user.name}!`);
            
            try {
                const studentRes = await fetch(`https://sigap-backendthehans-production.up.railway.app/api/students?teacher_id=${data.user.id}`);
                const studentJson = await studentRes.json();
                if (studentJson.success) {
                    db.siswa = studentJson.data.map(s => ({ id: s.id, nama: s.name, aktif: s.is_active }));
                    simpan();
                }
            } catch (err) {
                console.error("Gagal memuat siswa dari cloud:", err);
            }

            // Transition to the dashboard
            loginStage.style.display = 'none';
            dashboardStage.style.display = 'block'; 
            
            // Re-render the dashboard to show the correct name
            layarBeranda(); 
        } else {
            // Wrong PIN/NIP
            alert(data.message);
        }
    } catch (error) {
        console.error("Server Error:", error);
        alert("Koneksi ke server gagal. Pastikan backend Node.js sedang berjalan.");
    } finally {
        // Reset the button
        loginBtn.textContent = "Login";
        loginBtn.disabled = false;
    }
});
/* <------------ /Handle the Login Verification ------------> */

// 3. Handle the Logout Flow
function prosesLogout() {
    if (!confirm('Yakin ingin keluar dari portal?')) return;
    
    // 1. Wipe the login inputs so the next person can't auto-login
    document.getElementById('input-nip').value = '';
    document.getElementById('input-pin').value = '';
    
    // 2. Hide the dashboard and show the landing stage again
    document.getElementById('dashboard-stage').style.display = 'none';
    document.getElementById('landing-stage').style.display = 'flex'; 
    
    toast('Berhasil keluar dari sesi 🔒');
}


const DATA_AWAL = {
  versi: 1,
  profil: { guru: '', nip: '', sekolah: '', kelas: '', tahun: '', logo: '', foto: '' },
  siswa: [],            // {id, nama}
  mapel: ['Matematika', 'Bahasa Indonesia', 'IPAS', 'PPKn', 'Pendidikan Agama', 'PJOK', 'Seni'],
  daftarEskul: ['Pramuka', 'Seni Tari', 'Futsal', 'Pencak Silat', 'Qasidah', 'Tahsin', 'STEM', 'Aksara Sunda', 'Angklung', 'Keyboard'],
  nilaiEskul: {},
  bobot: { harian: 40, tugas: 20, sts: 20, sas: 20 },
  labelJenis: { harian: 'Harian', tugas: 'Tugas', sts: 'STS', sas: 'SAS' },
  kalender: { libur: {}, masuk: {} }, // libur/masuk kustom sesuai kalender pendidikan satuan
  server: { url: '', guru: null, terakhirSinkron: null }, // koneksi ke backend Apps Script
  absensi: {},          // { 'YYYY-MM-DD': { idSiswa:{s:'H',ket:''} } }
  nilai: {},            // { mapel: { jenis: [ {id,nama,tanggal,skor:{idSiswa:angka}} ] } }
  jurnal: {}            // { 'YYYY-MM-DD': {materi:'',sikap:[{idSiswa,catatan,jenis}],kendala:''} }
};
let db = null;
function muat() {
  try { db = JSON.parse(localStorage.getItem(KUNCI)); } catch (e) { db = null; }
  if (!db || !db.versi) { db = JSON.parse(JSON.stringify(DATA_AWAL)); }
  if (!db.labelJenis) db.labelJenis = { harian: 'Harian', tugas: 'Tugas', sts: 'STS', sas: 'SAS' };
  if (!db.daftarEskul) db.daftarEskul = [...DATA_AWAL.daftarEskul];
  if (!db.nilaiEskul) db.nilaiEskul = {};
  if (db.cadanganTerakhir === undefined) db.cadanganTerakhir = null;
  if (db.profil && db.profil.logo === undefined) db.profil.logo = '';
  if (db.profil && db.profil.foto === undefined) db.profil.foto = '';
  if (!db.kalender) db.kalender = { libur: {}, masuk: {} };
  if (!db.server) db.server = { url: '', guru: null, terakhirSinkron: null };
}
/* ---- Kalender pendidikan ---- */
const LIBUR_TETAP = { '01-01': 'Tahun Baru Masehi', '05-01': 'Hari Buruh Internasional', '06-01': 'Hari Lahir Pancasila', '08-17': 'Hari Kemerdekaan RI', '12-25': 'Hari Raya Natal' };
const LIBUR_2026 = { '2026-01-16': 'Isra Mikraj Nabi Muhammad SAW', '2026-02-17': 'Tahun Baru Imlek', '2026-03-19': 'Hari Suci Nyepi', '2026-03-20': 'Hari Raya Idulfitri 1447 H', '2026-03-21': 'Hari Raya Idulfitri 1447 H', '2026-04-03': 'Wafat Yesus Kristus', '2026-05-14': 'Kenaikan Yesus Kristus', '2026-05-27': 'Hari Raya Iduladha 1447 H', '2026-05-31': 'Hari Raya Waisak', '2026-06-16': 'Tahun Baru Islam 1448 H', '2026-08-25': 'Maulid Nabi Muhammad SAW' };
function statusHari(t) {
  const k = db.kalender || { libur: {}, masuk: {} };
  if (k.masuk[t]) return { libur: false, masukKustom: true, nama: null };
  if (k.libur[t]) return { libur: true, nama: k.libur[t], kustom: true };
  if (LIBUR_2026[t]) return { libur: true, nama: LIBUR_2026[t] };
  if (LIBUR_TETAP[t.slice(5)]) return { libur: true, nama: LIBUR_TETAP[t.slice(5)] };
  const h = new Date(t + 'T00:00:00').getDay();
  if (h === 0 || h === 6) return { libur: true, nama: 'Akhir pekan (' + (h === 6 ? 'Sabtu' : 'Minggu') + ')' };
  return { libur: false, nama: null };
}
function kalToggle(t, cb) {
  const st = statusHari(t);
  if (st.libur) {
    db.kalender.masuk[t] = true; delete db.kalender.libur[t];
    toast('Ditandai hari masuk sekolah 🏫');
  } else {
    delete db.kalender.masuk[t];
    if (!statusHari(t).libur) db.kalender.libur[t] = 'Libur satuan pendidikan';
    toast('Ditandai hari libur 🏖️');
  }
  simpan(); if (cb) cb();
}
function spandukLibur(t, aksi) {
  const st = statusHari(t);
  if (!st.libur) return st.masukKustom ? `
    <div class="kartu" style="margin-bottom:12px;padding:9px 14px">
      <p style="font-size:12px;color:var(--ungu-teks)">🏫 Tanggal ini <b>masuk khusus</b> sesuai kalender pendidikan sekolah.</p>
    </div>`: '';
  return `
    <div class="kartu" style="margin-bottom:12px;padding:10px 14px;border-color:rgba(250,199,117,.9)">
      <div style="display:flex;align-items:center;gap:9px">
        <span style="font-size:19px">🏖️</span>
        <span style="flex:1;font-size:12.5px;line-height:1.45;color:var(--ungu-teks)"><b style="color:#854F0B">Hari libur</b> — ${esc(st.nama)}. Biasanya tidak ada KBM.</span>
        <button class="tbl-garis" style="flex:none" onclick="${aksi}">Jadikan masuk</button>
      </div>
    </div>`;
}
function simpan() { localStorage.setItem(KUNCI, JSON.stringify(db)); }
function idBaru() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }
function siswaAktif() { return db.siswa.filter(s => s.aktif !== false); }
function tglISO(d) { d = d || new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
function tglIndo(iso) {
  const H = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const B = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
  const d = new Date(iso + 'T00:00:00');
  return H[d.getDay()] + ', ' + d.getDate() + ' ' + B[d.getMonth()] + ' ' + d.getFullYear();
}
function esc(t) { return String(t ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])); }

/* ================= NAVIGASI ================= */
const app = document.getElementById('app');
let layarAktif = null;
function tampilkan(html, nama) {
  const baru = document.createElement('div');
  baru.className = 'layar'; baru.dataset.nama = nama; baru.innerHTML = html;
  if (layarAktif) {
    const lama = layarAktif;
    lama.classList.add('keluar'); lama.classList.remove('aktif');
    setTimeout(() => lama.remove(), 330);
  }
  app.appendChild(baru);
  requestAnimationFrame(() => requestAnimationFrame(() => baru.classList.add('aktif')));
  layarAktif = baru;
  gambarSisi(nama);
  window.scrollTo({ top: 0 });
}

const PETA_SISI = { 
  'beranda': 'beranda', 
  'absensi': 'absensi', 
  'rekap-absensi': 'absensi', 
  'nilai': 'nilai', 
  'nilai-isi': 'nilai', 
  'jurnal': 'jurnal', 
  'jurnal-riwayat': 'jurnal', 
  'laporan': 'laporan', 
  'laporan-siswa': 'laporan', 
  'pengaturan': 'pengaturan', 
  'bantuan': 'bantuan', 
  'profil': 'beranda', 
  'server': 'pengaturan',
  'eskul': 'eskul' 
};

function gambarSisi(nama) {
  const el = document.getElementById('sisi'); if (!el) return;
  if (nama === 'onboard' || !db.profil.guru) { el.style.display = 'none'; return; }
  el.style.display = '';
  const aktif = PETA_SISI[nama] || '';
  const item = (id, em, label, fn) => `<div class="item ${aktif === id ? 'aktif' : ''}" onclick="${fn}" role="button">${em} <span>${label}</span></div>`;
  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:9px;padding:0 4px">
      ${db.profil.logo ? `<img src="${db.profil.logo}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.85)">` : `<span style="width:36px;height:36px;border-radius:50%;background:rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;font-size:17px">🏫</span>`}
      <div style="min-width:0">
        <p style="font-size:10.5px;font-weight:700;letter-spacing:.9px;text-transform:uppercase;color:var(--ungu-tua);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(db.profil.sekolah || 'SIGAP')}</p>
        <p style="font-size:9.5px;color:var(--ungu-muda)">Kelas ${esc(db.profil.kelas)} · ${esc(db.profil.tahun)}</p>
      </div>
    </div>
    <div style="height:.5px;background:rgba(83,74,183,.15);margin:12px 4px"></div>
    ${item('beranda', '🏠', 'Beranda', 'layarBeranda()')}
    ${item('absensi', '🙋', 'Absensi', 'layarAbsensi()')}
    ${item('nilai', '✏️', 'Nilai', 'layarNilai()')}
    ${item('eskul', '⚽', 'Ekstrakurikuler', 'layarEskul()')}
    ${item('jurnal', '📔', 'Jurnal harian', 'layarJurnal()')}
    ${item('laporan', '🏆', 'Laporan', 'layarLaporan()')}
    <div style="flex:1"></div>
    ${item('bantuan', '❓', 'Bantuan', 'layarBantuan()')}
    ${item('pengaturan', '⚙️', 'Pengaturan', 'layarPengaturan()')}
    <div style="display:flex;align-items:center;gap:9px;padding:9px 8px;margin-top:6px;border-top:.5px solid rgba(83,74,183,.15);cursor:pointer;border-radius:12px" onclick="layarProfil()" role="button" title="Buka profil guru">
      ${db.profil.foto ? `<img src="${db.profil.foto}" alt="" style="width:34px;height:34px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.95);flex:none">` : `<span style="width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.75);display:flex;align-items:center;justify-content:center;font-size:16px;flex:none">🧑‍🏫</span>`}
      <div style="min-width:0">
        <p style="font-size:11px;font-weight:600;color:var(--ungu-tua);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(db.profil.guru)}</p>
        <p style="font-size:9.5px;color:var(--ungu-muda);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">NIP ${esc(db.profil.nip || '-')}</p>
      </div>
    </div>
    <button class="tbl-garis" style="width:100%; margin-top:12px; color:#A32D2D; border-color:rgba(163,45,45,.3);" onclick="prosesLogout()">🚪 Keluar Portal</button>
    <p style="font-size:10px;color:var(--ungu-muda);margin-top:8px;text-align:center">SIGAP v1.1 ⚡</p>`;
}
function toast(pesan) {
  const t = document.getElementById('toast');
  t.textContent = pesan; t.classList.add('tampil');
  clearTimeout(t._w); t._w = setTimeout(() => t.classList.remove('tampil'), 2200);
}

/* ================= PENGATURAN AWAL (wizard 3 langkah) ================= */
let wiz = { langkah: 1, guru: '', nip: '', sekolah: '', kelas: '', tahun: '', siswa: [], mapel: [...DATA_AWAL.mapel] };
function tahunAjarOtomatis() {
  const d = new Date(); const t = d.getMonth() >= 6 ? d.getFullYear() : d.getFullYear() - 1;
  return t + '/' + (t + 1);
}
function layarOnboard() {
  wiz.tahun = wiz.tahun || tahunAjarOtomatis();
  let isi = '';
  if (wiz.langkah === 1) {
    isi = `
    <div class="grup"><label>Nama wali kelas</label>
      <input type="text" id="w-guru" placeholder="cth: Budi Santoso, S.Pd." value="${esc(wiz.guru)}"></div>
    <div class="grup"><label>NIP</label>
      <input type="text" id="w-nip" inputmode="numeric" placeholder="cth: 198705122010011234" value="${esc(wiz.nip)}"></div>
    <div class="grup"><label>Nama sekolah</label>
      <input type="text" id="w-sekolah" placeholder="cth: SDN 042 GAMBIR" value="${esc(wiz.sekolah)}"></div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      <div class="grup"><label>Kelas</label>
        <input type="text" id="w-kelas" placeholder="cth: 5A" value="${esc(wiz.kelas)}"></div>
      <div class="grup"><label>Tahun ajaran</label>
        <input type="text" id="w-tahun" value="${esc(wiz.tahun)}"></div>
    </div>
    <button class="tbl-utama" onclick="wizLanjut(1)">Lanjut ➜</button>
    <p class="info-kecil">Nama dan NIP akan otomatis muncul di setiap laporan yang dicetak.</p>`;
  } else if (wiz.langkah === 2) {
    isi = `
    <div class="grup"><label>Tambah siswa (bisa banyak sekaligus, satu nama per baris)</label>
      <textarea id="w-siswa" rows="4" placeholder="Andi Pratama&#10;Citra Lestari&#10;Dimas Saputra"></textarea></div>
    <button class="tbl-garis" style="width:100%" onclick="wizTambahSiswa()">＋ Masukkan ke daftar</button>
    <div class="kartu" style="margin-top:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:6px">Daftar siswa (${wiz.siswa.length})</p>
      <div id="w-daftar">${wiz.siswa.length ? wiz.siswa.map((n, i) => `
        <div class="baris-siswa">
          <span class="avatar av${i % 4}">${esc(inisial(n))}</span>
          <span style="flex:1;font-size:13.5px">${i + 1}. ${esc(n)}</span>
          <button class="hapus-kecil" onclick="wizHapusSiswa(${i})" aria-label="Hapus">✕</button>
        </div>`).join('') : '<p class="sub">Belum ada siswa. Ketik nama di atas lalu tekan tombol.</p>'}
      </div>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="tbl-garis" onclick="wizKembali()">← Kembali</button>
      <button class="tbl-utama" style="flex:1" onclick="wizLanjut(2)" ${wiz.siswa.length ? '' : 'disabled'}>Lanjut ➜</button>
    </div>`;
  } else {
    isi = `
    <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">Mata pelajaran kelas (ketuk untuk menghapus)</p>
    <div style="display:flex;flex-wrap:wrap;gap:7px;margin-bottom:12px" id="w-mapel">
      ${wiz.mapel.map((m, i) => `<span class="chip" onclick="wizHapusMapel(${i})">${esc(m)} <span class="x">✕</span></span>`).join('')}
    </div>
    <div style="display:flex;gap:8px" class="grup">
      <input type="text" id="w-mapel-baru" placeholder="Tambah mapel lain…">
      <button class="tbl-garis" onclick="wizTambahMapel()">＋</button>
    </div>
    <div class="kartu" style="margin-top:6px">
      <p style="font-size:13px;line-height:1.6">✅ <b>${esc(wiz.guru)}</b> · NIP ${esc(wiz.nip) || '-'}<br>
      🏫 ${esc(wiz.sekolah)} — Kelas ${esc(wiz.kelas)} (${esc(wiz.tahun)})<br>
      🧒 ${wiz.siswa.length} siswa · 📚 ${wiz.mapel.length} mapel</p>
    </div>
    <div style="display:flex;gap:10px;margin-top:14px">
      <button class="tbl-garis" onclick="wizKembali()">← Kembali</button>
      <button class="tbl-utama" style="flex:1" onclick="wizSelesai()" ${wiz.mapel.length ? '' : 'disabled'}>🚀 Mulai gunakan aplikasi</button>
    </div>`;
  }
  tampilkan(`
    <div style="padding-top:1.2rem">
      <p class="sub">Selamat datang di <b style="color:var(--ungu)">SIGAP</b> · Sistem Administrasi Guru Praktis 👋</p>
      <h1>Pengaturan awal</h1>
      <p class="sub" style="margin-top:3px">Isi sekali saja — semuanya bisa diubah nanti di Pengaturan.</p>
      <div class="langkah-titik">
        <span class="titik ${wiz.langkah === 1 ? 'aktif' : ''}"></span>
        <span class="titik ${wiz.langkah === 2 ? 'aktif' : ''}"></span>
        <span class="titik ${wiz.langkah === 3 ? 'aktif' : ''}"></span>
      </div>
      <p style="text-align:center;font-size:12px;color:var(--ungu-teks);margin-bottom:14px">
        ${wiz.langkah === 1 ? '👩‍🏫 Identitas' : wiz.langkah === 2 ? '🧒 Daftar siswa' : '📚 Mata pelajaran'}
      </p>
      <div class="kartu">${isi}</div>
    </div>`, 'onboard');
}
function inisial(n) { return n.trim().split(/\s+/).slice(0, 2).map(k => k[0]).join('').toUpperCase(); }
function wizLanjut(dari) {
  if (dari === 1) {
    wiz.guru = val('w-guru'); wiz.nip = val('w-nip'); wiz.sekolah = val('w-sekolah');
    wiz.kelas = val('w-kelas'); wiz.tahun = val('w-tahun');
    if (!wiz.guru || !wiz.kelas) { toast('Nama wali kelas dan kelas wajib diisi ya 🙏'); return; }
  }
  wiz.langkah = dari + 1; layarOnboard();
}
function wizKembali() { wiz.langkah--; layarOnboard(); }
function wizTambahSiswa() {
  const t = val('w-siswa'); if (!t) { toast('Ketik dulu nama siswanya ✏️'); return; }
  const baru = t.split('\n').map(s => s.trim()).filter(Boolean);
  const dobel = [];
  baru.forEach(n => {
    if (wiz.siswa.some(x => x.toLowerCase() === n.toLowerCase())) dobel.push(n);
    else wiz.siswa.push(n);
  });
  layarOnboard();
  toast(dobel.length ? `${dobel.length} nama ganda dilewati` : `${baru.length} siswa ditambahkan ✅`);
}
function wizHapusSiswa(i) { wiz.siswa.splice(i, 1); layarOnboard(); }
function wizHapusMapel(i) { wiz.mapel.splice(i, 1); layarOnboard(); }
function wizTambahMapel() {
  const m = val('w-mapel-baru'); if (!m) return;
  if (wiz.mapel.some(x => x.toLowerCase() === m.toLowerCase())) { toast('Mapel itu sudah ada'); return; }
  wiz.mapel.push(m); layarOnboard();
}
function wizSelesai() {
  db.profil = { guru: wiz.guru, nip: wiz.nip, sekolah: wiz.sekolah, kelas: wiz.kelas, tahun: wiz.tahun };
  db.siswa = wiz.siswa.map(n => ({ id: idBaru(), nama: n }));
  db.mapel = [...wiz.mapel];
  simpan(); toast('Selamat! Aplikasi siap dipakai 🎉'); layarBeranda();
}
function val(id) { const e = document.getElementById(id); return e ? e.value.trim() : ''; }

/* ================= BERANDA ================= */
function peringatanCadangan() {
  const adaData = Object.keys(db.absensi).length || Object.keys(db.jurnal).length || Object.keys(db.nilai).length;
  if (!adaData) return '';
  let hari = null;
  if (db.cadanganTerakhir) {
    hari = Math.floor((Date.now() - new Date(db.cadanganTerakhir + 'T00:00:00').getTime()) / 864e5);
    if (hari < 7) return '';
  }
  return `
    <div class="kartu" style="margin-top:14px;padding:11px 14px;border-color:rgba(250,199,117,.9)">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="font-size:20px">📦</span>
        <span style="flex:1;font-size:12.5px;line-height:1.45;color:var(--ungu-teks)">
          ${hari === null ? 'Data Anda <b style="color:#854F0B">belum pernah dicadangkan</b>.' : 'Sudah <b style="color:#854F0B">' + hari + ' hari</b> tidak mencadangkan.'}
          Amankan sekarang, hanya sekali ketuk.</span>
        <button class="tbl-garis" style="flex:none" onclick="unduhCadangan();layarBeranda()">Cadangkan</button>
      </div>
    </div>`;
}
function layarBantuan() {
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">❓ Bantuan</h1>
        <p class="sub">SIGAP v1.1 · Sistem Administrasi Guru Praktis</p></div>
    </div>
    <div class="kartu" style="margin-bottom:10px;border-color:rgba(250,199,117,.9)">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:6px">⚠️ Tiga hal terpenting</p>
      <p style="font-size:12.5px;line-height:1.7;color:var(--ungu-teks)">
        1. Data tersimpan <b>di perangkat ini</b> — selalu buka SIGAP di browser yang sama.<br>
        2. <b>Jangan hapus data browsing</b> untuk situs ini, datanya bisa ikut terhapus.<br>
        3. <b>Cadangkan tiap Jumat</b> (Pengaturan → Unduh cadangan), simpan filenya di email/Drive.</p>
    </div>
    ${[
      ['🙋', 'Absensi', 'Ketuk ✓ Semua hadir, lalu ubah siswa yang berhalangan lewat huruf H/S/I/A/T. Kolom keterangan muncul otomatis. Rekap & ekspor Excel lewat ikon 📊.'],
      ['✏️', 'Nilai', 'Pilih mapel & jenis nilai, buat penilaian, isi angka 0–100. Di bawah KKM 75 ditandai oranye. Judul & nama jenis bisa diubah (✏️ dan Pengaturan).'],
      ['📔', 'Jurnal harian', 'Satu catatan per hari: materi (pakai chip mapel), catatan sikap siswa 😊/🧐, kendala, dan refleksi sekali ketuk. Kendala kemarin muncul sebagai pengingat di Beranda.'],
      ['🏆', 'Laporan', 'Rekap kelas per semester. Ketuk nama siswa untuk laporan lengkap, lalu 🖨️ cetak (bisa Simpan sebagai PDF) atau 📥 ekspor Excel.'],
      ['⚙️', 'Pengaturan', 'Identitas & logo sekolah, siswa (📦 arsipkan yang pindah — riwayat aman), mapel, bobot nilai, cadangan, dan 🎓 mulai tahun ajaran baru.']
    ].map(([e, j, t]) => `
    <div class="kartu" style="margin-bottom:8px;padding:11px 14px">
      <p style="font-size:13px;font-weight:600;margin-bottom:3px">${e} ${j}</p>
      <p style="font-size:12.5px;line-height:1.55;color:var(--ungu-teks)">${t}</p>
    </div>`).join('')}
    <p class="info-kecil" style="text-align:center">Berbagi SIGAP: cukup kirim file sigap-v1-1.html ke rekan guru — tiap guru mengisi kelasnya sendiri di perangkatnya sendiri.</p>`, 'bantuan');
}
function layarProfil() {
  const { label, uji } = lpRentang();
  const hariAbs = Object.keys(db.absensi).filter(t => Object.keys(db.absensi[t]).length).length;
  const jmlPenilaian = Object.values(db.nilai).reduce((a, m) => a + JENIS.reduce((x, [j]) => x + ((m && m[j]) ? m[j].length : 0), 0), 0);
  const jmlJurnal = Object.keys(db.jurnal).length;
  const ks = siswaAktif().map(s => lpKehadiran(s.id, uji).pct).filter(x => x !== null);
  const rataHadir = ks.length ? Math.round(ks.reduce((a, b) => a + b, 0) / ks.length) : null;
  const nas = siswaAktif().map(s => lpNAKeseluruhan(s.id, uji)).filter(x => x !== null);
  const rataNA = nas.length ? Math.round(nas.reduce((a, b) => a + b, 0) / nas.length) : null;
  const stat = [
    ['🧒', 'Siswa aktif', siswaAktif().length, '#FBEAF0'],
    ['🙋', 'Hari absensi tercatat', hariAbs, '#FAEEDA'],
    ['📄', 'Penilaian dibuat', jmlPenilaian, '#E6F1FB'],
    ['📔', 'Jurnal ditulis', jmlJurnal, '#E1F5EE'],
    ['📈', 'Rata kehadiran semester', rataHadir === null ? '—' : rataHadir + '%', '#EEEDFE'],
    ['🏆', 'Rata NA kelas semester', rataNA === null ? '—' : rataNA, '#FAEEDA']
  ];
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">🧑‍🏫 Profil guru</h1>
        <p class="sub">${label}</p></div>
    </div>
    <div class="kartu" style="text-align:center;padding:24px 18px;margin-bottom:12px">
      ${db.profil.foto ? `<img src="${db.profil.foto}" alt="Foto guru" style="width:96px;height:96px;border-radius:50%;object-fit:cover;border:3px solid rgba(255,255,255,.95)">` : `<span style="width:96px;height:96px;border-radius:50%;background:rgba(255,255,255,.7);border:.5px dashed rgba(83,74,183,.35);display:inline-flex;align-items:center;justify-content:center;font-size:44px">🧑‍🏫</span>`}
      <p style="font-size:17px;font-weight:600;margin-top:12px;letter-spacing:-.2px">${esc(db.profil.guru)}</p>
      <p class="sub" style="margin-top:3px">NIP ${esc(db.profil.nip || '-')}</p>
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-top:8px">${esc(db.profil.sekolah || '-')}</p>
      <p class="sub" style="margin-top:2px">Wali Kelas ${esc(db.profil.kelas)} · ${esc(db.profil.tahun)}</p>
      <button class="tbl-garis" style="margin-top:14px" onclick="layarPengaturan()">📷 Kelola foto &amp; identitas</button>
    </div>
    <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin:0 4px 8px">📊 Statistik mengajar Anda</p>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
      ${stat.map(([e, l, v, w]) => `
      <div class="kartu" style="padding:13px 14px">
        <span style="width:34px;height:34px;border-radius:12px;background:${w};display:flex;align-items:center;justify-content:center;font-size:17px">${e}</span>
        <p style="font-size:19px;font-weight:700;color:var(--ungu-tua);margin-top:8px">${v}</p>
        <p style="font-size:11px;color:var(--ungu-muda);margin-top:1px;line-height:1.35">${l}</p>
      </div>`).join('')}
    </div>
    <p class="info-kecil" style="text-align:center">Statistik kehadiran &amp; NA mengikuti semester yang dipilih di modul Laporan.</p>`, 'profil');
}

function sapaan() {
  const j = new Date().getHours();
  if (j < 10) return 'Selamat pagi,'; if (j < 15) return 'Selamat siang,';
  if (j < 18) return 'Selamat sore,'; return 'Selamat malam,';
}
function namaPanggil() {
  const n = db.profil.guru.split(',')[0].trim();
  return n.length > 22 ? n.slice(0, 22) + '…' : n;
}
function layarBeranda() {
  const hariIni = tglISO();
  const kemarin = tglISO(new Date(Date.now() - 864e5));
  const absHariIni = db.absensi[hariIni] && Object.keys(db.absensi[hariIni]).length > 0;
  const jurnalKemarin = !!db.jurnal[kemarin];
  const jurnalHariIni = !!db.jurnal[hariIni];
  tampilkan(`
    <div style="display:flex;align-items:center;gap:9px;padding-top:.6rem;margin-bottom:10px">
      ${db.profil.logo ? `<img src="${db.profil.logo}" alt="Logo sekolah" style="width:38px;height:38px;border-radius:50%;object-fit:cover;background:rgba(255,255,255,.75);border:.5px solid var(--kaca-tepi)">` : `<span style="width:38px;height:38px;border-radius:50%;background:rgba(255,255,255,.65);border:.5px solid var(--kaca-tepi);display:flex;align-items:center;justify-content:center;font-size:18px">🏫</span>`}
      <div style="flex:1;min-width:0">
        <p style="font-size:11.5px;font-weight:700;letter-spacing:1.4px;color:var(--ungu-tua);text-transform:uppercase;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(db.profil.sekolah || 'Nama sekolah belum diisi')}</p>
        <p style="font-size:10px;color:var(--ungu-muda);letter-spacing:.4px">SIGAP · Sistem Administrasi Guru Praktis</p>
      </div>
    </div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <div style="display:flex;align-items:center;gap:13px;min-width:0;cursor:pointer" onclick="layarProfil()" role="button" title="Buka profil guru">
        ${db.profil.foto ? `<img src="${db.profil.foto}" alt="Foto guru" style="width:60px;height:60px;border-radius:50%;object-fit:cover;border:2.5px solid rgba(255,255,255,.95);flex:none">` : `<span style="width:60px;height:60px;border-radius:50%;background:rgba(255,255,255,.65);border:.5px solid var(--kaca-tepi);display:flex;align-items:center;justify-content:center;font-size:28px;flex:none">🧑‍🏫</span>`}
        <div style="min-width:0">
          <p class="sub">${tglIndo(hariIni)}</p>
          <h1 style="margin-top:2px">${sapaan()} ${esc(namaPanggil())} 👋</h1>
          <p style="margin-top:3px;font-size:12px;font-weight:600;color:var(--ungu);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(db.profil.guru)}${db.profil.nip ? ' · NIP ' + esc(db.profil.nip) : ''}</p>
          <p class="sub" style="margin-top:2px">Kelas ${esc(db.profil.kelas)} · ${siswaAktif().length} siswa · ${esc(db.profil.tahun)}</p>
        </div>
      </div>
      <div style="display:flex;gap:8px">
        <span class="tbl-bulat" onclick="prosesLogout()" role="button" aria-label="Keluar" title="Keluar Portal" style="color:#A32D2D">🚪</span>
        <span class="tbl-bulat" onclick="layarBantuan()" role="button" aria-label="Bantuan">❓</span>
        <span class="tbl-bulat" onclick="layarPengaturan()" role="button" aria-label="Pengaturan">⚙️</span>
      </div>
      <div style="display:flex;gap:8px">
        <span class="tbl-bulat" onclick="layarBantuan()" role="button" aria-label="Bantuan">❓</span>
        <span class="tbl-bulat" onclick="layarPengaturan()" role="button" aria-label="Pengaturan">⚙️</span>
      </div>
    </div>
    ${peringatanCadangan()}
    <div class="kartu" style="margin-top:16px;display:flex;flex-direction:column;gap:10px">
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:32px;height:32px;border-radius:10px;background:#FAEEDA;display:flex;align-items:center;justify-content:center;font-size:16px">⏰</span>
        <span style="flex:1;font-size:13.5px">Absensi hari ini</span>
        <span class="pil ${absHariIni ? 'pil-hijau' : statusHari(hariIni).libur ? '' : 'pil-oranye'}"${!absHariIni && statusHari(hariIni).libur ? ' style="color:var(--ungu);background:rgba(83,74,183,.12)"' : ''}>${absHariIni ? 'Sudah diisi' : statusHari(hariIni).libur ? 'Hari libur 🏖️' : 'Belum diisi'}</span>
      </div>
      <div style="height:.5px;background:rgba(83,74,183,.12)"></div>
      <div style="display:flex;align-items:center;gap:10px">
        <span style="width:32px;height:32px;border-radius:10px;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:16px">📖</span>
        <span style="flex:1;font-size:13.5px">Jurnal ${jurnalHariIni ? 'hari ini' : 'kemarin'}</span>
        <span class="pil ${(jurnalHariIni || jurnalKemarin) ? 'pil-hijau' : 'pil-oranye'}">${jurnalHariIni ? 'Tercatat' : jurnalKemarin ? 'Tercatat' : 'Belum ada'}</span>
      </div>
      ${(db.jurnal[kemarin] && db.jurnal[kemarin].kendala) ? `
      <div style="height:.5px;background:rgba(83,74,183,.12)"></div>
      <div style="display:flex;align-items:flex-start;gap:10px">
        <span style="width:32px;height:32px;border-radius:10px;background:#FBEAF0;display:flex;align-items:center;justify-content:center;font-size:16px;flex:none">⏰</span>
        <span style="flex:1;font-size:12.5px;color:var(--ungu-teks);line-height:1.5;padding-top:2px"><b style="font-weight:600;color:var(--ungu-tua)">Tindak lanjut kemarin:</b> ${esc(db.jurnal[kemarin].kendala.slice(0, 90))}${db.jurnal[kemarin].kendala.length > 90 ? '…' : ''}</span>
      </div>`: ''}
    </div>
    <div class="ubin-grid">
      <div class="ubin" onclick="layarAbsensi()">
        <span class="ikon" style="background:#FBEAF0">🙋</span>
        <p class="n">Absensi</p><p class="d">Kehadiran harian</p>
      </div>
      <div class="ubin" onclick="layarNilai()">
        <span class="ikon" style="background:#FAEEDA">✏️</span>
        <p class="n">Nilai</p><p class="d">Harian · Tugas · STS · SAS</p>
      </div>
      <div class="ubin" onclick="layarJurnal()">
        <span class="ikon" style="background:#E1F5EE">📔</span>
        <p class="n">Jurnal harian</p><p class="d">Catatan wali kelas</p>
      </div>
      <div class="ubin" onclick="layarEskul()">
        <span class="ikon" style="background:#E6F1FB">🥎</span>
        <p class="n">Ekstrakurikuler</p><p class="d">Pilihan & Wajib</p>
      </div>
      <div class="ubin" onclick="layarLaporan()">
        <span class="ikon" style="background:#E6F1FB">🏆</span>
        <p class="n">Laporan</p><p class="d">Rekap &amp; ekspor</p>
      </div>
    </div>`, 'beranda');
}

/* ====== Placeholder modul (dibangun di langkah berikutnya) ====== */
function layarModul(nama, emoji) {
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">${emoji} ${esc(nama)}</h1>
      <p class="sub">Kelas ${esc(db.profil.kelas)}</p></div>
    </div>
    <div class="kartu" style="text-align:center;padding:34px 20px">
      <p style="font-size:44px">🏗️</p>
      <p style="font-weight:600;margin-top:10px">Modul ${esc(nama)} sedang dibangun</p>
      <p class="sub" style="margin-top:6px;line-height:1.6">Ini fondasi (langkah 1 dari 5).<br>Modul ${esc(nama)} akan hadir di langkah pembangunan berikutnya.</p>
      <button class="tbl-garis" style="margin-top:16px" onclick="layarBeranda()">Kembali ke beranda</button>
    </div>`, 'modul');
}

/* ================= ABSENSI ================= */
let absTgl = tglISO(), absDraft = {};
const STATUS = [
  ['H', 'Hadir', '#1D9E75'], ['S', 'Sakit', '#EF9F27'], ['I', 'Izin', '#4A90D9'],
  ['A', 'Alpa', '#C0392B'], ['T', 'Terlambat', '#D4537E']
];
function absMuatDraft() {
  absDraft = {}; const d = db.absensi[absTgl] || {};
  siswaAktif().forEach(s => { absDraft[s.id] = d[s.id] ? { s: d[s.id].s, ket: d[s.id].ket || '' } : null; });
}
function layarAbsensi(muatUlang = true) {
  if (muatUlang) absMuatDraft();
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">🙋 Absensi</h1>
        <p class="sub">${tglIndo(absTgl)} · Kelas ${esc(db.profil.kelas)}</p></div>
      <span class="tbl-bulat" onclick="layarRekapAbsensi()" role="button" aria-label="Rekap" title="Rekap">📊</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <input type="date" id="abs-tgl" value="${absTgl}" style="flex:1" onchange="absGantiTanggal(this.value)">
      <span class="tbl-bulat" style="width:34px;height:34px" title="Tandai libur/masuk" role="button" onclick="kalToggle(absTgl,()=>layarAbsensi(false))">${statusHari(absTgl).libur ? '🏫' : '🏖️'}</span>
      <button class="tbl-garis" onclick="absSemuaHadir()">✓ Semua hadir</button>
    </div>
    ${spandukLibur(absTgl, "kalToggle(absTgl,()=>layarAbsensi(false))")}
    <div style="display:flex;gap:6px;margin-bottom:12px" id="abs-hitung">${absHitungHTML()}</div>
    <div class="daftar-adaptif">
      ${siswaAktif().length ? siswaAktif().map((s, i) => absBarisHTML(s, i)).join('') : '<div class="kartu" style="text-align:center;padding:24px"><p class="sub">Belum ada siswa di kelas ini.</p></div>'}
    </div>
    
    <div class="kartu" style="margin-top:12px; padding:12px 14px; border-color:rgba(93,202,165,.6)">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">＋ Tambah Siswa Baru</p>
      <div style="display:flex;gap:8px">
        <input type="text" id="abs-siswa-baru" placeholder="Nama lengkap siswa...">
        <button class="tbl-garis" style="padding:8px 16px" onclick="absTambahSiswa()">Tambah</button>
      </div>
    </div>

    <button class="tbl-utama" style="margin-top:14px" onclick="absSimpan()">💾 Simpan absensi</button>
    ${serverAktif() ? `<button class="tbl-garis" style="width:100%;margin-top:8px" onclick="svSinkronAbsensi()">☁️ Sinkronkan ke server</button>` : ''}
    <p class="info-kecil" style="text-align:center">Ketuk huruf status di tiap siswa. Kolom keterangan muncul otomatis untuk S/I/A/T.</p>`, 'absensi');
}
function absBarisHTML(s, i) {
  const d = absDraft[s.id];
  return `
  <div class="kartu" style="padding:10px 12px" id="abs-row-${s.id}">
    <div style="display:flex;align-items:center;gap:9px">
      <span class="avatar av${i % 4}">${esc(inisial(s.nama))}</span>
      <span style="flex:1;font-size:13.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.nama)}</span>
      ${STATUS.map(([k, , w]) => `
        <button id="abs-btn-${s.id}-${k}" onclick="absSet('${s.id}','${k}')" aria-label="${k}"
          style="width:27px;height:27px;border-radius:50%;border:none;cursor:pointer;font-size:11.5px;font-weight:600;font-family:inherit;flex:none;
          ${d && d.s === k ? `background:${w};color:#fff` : `background:rgba(255,255,255,.7);color:#8A84AC`}">${k}</button>`).join('')}
    </div>
    <div id="abs-note-${s.id}" style="display:${d && d.s !== 'H' ? 'flex' : 'none'};align-items:center;gap:6px;margin-top:8px;background:rgba(255,255,255,.78);border-radius:10px;padding:6px 10px">
      <span style="font-size:13px">📝</span>
      <input type="text" id="abs-ket-${s.id}" placeholder="Keterangan (boleh kosong)…" value="${esc(d ? d.ket : '')}"
        style="border:none;background:none;padding:4px 0;font-size:12.5px;box-shadow:none"
        oninput="if(absDraft['${s.id}'])absDraft['${s.id}'].ket=this.value">
    </div>
  </div>`;
}
function absHitungHTML() {
  const c = { H: 0, S: 0, I: 0, A: 0, T: 0 }; let belum = 0;
  siswaAktif().forEach(s => { const d = absDraft[s.id]; if (d) c[d.s]++; else belum++; });
  const warna = { H: '#085041', S: '#854F0B', I: '#185FA5', A: '#A32D2D', T: '#993556' };
  return STATUS.map(([k]) => `
    <span style="flex:1;text-align:center;background:var(--kaca);border:.5px solid var(--kaca-tepi);border-radius:12px;padding:6px 0;font-size:11.5px;color:${warna[k]}">
      <b style="font-weight:600">${c[k]}</b> ${k}</span>`).join('') +
    (belum ? `<span style="flex:1;text-align:center;background:rgba(138,132,172,.15);border-radius:12px;padding:6px 0;font-size:11.5px;color:#6B648F"><b style="font-weight:600">${belum}</b> ？</span>` : '');
}
function absSet(id, st) {
  const ket = document.getElementById('abs-ket-' + id);
  absDraft[id] = { s: st, ket: ket ? ket.value : '' };
  STATUS.forEach(([k, , w]) => {
    const b = document.getElementById('abs-btn-' + id + '-' + k);
    if (k === st) { b.style.background = w; b.style.color = '#fff'; }
    else { b.style.background = 'rgba(255,255,255,.7)'; b.style.color = '#8A84AC'; }
  });
  document.getElementById('abs-note-' + id).style.display = (st === 'H') ? 'none' : 'flex';
  document.getElementById('abs-hitung').innerHTML = absHitungHTML();
}
function absSemuaHadir() {
  siswaAktif().forEach(s => { absDraft[s.id] = { s: 'H', ket: '' }; });
  layarAbsensi(false); toast('Semua ditandai hadir ✓ — ubah yang berhalangan');
}
function absGantiTanggal(t) {
  if (!t) return; absTgl = t; layarAbsensi();
}
async function absSimpan() {
    const isi = {}; 
    let terisi = 0;
    const attendance_records = []; // Array to hold data for the cloud

    siswaAktif().forEach(s => { 
        const d = absDraft[s.id]; 
        if (d) { 
            // 1. Format for local storage (A Nendy's original way)
            isi[s.id] = { s: d.s, ket: (d.ket || '').trim() }; 
            terisi++; 

            // 2. Format for Supabase Cloud Database
            attendance_records.push({
                teacher_id: db.profil.id,
                student_id: s.id,
                date: absTgl,
                status: d.s,
                note: (d.ket || '').trim()
            });
        } 
    });

    if (!terisi) { toast('Belum ada siswa yang ditandai 🙏'); return; }

    // Keep saving to local storage so the app stays lightning fast
    db.absensi[absTgl] = isi; 
    simpan();

    // UI Feedback: Disable button while saving to cloud
    const btn = document.querySelector('button[onclick="absSimpan()"]');
    const oldText = btn.textContent;
    btn.textContent = 'Menyimpan ke Cloud...';
    btn.disabled = true;

    try {
        // 3. Send the POST request to your Node server
        const response = await fetch('https://sigap-backendthehans-production.up.railway.app/api/attendance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ attendance_records })
        });

        const resData = await response.json();

        if (resData.success) {
            const belum = siswaAktif().length - terisi;
            toast(belum ? `Tersimpan di Cloud ✅ (${belum} belum ditandai)` : 'Absensi tersimpan lengkap di Cloud ✅');
        } else {
            toast('Gagal simpan ke Cloud: ' + resData.message);
        }
    } catch (err) {
        console.error(err);
        toast('Tersimpan lokal, tapi gagal konek ke Cloud ❌');
    } finally {
        btn.textContent = oldText;
        btn.disabled = false;
    }
}

async function absTambahSiswa() {
  const n = val('abs-siswa-baru'); 
  if (!n) { 
      toast('Ketik nama siswa dulu 🙏'); 
      return; 
  }
  
  // Prevent duplicate names locally
  if (db.siswa.some(s => s.nama.toLowerCase() === n.toLowerCase())) { 
      toast('Nama itu sudah ada di daftar!'); 
      return; 
  }

  // Disable input temporarily while talking to server
  const btn = document.querySelector('button[onclick="absTambahSiswa()"]');
  const oldText = btn.textContent;
  btn.textContent = 'Menyimpan...';
  btn.disabled = true;

  try {
      // 1. Send the POST request to your local Node server
      const response = await fetch('https://sigap-backendthehans-production.up.railway.app/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              teacher_id: db.profil.id, // We use the ID we saved at login!
              name: n 
          })
      });

      const resData = await response.json();

      if (resData.success) {
          // 2. The server responded with the true Supabase UUID
          const idBaruSiswa = resData.data.id; 
          
          // 3. Push to local array so the UI updates instantly
          db.siswa.push({ id: idBaruSiswa, nama: resData.data.name }); 
          
          // 4. Automatically mark as 'Hadir' (H) in current draft
          if (absDraft) {
              absDraft[idBaruSiswa] = { s: 'H', ket: '' };
          }
          
          simpan(); 
          layarAbsensi(false); 
          toast('Siswa tersimpan di Cloud ✅');
      } else {
          toast('Gagal: ' + resData.message);
      }
  } catch (err) {
      console.error(err);
      toast('Koneksi ke server gagal ❌');
  } finally {
      btn.textContent = oldText;
      btn.disabled = false;
  }
}

/* ---- Grafik batang sederhana (tanpa pustaka, tetap offline) ---- */
function grafikBatang(data, tinggi = 90) {
  if (!data.length) return '';
  return `<div style="display:flex;gap:5px;align-items:flex-end;overflow-x:auto;padding:4px 0 0">` +
    data.map(d => `
    <div style="flex:1;min-width:26px;display:flex;flex-direction:column;align-items:center;gap:3px">
      <span style="font-size:10px;font-weight:600;color:${d.w}">${d.v}</span>
      <div style="width:100%;max-width:30px;height:${Math.max(3, Math.round(d.v / 100 * tinggi))}px;background:${d.w};border-radius:7px 7px 3px 3px;opacity:.85"></div>
      <span style="font-size:9.5px;color:var(--ungu-muda);white-space:nowrap">${d.l}</span>
    </div>`).join('') + `</div>`;
}
function rkGrafik() {
  const { uji } = rkRentang();
  const n = siswaAktif().length; if (!n) return [];
  const warna = v => v >= 90 ? '#1D9E75' : v >= 75 ? '#EF9F27' : '#C0392B';
  const pctHari = t => {
    let h = 0; siswaAktif().forEach(s => { const e = db.absensi[t][s.id]; if (e && (e.s === 'H' || e.s === 'T')) h++; });
    return h / n * 100;
  };
  const tanggal = Object.keys(db.absensi).filter(t => uji(t) && Object.keys(db.absensi[t]).length).sort();
  if (rkMode === 'bulan') {
    return tanggal.map(t => { const v = Math.round(pctHari(t)); return { l: 'tgl ' + (+t.slice(8)), v, w: warna(v) }; });
  }
  const per = {};
  tanggal.forEach(t => { const b = t.slice(0, 7); (per[b] = per[b] || []).push(t); });
  return Object.keys(per).sort().map(b => {
    const v = Math.round(per[b].reduce((a, t) => a + pctHari(t), 0) / per[b].length);
    return { l: NB[+b.slice(5) - 1].slice(0, 3), v, w: warna(v) };
  });
}

/* ---- Rekap absensi ---- */
let rkMode = 'bulan', rkRef = new Date();
const NB = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
function rkRentang() {
  const th = rkRef.getFullYear(), bl = rkRef.getMonth();
  if (rkMode === 'bulan') {
    return { label: NB[bl] + ' ' + th, uji: t => t.startsWith(th + '-' + String(bl + 1).padStart(2, '0')) };
  }
  const sem1 = bl >= 6; const thAwal = sem1 ? th : th - 1;
  const label = (sem1 ? 'Semester 1' : 'Semester 2') + ' ' + thAwal + '/' + (thAwal + 1);
  return {
    label, uji: t => {
      const [y, m] = t.split('-').map(Number);
      return sem1 ? (y === th && m >= 7) : (y === th && m <= 6);
    }
  };
}
function rkHitung() {
  const { uji } = rkRentang();
  const tanggal = Object.keys(db.absensi).filter(t => uji(t) && Object.keys(db.absensi[t]).length);
  const per = {}; siswaAktif().forEach(s => per[s.id] = { H: 0, S: 0, I: 0, A: 0, T: 0 });
  tanggal.forEach(t => {
    const hari = db.absensi[t];
    siswaAktif().forEach(s => { const d = hari[s.id]; if (d && per[s.id][d.s] !== undefined) per[s.id][d.s]++; });
  });
  return { per, hari: tanggal.length };
}
function layarRekapAbsensi() {
  const { label } = rkRentang(); const { per, hari } = rkHitung();
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarAbsensi()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">📊 Rekap absensi</h1>
        <p class="sub">Kelas ${esc(db.profil.kelas)} · ${hari} hari tercatat</p></div>
      <span class="tbl-bulat" onclick="rkEkspor()" role="button" aria-label="Ekspor Excel" title="Ekspor Excel">📥</span>
    </div>
    <div style="display:flex;background:rgba(255,255,255,.55);border:.5px solid var(--kaca-tepi);border-radius:999px;padding:4px;margin-bottom:10px">
      <span onclick="rkMode='bulan';layarRekapAbsensi()" style="flex:1;text-align:center;font-size:12.5px;font-weight:600;padding:7px 0;border-radius:999px;cursor:pointer;${rkMode === 'bulan' ? 'background:rgba(255,255,255,.95);color:#2A2547' : 'color:#8A84AC'}">Bulanan</span>
      <span onclick="rkMode='semester';layarRekapAbsensi()" style="flex:1;text-align:center;font-size:12.5px;font-weight:600;padding:7px 0;border-radius:999px;cursor:pointer;${rkMode === 'semester' ? 'background:rgba(255,255,255,.95);color:#2A2547' : 'color:#8A84AC'}">Semester</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span class="tbl-bulat" style="width:32px;height:32px" onclick="rkGeser(-1)">‹</span>
      <span style="flex:1;text-align:center;font-size:13.5px;font-weight:600">${label}</span>
      <span class="tbl-bulat" style="width:32px;height:32px" onclick="rkGeser(1)">›</span>
    </div>
    ${(() => {
      const g = rkGrafik(); return g.length ? `
    <div class="kartu" style="margin-bottom:8px;padding:12px 14px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:2px">📈 Perkembangan kehadiran kelas (%)</p>
      <p class="sub" style="margin-bottom:6px">${rkMode === 'bulan' ? 'per hari tercatat' : 'rata-rata per bulan'}</p>
      ${grafikBatang(g)}
    </div>`: ''
    })()}
    <div class="kartu" style="padding:8px 6px;overflow-x:auto">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:330px">
        <tr style="color:#6B648F">
          <th style="text-align:left;padding:7px 6px;font-weight:600">Siswa</th>
          <th style="padding:7px 3px">H</th><th style="padding:7px 3px">S</th>
          <th style="padding:7px 3px">I</th><th style="padding:7px 3px">A</th>
          <th style="padding:7px 3px">T</th><th style="padding:7px 5px">%</th>
        </tr>
        ${siswaAktif().map((s, i) => {
      const p = per[s.id];
      const pct = hari ? Math.round((p.H + p.T) / hari * 100) : 0;
      const wr = pct >= 90 ? '#085041' : pct >= 75 ? '#854F0B' : '#A32D2D';
      return `<tr style="border-top:.5px solid rgba(83,74,183,.1)">
            <td style="padding:7px 6px;white-space:nowrap;max-width:130px;overflow:hidden;text-overflow:ellipsis">${i + 1}. ${esc(s.nama)}</td>
            <td style="text-align:center;color:#085041">${p.H}</td>
            <td style="text-align:center;color:#854F0B">${p.S}</td>
            <td style="text-align:center;color:#185FA5">${p.I}</td>
            <td style="text-align:center;color:#A32D2D">${p.A}</td>
            <td style="text-align:center;color:#993556">${p.T}</td>
            <td style="text-align:center;font-weight:600;color:${hari ? wr : '#8A84AC'}">${hari ? pct + '%' : '—'}</td>
          </tr>`;
    }).join('')}
      </table>
    </div>
    <p class="info-kecil">%. kehadiran = (Hadir + Terlambat) ÷ hari tercatat. Hijau ≥90%, oranye ≥75%, merah &lt;75%. Ketuk 📥 untuk ekspor ke Excel.</p>`, 'rekap-absensi');
}
function rkGeser(arah) {
  if (rkMode === 'bulan') rkRef = new Date(rkRef.getFullYear(), rkRef.getMonth() + arah, 1);
  else rkRef = new Date(rkRef.getFullYear(), rkRef.getMonth() + arah * 6, 1);
  layarRekapAbsensi();
}
function rkEkspor() {
  const { label } = rkRentang(); const { per, hari } = rkHitung();
  const P = db.profil; const b = '\uFEFF'; const s = ';';
  let csv = b + 'REKAP ABSENSI\n';
  csv += 'Sekolah' + s + P.sekolah + '\nKelas' + s + P.kelas + ' (' + P.tahun + ')\nPeriode' + s + label + '\nHari tercatat' + s + hari + '\n\n';
  csv += 'No' + s + 'Nama' + s + 'Hadir' + s + 'Sakit' + s + 'Izin' + s + 'Alpa' + s + 'Terlambat' + s + '% Kehadiran\n';
  siswaAktif().forEach((sw, i) => {
    const p = per[sw.id]; const pct = hari ? Math.round((p.H + p.T) / hari * 100) + '%' : '-';
    csv += (i + 1) + s + sw.nama + s + p.H + s + p.S + s + p.I + s + p.A + s + p.T + s + pct + '\n';
  });
  csv += '\nWali kelas' + s + P.guru + '\nNIP' + s + (P.nip || '-') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'rekap-absensi-' + label.replace(/[\/ ]/g, '-') + '.csv'; a.click();
  toast('Rekap diekspor — buka dengan Excel 📥');
}

/* ================= NILAI ================= */
let nlMapel = null, nlJenis = 'harian';
const JENIS = [['harian', 'Harian'], ['tugas', 'Tugas'], ['sts', 'STS'], ['sas', 'SAS']];
const KKM = 75;
function jenisLabel(j) { return (db.labelJenis && db.labelJenis[j]) || JENIS.find(x => x[0] === j)[1]; }
function nlData() {
  if (!nlMapel || !db.mapel.includes(nlMapel)) nlMapel = db.mapel[0] || null;
  if (!nlMapel) return null;
  if (!db.nilai[nlMapel]) db.nilai[nlMapel] = {};
  JENIS.forEach(([j]) => { if (!db.nilai[nlMapel][j]) db.nilai[nlMapel][j] = []; });
  return db.nilai[nlMapel];
}
function nlRata(p) {
  const v = siswaAktif().map(s => p.skor[s.id]).filter(x => typeof x === 'number');
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
function layarNilai() {
  const d = nlData();
  if (!d) { toast('Tambahkan mata pelajaran dulu di Pengaturan 🙏'); layarPengaturan(); return; }
  const daftar = d[nlJenis];
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">✏️ Nilai</h1>
        <p class="sub">Kelas ${esc(db.profil.kelas)} · ${esc(db.profil.tahun)}</p></div>
    </div>
    <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:6px;margin-bottom:8px">
      ${db.mapel.map(m => `
        <span onclick="nlMapel='${esc(m)}';layarNilai()" style="white-space:nowrap;font-size:12px;font-weight:600;padding:7px 14px;border-radius:999px;cursor:pointer;flex:none;
        ${m === nlMapel ? 'background:var(--ungu);color:#EEEDFE' : 'background:rgba(255,255,255,.6);border:.5px solid var(--kaca-tepi);color:var(--ungu)'}">${esc(m)}</span>`).join('')}
    </div>
    <div style="display:flex;background:rgba(255,255,255,.55);border:.5px solid var(--kaca-tepi);border-radius:999px;padding:4px;margin-bottom:12px">
      ${JENIS.map(([j, l]) => `
        <span onclick="nlJenis='${j}';layarNilai()" style="flex:1;text-align:center;font-size:12.5px;font-weight:600;padding:7px 0;border-radius:999px;cursor:pointer;
        ${j === nlJenis ? 'background:rgba(255,255,255,.95);color:#2A2547' : 'color:#8A84AC'}">${esc(jenisLabel(j))}</span>`).join('')}
    </div>
    ${(() => {
      const g = daftar.slice().sort((a, b) => a.tgl < b.tgl ? -1 : 1)
        .map(p => { const r = nlRata(p); return r === null ? null : { l: p.nama.length > 8 ? p.nama.slice(0, 7) + '…' : p.nama, v: r, w: r >= KKM ? '#1D9E75' : '#EF9F27' }; })
        .filter(Boolean);
      return g.length > 1 ? `
    <div class="kartu" style="margin-bottom:12px;padding:12px 14px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:2px">📈 Rata-rata kelas per penilaian</p>
      <p class="sub" style="margin-bottom:6px">${esc(nlMapel)} · ${esc(jenisLabel(nlJenis))} — hijau ≥ KKM ${KKM}</p>
      ${grafikBatang(g)}
    </div>`: '';
    })()}
    <div class="daftar-adaptif">
      ${daftar.length ? daftar.map(p => {
      const r = nlRata(p);
      const terisi = siswaAktif().filter(s => typeof p.skor[s.id] === 'number').length;
      return `
        <div class="kartu" style="padding:12px 14px;cursor:pointer" onclick="layarNilaiIsi('${p.id}')">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="width:36px;height:36px;border-radius:12px;background:#FAEEDA;display:flex;align-items:center;justify-content:center;font-size:17px;flex:none">📄</span>
            <div style="flex:1;min-width:0">
              <p style="font-size:13.5px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(p.nama)}</p>
              <p class="sub">${tglIndo(p.tgl).split(', ')[1]} · ${terisi}/${siswaAktif().length} terisi</p>
            </div>
            <span style="font-size:14px;font-weight:600;color:${r === null ? '#8A84AC' : r >= KKM ? '#085041' : '#854F0B'}">${r === null ? '—' : 'μ ' + r}</span>
          </div>
        </div>`;
    }).join('') : `
        <div class="kartu" style="text-align:center;padding:26px 18px">
          <p style="font-size:36px">🗒️</p>
          <p class="sub" style="margin-top:8px;line-height:1.6">Belum ada penilaian ${jenisLabel(nlJenis)} untuk ${esc(nlMapel)}.<br>Buat lewat tombol di bawah.</p>
        </div>`}
    </div>
    <div class="kartu" style="margin-top:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">＋ Penilaian ${jenisLabel(nlJenis)} baru</p>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
        <input type="text" id="nl-nama" placeholder="${jenisLabel(nlJenis)} ke-${daftar.length + 1}">
        <input type="date" id="nl-tgl" value="${tglISO()}" style="width:135px">
      </div>
      <button class="tbl-utama" style="margin-top:10px" onclick="nlTambah()">Buat &amp; isi nilai ➜</button>
    </div>`, 'nilai');
}
function nlTambah() {
  const d = nlData(); const daftar = d[nlJenis];
  const nama = val('nl-nama') || jenisLabel(nlJenis) + ' ke-' + (daftar.length + 1);
  const tgl = val('nl-tgl') || tglISO();
  const st = statusHari(tgl);
  if (st.libur && !confirm('Tanggal itu hari libur (' + st.nama + ') menurut kalender pendidikan.\nTetap buat penilaian di tanggal tersebut?')) return;
  const p = { id: idBaru(), nama, tgl, skor: {} };
  daftar.push(p); simpan(); layarNilaiIsi(p.id);
}
function nlCari(pid) { return nlData()[nlJenis].find(p => p.id === pid); }
function layarNilaiIsi(pid) {
  const p = nlCari(pid); if (!p) { layarNilai(); return; }
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarNilai()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:17px">${esc(p.nama)}</h1>
        <p class="sub">${esc(nlMapel)} · ${jenisLabel(nlJenis)} · ${tglIndo(p.tgl).split(', ')[1]}</p></div>
      <span class="tbl-bulat" onclick="nlToggleEdit()" role="button" aria-label="Ubah judul" title="Ubah judul">✏️</span>
      <span class="tbl-bulat" onclick="nlHapus('${p.id}')" role="button" aria-label="Hapus" style="color:#A32D2D">🗑️</span>
    </div>
    <div class="kartu" id="nl-edit" style="display:none;margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">✏️ Ubah judul &amp; tanggal</p>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px">
        <input type="text" id="nl-edit-nama" value="${esc(p.nama)}">
        <input type="date" id="nl-edit-tgl" value="${p.tgl}" style="width:135px">
      </div>
      <button class="tbl-utama" style="margin-top:10px" onclick="nlSimpanEdit('${p.id}')">💾 Simpan perubahan</button>
    </div>
    <div class="kartu" style="padding:10px 14px;margin-bottom:12px;display:flex;justify-content:space-between;align-items:center">
      <span class="sub">Rata-rata kelas</span>
      <span id="nl-rata" style="font-size:16px;font-weight:600;color:var(--ungu)">${nlRata(p) === null ? '—' : nlRata(p)}</span>
    </div>
    <div class="daftar-adaptif">
      ${siswaAktif().map((s, i) => {
    const v = p.skor[s.id];
    return `
        <div class="kartu" style="padding:9px 12px;display:flex;align-items:center;gap:10px">
          <span class="avatar av${i % 4}">${esc(inisial(s.nama))}</span>
          <span style="flex:1;font-size:13.5px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(s.nama)}</span>
          <input type="number" inputmode="numeric" min="0" max="100" id="nl-s-${s.id}" value="${typeof v === 'number' ? v : ''}"
            placeholder="—" oninput="nlUbah('${p.id}','${s.id}',this)"
            style="width:64px;text-align:center;font-weight:600;font-size:14.5px;
            color:${typeof v === 'number' ? (v >= KKM ? '#085041' : '#854F0B') : 'inherit'};
            ${typeof v === 'number' && v < KKM ? 'border-color:rgba(239,159,39,.6)' : ''}">
        </div>`;
  }).join('')}
    </div>
    <button class="tbl-utama" style="margin-top:14px" onclick="nlSimpan('${p.id}')">💾 Simpan nilai</button>
    <p class="info-kecil" style="text-align:center">Nilai 0–100. Di bawah KKM (${KKM}) ditandai oranye. Kosongkan jika siswa tidak ikut.</p>`, 'nilai-isi');
}
function nlUbah(pid, sid, el) {
  const p = nlCari(pid); if (!p) return;
  let v = el.value === '' ? null : Math.max(0, Math.min(100, parseInt(el.value) || 0));
  if (v === null) { delete p.skor[sid]; el.style.color = 'inherit'; el.style.borderColor = ''; }
  else {
    p.skor[sid] = v;
    el.style.color = v >= KKM ? '#085041' : '#854F0B';
    el.style.borderColor = v < KKM ? 'rgba(239,159,39,.6)' : 'rgba(83,74,183,.22)';
  }
  const r = nlRata(p);
  document.getElementById('nl-rata').textContent = r === null ? '—' : r;
}
function nlSimpan(pid) {
  simpan();
  const p = nlCari(pid);
  const terisi = siswaAktif().filter(s => typeof p.skor[s.id] === 'number').length;
  toast(`Nilai tersimpan ✅ (${terisi}/${siswaAktif().length} siswa)`);
}
function nlToggleEdit() {
  const e = document.getElementById('nl-edit');
  e.style.display = e.style.display === 'none' ? 'block' : 'none';
}
function nlSimpanEdit(pid) {
  const p = nlCari(pid); if (!p) return;
  const nama = val('nl-edit-nama'); const tgl = val('nl-edit-tgl');
  if (!nama) { toast('Judul tidak boleh kosong 🙏'); return; }
  p.nama = nama; if (tgl) p.tgl = tgl;
  simpan(); layarNilaiIsi(pid); toast('Judul diperbarui ✅');
}
function nlHapus(pid) {
  const p = nlCari(pid);
  if (!confirm('Hapus penilaian "' + p.nama + '" beserta semua nilainya?')) return;
  const d = nlData(); d[nlJenis] = d[nlJenis].filter(x => x.id !== pid);
  simpan(); layarNilai(); toast('Penilaian dihapus');
}

/* ================= JURNAL HARIAN ================= */
let jrTgl = tglISO(), jrDraft = null;
function jrMuatDraft() {
  const d = db.jurnal[jrTgl];
  jrDraft = d ? JSON.parse(JSON.stringify(d)) : { materi: '', sikap: [], kendala: '', refleksi: '' };
  if (jrDraft.refleksi === undefined) jrDraft.refleksi = '';
}
function jrAbsRingkas(t) {
  t = t || jrTgl;
  const d = db.absensi[t];
  if (!d || !Object.keys(d).length) return null;
  const c = { H: 0, S: 0, I: 0, A: 0, T: 0 }; const sebut = [];
  siswaAktif().forEach(s => {
    const e = d[s.id]; if (!e) return; c[e.s]++;
    if (e.s !== 'H') sebut.push(s.nama.split(' ')[0] + ' ' + ({ S: 'sakit', I: 'izin', A: 'alpa', T: 'terlambat' })[e.s]);
  });
  return { c, sebut };
}
function jrChipMapel(m) {
  const t = document.getElementById('jr-materi');
  t.value += (t.value.trim() ? '\n' : '') + m + ': ';
  jrDraft.materi = t.value; t.focus();
}
const REFLEKSI = [['lancar', '😃 Lancar'], ['cukup', '😐 Cukup'], ['sulit', '😓 Perlu perbaikan']];
function jrSetRefleksi(k) {
  jrDraft.materi = val('jr-materi'); jrDraft.kendala = val('jr-kendala');
  jrDraft.refleksi = jrDraft.refleksi === k ? '' : k;
  REFLEKSI.forEach(([r]) => {
    const b = document.getElementById('jr-ref-' + r);
    if (jrDraft.refleksi === r) { b.style.background = 'var(--ungu)'; b.style.color = '#EEEDFE'; b.style.borderColor = 'var(--ungu)'; }
    else { b.style.background = 'rgba(255,255,255,.6)'; b.style.color = 'var(--ungu)'; b.style.borderColor = 'var(--kaca-tepi)'; }
  });
}
function jrSiswaNama(sid) {
  const s = db.siswa.find(x => x.id === sid); return s ? s.nama : '(siswa terhapus)';
}
function layarJurnal(muatUlang = true) {
  if (muatUlang || !jrDraft) jrMuatDraft();
  const terisi = t => !!db.jurnal[t];
  const riwayat = [1, 2, 3, 4, 5].map(n => {
    const t = tglISO(new Date(new Date(jrTgl + 'T00:00:00').getTime() - n * 864e5));
    return { t, ada: terisi(t) };
  });
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="jrDraft=null;layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">📔 Jurnal harian</h1>
        <p class="sub">${tglIndo(jrTgl)}${terisi(jrTgl) ? ' · ✓ tercatat' : ''}</p></div>
      <span class="tbl-bulat" onclick="jrLihatRiwayat()" role="button" aria-label="Riwayat" title="Riwayat">🗂️</span>
      <span class="tbl-bulat" onclick="jrEkspor()" role="button" aria-label="Ekspor" title="Ekspor bulan ini">📥</span>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:12px;align-items:center">
      <span class="tbl-bulat" style="width:34px;height:34px" onclick="jrGeser(-1)">‹</span>
      <input type="date" id="jr-tgl" value="${jrTgl}" style="flex:1" onchange="jrGantiTanggal(this.value)">
      <span class="tbl-bulat" style="width:34px;height:34px" onclick="jrGeser(1)">›</span>
      <span class="tbl-bulat" style="width:34px;height:34px" title="Tandai libur/masuk" role="button" onclick="kalToggle(jrTgl,()=>layarJurnal(false))">${statusHari(jrTgl).libur ? '🏫' : '🏖️'}</span>
    </div>
    ${spandukLibur(jrTgl, "kalToggle(jrTgl,()=>layarJurnal(false))")}

    ${(() => {
      const r = jrAbsRingkas(); return r ? `
    <div class="kartu" style="margin-bottom:10px;padding:10px 14px">
      <p style="font-size:12px;color:var(--ungu-teks);line-height:1.5">🔗 Dari absensi hari ini: <b style="font-weight:600;color:#085041">${r.c.H} hadir</b>${r.sebut.length ? ' · ' + esc(r.sebut.join(', ')) : ' — hadir semua 🎉'}</p>
    </div>`: ''
    })()}

    <div class="kartu" style="margin-bottom:10px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:7px">📚 Materi &amp; kegiatan pembelajaran</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px">
        ${db.mapel.map(m => `<span class="chip" onclick="jrChipMapel('${esc(m)}')">＋ ${esc(m)}</span>`).join('')}
      </div>
      <textarea id="jr-materi" rows="3" placeholder="cth: Matematika: pecahan senilai, latihan berkelompok. IPAS: pengamatan tumbuhan di halaman."
        oninput="jrDraft.materi=this.value">${esc(jrDraft.materi)}</textarea>
    </div>

    <div class="kartu" style="margin-bottom:10px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:7px">🌟 Catatan sikap siswa</p>
      <div id="jr-sikap-daftar">
        ${jrDraft.sikap.length ? jrDraft.sikap.map((c, i) => `
          <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
            <span style="font-size:11.5px;font-weight:600;white-space:nowrap;padding:3px 10px;border-radius:999px;margin-top:1px;
              ${c.jenis === 'positif' ? 'color:#085041;background:rgba(93,202,165,.3)' : 'color:#854F0B;background:rgba(250,199,117,.38)'}">
              ${c.jenis === 'positif' ? '😊' : '🧐'} ${esc(jrSiswaNama(c.sid).split(' ')[0])}</span>
            <p style="flex:1;font-size:12.5px;line-height:1.45;margin-top:3px">${esc(c.cat)}</p>
            <button class="hapus-kecil" onclick="jrHapusSikap(${i})" aria-label="Hapus">✕</button>
          </div>`).join('') : '<p class="sub" style="margin-bottom:8px">Belum ada catatan sikap hari ini.</p>'}
      </div>
      <div style="border-top:.5px solid rgba(83,74,183,.12);padding-top:10px">
        <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:8px">
          <select id="jr-sikap-siswa">
            <option value="">— Pilih siswa —</option>
            ${siswaAktif().map(s => `<option value="${s.id}">${esc(s.nama)}</option>`).join('')}
          </select>
          <select id="jr-sikap-jenis" style="width:130px">
            <option value="positif">😊 Positif</option>
            <option value="perhatian">🧐 Perhatian</option>
          </select>
        </div>
        <div style="display:flex;gap:8px">
          <input type="text" id="jr-sikap-cat" placeholder="cth: Membantu teman saat kerja kelompok">
          <button class="tbl-garis" onclick="jrTambahSikap()">＋</button>
        </div>
      </div>
    </div>

    <div class="kartu" style="margin-bottom:10px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:7px">🛠️ Kendala &amp; tindak lanjut</p>
      <textarea id="jr-kendala" rows="2" placeholder="cth: Proyektor mati — sudah lapor TU, besok pakai media cetak."
        oninput="jrDraft.kendala=this.value">${esc(jrDraft.kendala)}</textarea>
    </div>

    <div class="kartu" style="margin-bottom:10px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">💭 Bagaimana pembelajaran hari ini?</p>
      <div style="display:flex;gap:8px">
        ${REFLEKSI.map(([k, l]) => `
          <button onclick="jrSetRefleksi('${k}')" id="jr-ref-${k}" style="flex:1;font-family:inherit;font-size:12px;font-weight:600;padding:9px 2px;border-radius:999px;cursor:pointer;border:.5px solid;
          ${jrDraft.refleksi === k ? 'background:var(--ungu);color:#EEEDFE;border-color:var(--ungu)' : 'background:rgba(255,255,255,.6);color:var(--ungu);border-color:var(--kaca-tepi)'}">${l}</button>`).join('')}
      </div>
    </div>

    <button class="tbl-utama" onclick="jrSimpan()">💾 Simpan jurnal</button>
    <p class="info-kecil" style="text-align:center">📅 5 hari sebelumnya:
      ${riwayat.map(r => `<span style="cursor:pointer" onclick="jrGantiTanggal('${r.t}')">${r.ada ? '✅' : '⬜'}</span>`).join(' ')}
      — ketuk kotaknya untuk membuka. Catatan sikap 🧐/😊 otomatis muncul di laporan siswa.</p>`, 'jurnal');
}
function jrGantiTanggal(t) { if (!t) return; jrTgl = t; jrMuatDraft(); layarJurnal(false); }
function jrGeser(arah) {
  const d = new Date(jrTgl + 'T00:00:00'); d.setDate(d.getDate() + arah);
  jrGantiTanggal(tglISO(d));
}
function jrTambahSikap() {
  const sid = val('jr-sikap-siswa'), jenis = val('jr-sikap-jenis'), cat = val('jr-sikap-cat');
  if (!sid) { toast('Pilih dulu siswanya 🙏'); return; }
  if (!cat) { toast('Tulis dulu catatannya ✏️'); return; }
  jrDraft.materi = val('jr-materi'); jrDraft.kendala = val('jr-kendala');
  jrDraft.sikap.push({ sid, jenis, cat });
  layarJurnal(false); toast('Catatan sikap ditambahkan ✅');
}
function jrHapusSikap(i) {
  jrDraft.materi = val('jr-materi'); jrDraft.kendala = val('jr-kendala');
  jrDraft.sikap.splice(i, 1); layarJurnal(false);
}
function jrSimpan() {
  jrDraft.materi = val('jr-materi'); jrDraft.kendala = val('jr-kendala');
  const kosong = !jrDraft.materi && !jrDraft.kendala && !jrDraft.sikap.length && !jrDraft.refleksi;
  if (kosong) {
    if (db.jurnal[jrTgl]) { delete db.jurnal[jrTgl]; simpan(); layarJurnal(); toast('Jurnal tanggal ini dikosongkan'); }
    else toast('Jurnal masih kosong — isi dulu salah satu bagian 🙏');
    return;
  }
  db.jurnal[jrTgl] = JSON.parse(JSON.stringify(jrDraft));
  simpan(); layarJurnal(); toast('Jurnal tersimpan ✅');
}
function jrLihatRiwayat() {
  const semua = Object.keys(db.jurnal).sort().reverse();
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarJurnal()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">🗂️ Riwayat jurnal</h1>
        <p class="sub">${semua.length} hari tercatat</p></div>
    </div>
    <div class="daftar-adaptif">
      ${semua.length ? semua.map(t => {
    const j = db.jurnal[t];
    const cuplik = (j.materi || j.kendala || '(hanya catatan sikap)').slice(0, 70);
    return `
        <div class="kartu" style="padding:11px 14px;cursor:pointer" onclick="jrGantiTanggal('${t}')">
          <div style="display:flex;align-items:center;gap:10px">
            <span style="width:36px;height:36px;border-radius:12px;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:16px;flex:none">📔</span>
            <div style="flex:1;min-width:0">
              <p style="font-size:13px;font-weight:600">${tglIndo(t)}</p>
              <p class="sub" style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${esc(cuplik)}${(j.materi || '').length > 70 ? '…' : ''}</p>
            </div>
            ${j.sikap.length ? `<span class="pil pil-hijau" style="font-size:11px">🌟 ${j.sikap.length}</span>` : ''}
          </div>
        </div>`;
  }).join('') : `
        <div class="kartu" style="text-align:center;padding:26px">
          <p style="font-size:36px">🗒️</p>
          <p class="sub" style="margin-top:8px">Belum ada jurnal tersimpan.</p>
        </div>`}
    </div>`, 'jurnal-riwayat');
}
function jrEkspor() {
  const bulan = jrTgl.slice(0, 7);
  const tanggal = Object.keys(db.jurnal).filter(t => t.startsWith(bulan)).sort();
  if (!tanggal.length) { toast('Belum ada jurnal di bulan ini 🙏'); return; }
  const P = db.profil; const s = ';';
  const [y, m] = bulan.split('-');
  let csv = '\uFEFF' + 'JURNAL HARIAN WALI KELAS\n';
  csv += 'Sekolah' + s + P.sekolah + '\nKelas' + s + P.kelas + ' (' + P.tahun + ')\nBulan' + s + NB[+m - 1] + ' ' + y + '\n\n';
  csv += 'Tanggal' + s + 'Kehadiran' + s + 'Materi & kegiatan' + s + 'Catatan sikap siswa' + s + 'Kendala & tindak lanjut' + s + 'Refleksi\n';
  tanggal.forEach(t => {
    const j = db.jurnal[t];
    const bersih = x => String(x || '').replace(/[\n;]/g, ' ');
    const sikap = j.sikap.map(c => jrSiswaNama(c.sid) + ' (' + (c.jenis === 'positif' ? 'positif' : 'perhatian') + '): ' + c.cat).join(' | ');
    const r = jrAbsRingkas(t);
    const hadir = r ? r.c.H + ' hadir' + (r.sebut.length ? ' (' + r.sebut.join(', ') + ')' : '') : '-';
    const ref = j.refleksi === 'lancar' ? 'Lancar' : j.refleksi === 'cukup' ? 'Cukup' : j.refleksi === 'sulit' ? 'Perlu perbaikan' : '-';
    csv += tglIndo(t) + s + bersih(hadir) + s + bersih(j.materi) + s + bersih(sikap) + s + bersih(j.kendala) + s + ref + '\n';
  });
  csv += '\nWali kelas' + s + P.guru + '\nNIP' + s + (P.nip || '-') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'jurnal-' + bulan + '.csv'; a.click();
  toast('Jurnal bulan ini diekspor 📥');
}

/* ================= EKSTRAKURIKULER ================= */
function layarEskul() {
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">⚽ Ekstrakurikuler</h1>
        <p class="sub">Kelas ${esc(db.profil.kelas)} · ${esc(db.profil.tahun)}</p></div>
    </div>
    <div class="kartu" style="margin-bottom:12px;padding:12px 14px;border-color:rgba(93,202,165,.6)">
      <p style="font-size:12.5px;color:var(--ungu-teks);line-height:1.5">Pilih kegiatan wajib atau pilihan untuk setiap siswa, lalu tentukan predikat: <b>Cukup, Baik, atau Amat Baik</b>.</p>
    </div>
    <div class="daftar-adaptif">
      ${siswaAktif().map((s, i) => {
        const eskulSiswa = db.nilaiEskul[s.id] || {};
        const listEskul = Object.keys(eskulSiswa);
        return `
        <div class="kartu" style="padding:12px 14px">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px">
            <span class="avatar av${i % 4}">${esc(inisial(s.nama))}</span>
            <span style="flex:1;font-size:13.5px;font-weight:600">${esc(s.nama)}</span>
          </div>
          ${listEskul.length ? listEskul.map(namaEskul => `
            <div style="display:grid;grid-template-columns:1fr auto auto;gap:8px;align-items:center;margin-bottom:6px;background:rgba(255,255,255,.5);padding:6px;border-radius:8px">
              <span style="font-size:12px;font-weight:600;color:var(--ungu)">${esc(namaEskul)}</span>
              <select style="width:110px;padding:4px 8px;font-size:11.5px;border-radius:6px" onchange="eskulUbahNilai('${s.id}', '${namaEskul}', this.value)">
                <option value="Cukup" ${eskulSiswa[namaEskul] === 'Cukup' ? 'selected' : ''}>Cukup</option>
                <option value="Baik" ${eskulSiswa[namaEskul] === 'Baik' ? 'selected' : ''}>Baik</option>
                <option value="Amat Baik" ${eskulSiswa[namaEskul] === 'Amat Baik' ? 'selected' : ''}>Amat Baik</option>
              </select>
              <button class="hapus-kecil" onclick="eskulHapus('${s.id}', '${namaEskul}')">✕</button>
            </div>
          `).join('') : '<p class="sub" style="font-size:11px;margin-bottom:6px">Belum mengikuti eskul.</p>'}
          
          <div style="display:flex;gap:6px;margin-top:8px">
            <select id="eskul-tambah-${s.id}" style="flex:1;padding:6px;font-size:12px">
              <option value="">-- Tambah Eskul --</option>
              ${db.daftarEskul.filter(e => !listEskul.includes(e)).map(e => `<option value="${e}">${e}</option>`).join('')}
            </select>
            <button class="tbl-garis" style="padding:6px 12px" onclick="eskulTambah('${s.id}')">＋</button>
          </div>
        </div>`;
      }).join('')}
    </div>
  `, 'eskul');
}

function eskulTambah(sid) {
  const e = document.getElementById('eskul-tambah-' + sid).value;
  if (!e) return;
  if (!db.nilaiEskul[sid]) db.nilaiEskul[sid] = {};
  db.nilaiEskul[sid][e] = 'Baik'; // Default grade
  simpan(); layarEskul();
}

function eskulUbahNilai(sid, namaEskul, nilai) {
  if (!db.nilaiEskul[sid]) return;
  db.nilaiEskul[sid][namaEskul] = nilai;
  simpan();
}

function eskulHapus(sid, namaEskul) {
  if (!confirm(`Hapus ${namaEskul} dari daftar siswa ini?`)) return;
  delete db.nilaiEskul[sid][namaEskul];
  simpan(); layarEskul();
}

/* ================= LAPORAN ================= */
let lpRef = new Date();
function lpRentang() {
  const th = lpRef.getFullYear(), bl = lpRef.getMonth();
  const sem1 = bl >= 6; const thAwal = sem1 ? th : th - 1;
  return {
    label: (sem1 ? 'Semester 1' : 'Semester 2') + ' ' + thAwal + '/' + (thAwal + 1),
    uji: t => { const [y, m] = t.split('-').map(Number); return sem1 ? (y === th && m >= 7) : (y === th && m <= 6); }
  };
}
function lpGeser(a) { lpRef = new Date(lpRef.getFullYear(), lpRef.getMonth() + a * 6, 1); layarLaporan(); }
function lpRataJenis(mapel, jenis, sid, uji) {
  const d = (db.nilai[mapel] && db.nilai[mapel][jenis]) || [];
  const v = d.filter(p => uji(p.tgl)).map(p => p.skor[sid]).filter(x => typeof x === 'number');
  return v.length ? v.reduce((a, b) => a + b, 0) / v.length : null;
}
function lpNA(mapel, sid, uji) {
  let tot = 0, bob = 0; const detail = {};
  JENIS.forEach(([j]) => {
    const r = lpRataJenis(mapel, j, sid, uji);
    detail[j] = r === null ? null : Math.round(r);
    if (r !== null) { tot += r * db.bobot[j]; bob += db.bobot[j]; }
  });
  return { na: bob ? Math.round(tot / bob) : null, detail };
}
function lpNAKeseluruhan(sid, uji) {
  const v = db.mapel.map(m => lpNA(m, sid, uji).na).filter(x => x !== null);
  return v.length ? Math.round(v.reduce((a, b) => a + b, 0) / v.length) : null;
}
function lpKehadiran(sid, uji) {
  const tanggal = Object.keys(db.absensi).filter(t => uji(t) && Object.keys(db.absensi[t]).length);
  const c = { H: 0, S: 0, I: 0, A: 0, T: 0 };
  tanggal.forEach(t => { const e = db.absensi[t][sid]; if (e && c[e.s] !== undefined) c[e.s]++; });
  const hari = tanggal.length;
  return { c, hari, pct: hari ? Math.round((c.H + c.T) / hari * 100) : null };
}
function lpSikap(sid, uji) {
  const out = [];
  Object.keys(db.jurnal).filter(uji).sort().forEach(t => {
    (db.jurnal[t].sikap || []).forEach(c => { if (c.sid === sid) out.push({ t, jenis: c.jenis, cat: c.cat }); });
  });
  return out;
}
function layarLaporan() {
  const { label, uji } = lpRentang();
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">🏆 Laporan hasil belajar</h1>
        <p class="sub">Kelas ${esc(db.profil.kelas)} · ${esc(db.profil.tahun)}</p></div>
      <span class="tbl-bulat" onclick="lpEkspor()" role="button" aria-label="Ekspor Excel" title="Ekspor Excel">📥</span>
    </div>
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px">
      <span class="tbl-bulat" style="width:32px;height:32px" onclick="lpGeser(-1)">‹</span>
      <span style="flex:1;text-align:center;font-size:13.5px;font-weight:600">${label}</span>
      <span class="tbl-bulat" style="width:32px;height:32px" onclick="lpGeser(1)">›</span>
    </div>
    <div class="kartu" style="padding:8px 6px;overflow-x:auto;margin-bottom:8px">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:300px">
        <tr style="color:#6B648F">
          <th style="text-align:left;padding:7px 6px;font-weight:600">Siswa</th>
          <th style="padding:7px 4px">Rata NA</th>
          <th style="padding:7px 4px">Hadir</th>
          <th style="padding:7px 4px">🌟</th>
          <th style="padding:7px 2px"></th>
        </tr>
        ${siswaAktif().map((s, i) => {
    const na = lpNAKeseluruhan(s.id, uji);
    const k = lpKehadiran(s.id, uji);
    const sk = lpSikap(s.id, uji).length;
    return `<tr style="border-top:.5px solid rgba(83,74,183,.1);cursor:pointer" onclick="layarLaporanSiswa('${s.id}')">
            <td style="padding:8px 6px;white-space:nowrap;max-width:140px;overflow:hidden;text-overflow:ellipsis">${i + 1}. ${esc(s.nama)}</td>
            <td style="text-align:center;font-weight:600;color:${na === null ? '#8A84AC' : na >= KKM ? '#085041' : '#854F0B'}">${na === null ? '—' : na}</td>
            <td style="text-align:center;color:${k.pct === null ? '#8A84AC' : k.pct >= 90 ? '#085041' : k.pct >= 75 ? '#854F0B' : '#A32D2D'}">${k.pct === null ? '—' : k.pct + '%'}</td>
            <td style="text-align:center">${sk || '—'}</td>
            <td style="text-align:center;color:#8A84AC">›</td>
          </tr>`;
  }).join('')}
      </table>
    </div>
    <p class="info-kecil">Ketuk nama siswa untuk laporan lengkap &amp; cetak 🖨️. Rata NA = rata-rata nilai akhir berbobot semua mapel (bobot: ${['harian', 'tugas', 'sts', 'sas'].map(k => jenisLabel(k) + ' ' + db.bobot[k] + '%').join(', ')}).</p>`, 'laporan');
}
function layarLaporanSiswa(sid) {
  const s = db.siswa.find(x => x.id === sid); if (!s) { layarLaporan(); return; }
  const { label, uji } = lpRentang();
  const k = lpKehadiran(sid, uji);
  const sikap = lpSikap(sid, uji);
  const naAll = lpNAKeseluruhan(sid, uji);
  const i = siswaAktif().indexOf(s);
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarLaporan()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:17px">${esc(s.nama)}</h1>
        <p class="sub">No. absen ${i + 1} · ${label}</p></div>
      <span class="tbl-bulat" onclick="cetakSiswa('${sid}')" role="button" aria-label="Cetak" title="Cetak laporan">🖨️</span>
    </div>
    <div class="kartu" style="padding:12px 14px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center">
      <span style="font-size:13px;font-weight:600">Rata-rata nilai akhir</span>
      <span style="font-size:20px;font-weight:700;color:${naAll === null ? '#8A84AC' : naAll >= KKM ? '#085041' : '#854F0B'}">${naAll === null ? '—' : naAll}</span>
    </div>
    <div class="kartu" style="padding:8px 6px;overflow-x:auto;margin-bottom:10px">
      <table style="width:100%;border-collapse:collapse;font-size:11.5px;min-width:320px">
        <tr style="color:#6B648F">
          <th style="text-align:left;padding:6px;font-weight:600">Mapel</th>
          ${['harian', 'tugas', 'sts', 'sas'].map(j => `<th style="padding:6px 3px">${esc(jenisLabel(j))}</th>`).join('')}
          <th style="padding:6px 4px">NA</th>
        </tr>
        ${db.mapel.map(m => {
    const r = lpNA(m, sid, uji);
    return `<tr style="border-top:.5px solid rgba(83,74,183,.1)">
            <td style="padding:7px 6px;white-space:nowrap;max-width:110px;overflow:hidden;text-overflow:ellipsis">${esc(m)}</td>
            ${['harian', 'tugas', 'sts', 'sas'].map(j => `<td style="text-align:center;color:${r.detail[j] === null ? '#C9C5E2' : r.detail[j] >= KKM ? '#2A2547' : '#854F0B'}">${r.detail[j] === null ? '·' : r.detail[j]}</td>`).join('')}
            <td style="text-align:center;font-weight:700;color:${r.na === null ? '#8A84AC' : r.na >= KKM ? '#085041' : '#854F0B'}">${r.na === null ? '—' : r.na}</td>
          </tr>`;
  }).join('')}
      </table>
    </div>
    <div class="kartu" style="padding:12px 14px;margin-bottom:10px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">🙋 Kehadiran (${k.hari} hari tercatat)</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;font-size:12px">
        <span class="pil pil-hijau">Hadir ${k.c.H}</span>
        <span class="pil pil-oranye">Sakit ${k.c.S}</span>
        <span class="pil" style="color:#185FA5;background:rgba(74,144,217,.18)">Izin ${k.c.I}</span>
        <span class="pil" style="color:#A32D2D;background:rgba(192,57,43,.14)">Alpa ${k.c.A}</span>
        <span class="pil" style="color:#993556;background:rgba(212,83,126,.16)">Terlambat ${k.c.T}</span>
        <span class="pil" style="color:var(--ungu);background:rgba(83,74,183,.12)">${k.pct === null ? '—' : k.pct + '% kehadiran'}</span>
      </div>
    </div>
    <div class="kartu" style="padding:12px 14px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">🌟 Catatan sikap dari jurnal (${sikap.length})</p>
      ${sikap.length ? sikap.map(c => `
        <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:7px">
          <span style="font-size:11px;font-weight:600;white-space:nowrap;padding:3px 9px;border-radius:999px;
            ${c.jenis === 'positif' ? 'color:#085041;background:rgba(93,202,165,.3)' : 'color:#854F0B;background:rgba(250,199,117,.38)'}">
            ${c.jenis === 'positif' ? '😊' : '🧐'} ${tglIndo(c.t).split(', ')[1].replace(/ \d{4}$/, '')}</span>
          <p style="flex:1;font-size:12.5px;line-height:1.45;margin-top:2px">${esc(c.cat)}</p>
        </div>`).join('') : '<p class="sub">Belum ada catatan sikap pada semester ini.</p>'}
    </div>
    <button class="tbl-utama" style="margin-top:12px" onclick="cetakSiswa('${sid}')">🖨️ Cetak laporan siswa</button>`, 'laporan-siswa');
}
function lpEkspor() {
  const { label, uji } = lpRentang(); const P = db.profil; const s = ';';
  let csv = '\uFEFF' + 'LAPORAN HASIL BELAJAR\n';
  csv += 'Sekolah' + s + P.sekolah + '\nKelas' + s + P.kelas + ' (' + P.tahun + ')\nPeriode' + s + label + '\n';
  csv += 'Bobot' + s + ['harian', 'tugas', 'sts', 'sas'].map(k => jenisLabel(k) + ' ' + db.bobot[k] + '%').join(', ') + '\n\n';
  csv += 'No' + s + 'Nama' + s + db.mapel.join(s) + s + 'Rata-rata' + s + '% Kehadiran' + s + 'Catatan sikap\n';
  siswaAktif().forEach((sw, i) => {
    const nas = db.mapel.map(m => { const r = lpNA(m, sw.id, uji); return r.na === null ? '-' : r.na; });
    const naAll = lpNAKeseluruhan(sw.id, uji);
    const k = lpKehadiran(sw.id, uji);
    const sk = lpSikap(sw.id, uji).length;
    csv += (i + 1) + s + sw.nama + s + nas.join(s) + s + (naAll === null ? '-' : naAll) + s + (k.pct === null ? '-' : k.pct + '%') + s + sk + '\n';
  });
  csv += '\nWali kelas' + s + P.guru + '\nNIP' + s + (P.nip || '-') + '\n';
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  a.download = 'laporan-' + label.replace(/[\/ ]/g, '-') + '.csv'; a.click();
  toast('Laporan kelas diekspor 📥');
}
function cetakSiswa(sid) {
  const s = db.siswa.find(x => x.id === sid); if (!s) return;
  const { label, uji } = lpRentang(); const P = db.profil;
  const k = lpKehadiran(sid, uji); const sikap = lpSikap(sid, uji);
  const naAll = lpNAKeseluruhan(sid, uji);
  const i = siswaAktif().indexOf(s);
  const hariCetak = tglIndo(tglISO());
  document.getElementById('area-cetak').innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;border-bottom:3px double #000;padding-bottom:10px;margin-bottom:14px">
      ${P.logo ? `<img src="${P.logo}" alt="Logo sekolah" style="width:68px;height:68px;object-fit:contain;flex:none">` : ''}
      <div style="flex:1;text-align:center">
        <p style="font-size:15pt;font-weight:bold;letter-spacing:1px">${esc((P.sekolah || '').toUpperCase())}</p>
        <p style="font-size:12pt;font-weight:bold;letter-spacing:.5px;margin-top:2px">LAPORAN HASIL BELAJAR</p>
        <p style="font-size:10.5pt;margin-top:2px">Kelas ${esc(P.kelas)} — Tahun Ajaran ${esc(P.tahun)} — ${label}</p>
      </div>
      ${P.foto ? `<img src="${P.foto}" alt="Foto wali kelas" style="width:60px;height:68px;object-fit:cover;border:1px solid #000;flex:none">` : (P.logo ? `<div style="width:68px;flex:none"></div>` : '')}
    </div>
    <table style="border:none;margin-bottom:12px"><tr>
      <td style="border:none;padding:2px 8px 2px 0;font-size:11pt">Nama siswa</td>
      <td style="border:none;padding:2px;font-size:11pt"><b>: ${esc(s.nama)}</b></td>
      <td style="border:none;padding:2px 8px 2px 30px;font-size:11pt">No. absen</td>
      <td style="border:none;padding:2px;font-size:11pt"><b>: ${i + 1}</b></td>
    </tr></table>
    <p style="font-size:11pt;font-weight:bold;margin-bottom:4px">A. Nilai Akademik</p>
    <table style="margin-bottom:12px">
      <tr><th>No</th><th style="text-align:left">Mata pelajaran</th>
        ${['harian', 'tugas', 'sts', 'sas'].map(j => `<th>${esc(jenisLabel(j))}</th>`).join('')}
        <th>Nilai akhir</th></tr>
      ${db.mapel.map((m, x) => {
    const r = lpNA(m, sid, uji);
    return `<tr><td style="text-align:center">${x + 1}</td><td>${esc(m)}</td>
          ${['harian', 'tugas', 'sts', 'sas'].map(j => `<td style="text-align:center">${r.detail[j] === null ? '-' : r.detail[j]}</td>`).join('')}
          <td style="text-align:center;font-weight:bold">${r.na === null ? '-' : r.na}</td></tr>`;
  }).join('')}
      <tr><td colspan="${2 + 4}" style="text-align:right;font-weight:bold">Rata-rata</td>
        <td style="text-align:center;font-weight:bold">${naAll === null ? '-' : naAll}</td></tr>
    </table>
    <p style="font-size:11pt;font-weight:bold;margin-bottom:4px">B. Kehadiran (${k.hari} hari efektif tercatat)</p>
    <table style="margin-bottom:12px;width:auto">
      <tr><th>Hadir</th><th>Sakit</th><th>Izin</th><th>Alpa</th><th>Terlambat</th><th>%</th></tr>
      <tr><td style="text-align:center">${k.c.H}</td><td style="text-align:center">${k.c.S}</td>
        <td style="text-align:center">${k.c.I}</td><td style="text-align:center">${k.c.A}</td>
        <td style="text-align:center">${k.c.T}</td><td style="text-align:center">${k.pct === null ? '-' : k.pct + '%'}</td></tr>
    </table>
    <p style="font-size:11pt;font-weight:bold;margin-bottom:4px">C. Catatan Wali Kelas</p>
    <div style="border:1px solid #000;padding:8px;min-height:60px;font-size:11pt;margin-bottom:18px">
      ${sikap.length ? sikap.map(c => `• ${tglIndo(c.t)}: ${esc(c.cat)} <i>(${c.jenis === 'positif' ? 'positif' : 'perlu perhatian'})</i>`).join('<br>') : '-'}
    </div>
    <p style="font-size:11pt;font-weight:bold;margin-bottom:4px">D. Ekstrakurikuler</p>
    <table style="margin-bottom:18px;width:100%">
      <tr><th style="width:5%;text-align:center">No</th><th style="width:55%;text-align:left">Kegiatan Ekstrakurikuler</th><th style="width:40%;text-align:center">Predikat</th></tr>
      ${(() => {
        const eskul = db.nilaiEskul[sid] || {};
        const keys = Object.keys(eskul);
        if (!keys.length) return `<tr><td colspan="3" style="text-align:center;color:#666">- Tidak mengikuti ekstrakurikuler -</td></tr>`;
        return keys.map((nama, x) => `
          <tr>
            <td style="text-align:center">${x + 1}</td>
            <td>${esc(nama)}</td>
            <td style="text-align:center;font-weight:bold">${esc(eskul[nama])}</td>
          </tr>
        `).join('');
      })()}
    </table>
    <table style="border:none;width:100%"><tr>
      <td style="border:none;width:55%"></td>
      <td style="border:none;text-align:center;font-size:11pt">
        ${hariCetak}<br>Wali Kelas ${esc(P.kelas)}<br><br><br><br>
        <b><u>${esc(P.guru)}</u></b><br>NIP. ${esc(P.nip || '-')}
      </td>
    </tr></table>`;
  window.print();
}


/* ================= SINKRONISASI SERVER (mode hybrid) ================= */
function serverAktif() { return !!(db.server.url && db.server.guru); }

async function panggilAPI(muatan) {
  if (!db.server.url) throw new Error('URL server belum diisi');
  const r = await fetch(db.server.url, { method: 'POST', body: JSON.stringify(muatan) });
  const j = await r.json();
  if (j.status !== 'ok') throw new Error(j.pesan || 'Server menolak permintaan');
  return j;
}

async function ujiLogin(url, pin) {
  const alamat = url + '?aksi=login&pin=' + encodeURIComponent(pin);
  const r = await fetch(alamat);
  const j = await r.json();
  if (j.status !== 'ok') throw new Error(j.pesan || 'PIN tidak dikenali');
  return j.guru;
}

function layarServer() {
  const s = db.server;
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarPengaturan()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">☁️ Sinkron server</h1>
        <p class="sub">${serverAktif() ? 'Terhubung sebagai ' + esc(s.guru.nama) : 'Belum terhubung'}</p></div>
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">🔗 Alamat server sekolah</p>
      <p class="sub" style="margin-bottom:10px;line-height:1.5">Diberikan oleh admin sekolah. Berakhiran /exec.</p>
      <div class="grup"><label>URL API</label>
        <input type="text" id="sv-url" placeholder="https://script.google.com/macros/s/.../exec" value="${esc(s.url)}"></div>
      <div class="grup"><label>PIN guru</label>
        <input type="text" id="sv-pin" inputmode="numeric" placeholder="6 digit" value=""></div>
      <button class="tbl-utama" onclick="svHubungkan()">🔌 Hubungkan</button>
    </div>

    ${serverAktif() ? `
    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">👤 Akun terhubung</p>
      <p style="font-size:13px;line-height:1.7">
        <b>${esc(s.guru.nama)}</b><br>
        NIP ${esc(s.guru.nip || '-')} · Kelas ${esc(s.guru.kelas || '-')}<br>
        <span class="sub">Sinkron terakhir: ${s.terakhirSinkron ? tglIndo(s.terakhirSinkron) : 'belum pernah'}</span>
      </p>
      <button class="tbl-garis" style="margin-top:10px;color:#A32D2D;border-color:rgba(163,45,45,.3)" onclick="svPutus()">Putuskan koneksi</button>
    </div>

    <div class="kartu">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">⬆️ Kirim data ke server</p>
      <p class="sub" style="margin-bottom:10px;line-height:1.5">Data tetap tersimpan di perangkat ini. Sinkron hanya menyalinnya ke server sekolah.</p>
      <button class="tbl-utama" id="sv-tombol" onclick="svSinkronAbsensi()">☁️ Sinkronkan absensi</button>
      <p class="info-kecil" id="sv-status"></p>
    </div>` : `
    <div class="kartu">
      <p class="sub" style="line-height:1.6">Setelah terhubung, tombol sinkron akan muncul di sini dan di layar Absensi. SIGAP tetap bisa dipakai penuh tanpa internet — sinkron hanya menyalin data ke server sekolah.</p>
    </div>`}`, 'server');
}

async function svHubungkan() {
  const url = val('sv-url').replace(/\s/g, '');
  const pin = val('sv-pin');
  if (!url || !pin) { toast('URL dan PIN wajib diisi 🙏'); return; }
  if (!url.endsWith('/exec')) { toast('URL harus berakhiran /exec'); return; }
  toast('Menghubungkan…');
  try {
    const guru = await ujiLogin(url, pin);
    db.server.url = url;
    db.server.guru = guru;
    simpan(); layarServer();
    toast('Terhubung sebagai ' + guru.nama + ' ✅');
  } catch (err) {
    toast('Gagal: ' + err.message);
  }
}

function svPutus() {
  if (!confirm('Putuskan koneksi server?\nData di perangkat ini tidak terhapus.')) return;
  db.server.guru = null; simpan(); layarServer(); toast('Koneksi diputus');
}

async function svSinkronAbsensi() {
  if (!serverAktif()) { toast('Hubungkan ke server dulu 🙏'); return; }
  const tanggal = Object.keys(db.absensi).filter(t => Object.keys(db.absensi[t]).length).sort();
  if (!tanggal.length) { toast('Belum ada absensi untuk disinkronkan'); return; }

  const tombol = document.getElementById('sv-tombol');
  const status = document.getElementById('sv-status');
  if (tombol) { tombol.disabled = true; tombol.textContent = '⏳ Mengirim…'; }

  let berhasil = 0, gagal = 0;
  for (const t of tanggal) {
    const daftar = siswaAktif()
      .filter(sw => db.absensi[t][sw.id])
      .map(sw => ({ id_siswa: sw.id, status: db.absensi[t][sw.id].s, keterangan: db.absensi[t][sw.id].ket || '' }));
    if (!daftar.length) continue;
    try {
      await panggilAPI({ aksi: 'simpanAbsensi', id_guru: db.server.guru.id, tanggal: t, daftar });
      berhasil++;
      if (status) status.textContent = `Terkirim ${berhasil}/${tanggal.length} hari…`;
    } catch (err) {
      gagal++;
      if (status) status.textContent = 'Gagal di ' + t + ': ' + err.message;
    }
  }

  db.server.terakhirSinkron = tglISO();
  simpan();
  if (tombol) { tombol.disabled = false; tombol.textContent = '☁️ Sinkronkan absensi'; }
  toast(gagal ? `${berhasil} hari terkirim, ${gagal} gagal` : `${berhasil} hari absensi tersinkron ✅`);
  if (status) status.textContent = gagal ? `Selesai dengan ${gagal} kegagalan.` : `Semua terkirim. Sinkron terakhir: ${tglIndo(db.server.terakhirSinkron)}`;
}

/* ================= PENGATURAN ================= */
function layarPengaturan() {
  tampilkan(`
    <div class="kepala">
      <span class="tbl-bulat" onclick="layarBeranda()" role="button" aria-label="Kembali">←</span>
      <div class="isi"><h1 style="font-size:18px">⚙️ Pengaturan</h1>
      <p class="sub">Data kelas &amp; aplikasi</p></div>
    </div>

    <div class="kolom-kartu">

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:10px">👩‍🏫 Identitas</p>
      <div class="grup"><label>Nama wali kelas</label><input type="text" id="p-guru" value="${esc(db.profil.guru)}"></div>
      <div class="grup"><label>NIP</label><input type="text" id="p-nip" inputmode="numeric" value="${esc(db.profil.nip)}"></div>
      <div class="grup"><label>Foto guru</label>
        <div style="display:flex;align-items:center;gap:10px">
          ${db.profil.foto ? `<img src="${db.profil.foto}" alt="Foto guru" style="width:48px;height:48px;border-radius:50%;object-fit:cover;border:2px solid rgba(255,255,255,.95)">` : `<span style="width:48px;height:48px;border-radius:50%;background:rgba(255,255,255,.6);border:.5px dashed rgba(83,74,183,.35);display:flex;align-items:center;justify-content:center;font-size:22px">🧑‍🏫</span>`}
          <button class="tbl-garis" onclick="document.getElementById('berkas-foto').click()">📷 ${db.profil.foto ? 'Ganti foto' : 'Unggah foto'}</button>
          ${db.profil.foto ? `<button class="tbl-garis" style="color:#A32D2D;border-color:rgba(163,45,45,.3)" onclick="hapusFoto()">Hapus</button>` : ''}
          <input type="file" id="berkas-foto" accept="image/*" style="display:none" onchange="unggahFoto(this)">
        </div>
      </div>
      <div class="grup"><label>Nama sekolah</label><input type="text" id="p-sekolah" value="${esc(db.profil.sekolah)}" placeholder="cth: SDN 042 GAMBIR"></div>
      <div class="grup"><label>Logo sekolah</label>
        <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
          ${db.profil.logo ? `<img src="${db.profil.logo}" alt="Logo" style="width:48px;height:48px;border-radius:12px;object-fit:contain;background:rgba(255,255,255,.85);border:.5px solid var(--kaca-tepi)">` : `<span style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.6);border:.5px dashed rgba(83,74,183,.35);display:flex;align-items:center;justify-content:center;font-size:21px">🏫</span>`}
          <button class="tbl-garis" onclick="document.getElementById('berkas-logo').click()">🖼️ ${db.profil.logo ? 'Ganti logo' : 'Unggah logo'}</button>
          ${db.profil.logo ? `<button class="tbl-garis" style="color:#A32D2D;border-color:rgba(163,45,45,.3)" onclick="hapusLogo()">Hapus</button>` : ''}
          <input type="file" id="berkas-logo" accept="image/*" style="display:none" onchange="unggahLogo(this)">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="grup"><label>Kelas</label><input type="text" id="p-kelas" value="${esc(db.profil.kelas)}"></div>
        <div class="grup"><label>Tahun ajaran</label><input type="text" id="p-tahun" value="${esc(db.profil.tahun)}"></div>
      </div>
      <button class="tbl-utama" onclick="simpanIdentitas()">💾 Simpan identitas</button>
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">🧒 Siswa aktif (${siswaAktif().length})</p>
      <div style="max-height:230px;overflow-y:auto">
      ${siswaAktif().map((s, i) => `
        <div class="baris-siswa">
          <span class="avatar av${i % 4}">${esc(inisial(s.nama))}</span>
          <span style="flex:1;font-size:13.5px">${i + 1}. ${esc(s.nama)}</span>
          <button class="hapus-kecil" style="color:var(--ungu)" onclick="arsipSiswa('${s.id}')" title="Arsipkan (pindah/keluar)" aria-label="Arsipkan">📦</button>
        </div>`).join('') || '<p class="sub">Belum ada siswa aktif</p>'}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <input type="text" id="p-siswa-baru" placeholder="Nama siswa baru…">
        <button class="tbl-garis" onclick="tambahSiswa()">＋</button>
      </div>
      ${db.siswa.some(s => s.aktif === false) ? `
      <p style="font-size:12px;font-weight:600;color:var(--ungu-muda);margin:12px 0 4px">📦 Diarsipkan (${db.siswa.filter(s => s.aktif === false).length}) — riwayatnya tetap tersimpan</p>
      ${db.siswa.filter(s => s.aktif === false).map(s => `
        <div class="baris-siswa" style="opacity:.75">
          <span style="flex:1;font-size:13px;color:var(--ungu-teks)">${esc(s.nama)}</span>
          <button class="hapus-kecil" style="color:#085041" onclick="pulihkanSiswa('${s.id}')" title="Kembalikan ke aktif" aria-label="Pulihkan">↩️</button>
          <button class="hapus-kecil" onclick="hapusSiswa('${s.id}')" title="Hapus permanen" aria-label="Hapus">✕</button>
        </div>`).join('')}` : ''}
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">📚 Mata pelajaran (ketuk untuk hapus)</p>
      <div style="display:flex;flex-wrap:wrap;gap:7px">
        ${db.mapel.map((m, i) => `<span class="chip" onclick="hapusMapel(${i})">${esc(m)} <span class="x">✕</span></span>`).join('')}
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <input type="text" id="p-mapel-baru" placeholder="Mapel baru…">
        <button class="tbl-garis" onclick="tambahMapel()">＋</button>
      </div>
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">🏷️ Nama jenis nilai</p>
      <p class="sub" style="margin-bottom:10px">Sesuaikan dengan istilah sekolah Anda, mis. PH, PTS, PAS</p>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        ${['harian', 'tugas', 'sts', 'sas'].map(k => `
          <div><label>Semula "${k === 'sts' ? 'STS' : k === 'sas' ? 'SAS' : k[0].toUpperCase() + k.slice(1)}"</label>
          <input type="text" id="lj-${k}" maxlength="12" value="${esc(jenisLabel(k))}"></div>`).join('')}
      </div>
      <button class="tbl-utama" style="margin-top:12px" onclick="simpanLabelJenis()">💾 Simpan nama jenis</button>
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">⚖️ Bobot nilai akhir (%)</p>
      <p class="sub" style="margin-bottom:10px">Jumlah keempatnya harus 100</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        ${['harian', 'tugas', 'sts', 'sas'].map(k => `
          <div><label>${esc(jenisLabel(k))}</label>
          <input type="number" id="b-${k}" min="0" max="100" value="${db.bobot[k]}"></div>`).join('')}
      </div>
      <button class="tbl-utama" style="margin-top:12px" onclick="simpanBobot()">💾 Simpan bobot</button>
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">📅 Kalender pendidikan</p>
      <p class="sub" style="margin-bottom:10px;line-height:1.5">Sabtu–Minggu &amp; libur nasional sudah otomatis (tanggal keagamaan bersifat perkiraan — sesuaikan bila SKB berbeda). Tambahkan libur khusus sekolah di sini, mis. libur semester atau kegiatan sekolah.</p>
      <div style="display:grid;grid-template-columns:auto 1fr;gap:8px;margin-bottom:8px">
        <input type="date" id="kal-tgl" style="width:140px">
        <input type="text" id="kal-nama" placeholder="cth: Libur semester 1">
      </div>
      <button class="tbl-garis" style="width:100%" onclick="kalTambahLibur()">🏖️ Tandai sebagai hari libur</button>
      ${Object.keys(db.kalender.libur).length ? `
      <p style="font-size:12px;font-weight:600;color:var(--ungu-muda);margin:12px 0 4px">🏖️ Libur khusus sekolah</p>
      ${Object.keys(db.kalender.libur).sort().map(t => `
        <div class="baris-siswa">
          <span style="flex:1;font-size:12.5px">${tglIndo(t)} — ${esc(db.kalender.libur[t])}</span>
          <button class="hapus-kecil" onclick="kalHapus('libur','${t}')" aria-label="Hapus">✕</button>
        </div>`).join('')}` : ''}
      ${Object.keys(db.kalender.masuk).length ? `
      <p style="font-size:12px;font-weight:600;color:var(--ungu-muda);margin:12px 0 4px">🏫 Masuk khusus (libur yang dijadikan hari sekolah)</p>
      ${Object.keys(db.kalender.masuk).sort().map(t => `
        <div class="baris-siswa">
          <span style="flex:1;font-size:12.5px">${tglIndo(t)}</span>
          <button class="hapus-kecil" onclick="kalHapus('masuk','${t}')" aria-label="Hapus">✕</button>
        </div>`).join('')}` : ''}
    </div>

    <div class="kartu" style="margin-bottom:12px">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:4px">☁️ Sinkron server sekolah</p>
      <p class="sub" style="margin-bottom:10px;line-height:1.5">${serverAktif() ? 'Terhubung sebagai <b>' + esc(db.server.guru.nama) + '</b>' + (db.server.terakhirSinkron ? ' · sinkron terakhir ' + tglIndo(db.server.terakhirSinkron) : '') : 'Belum terhubung — SIGAP tetap berjalan penuh secara offline.'}</p>
      <button class="tbl-garis" style="width:100%" onclick="layarServer()">${serverAktif() ? '⚙️ Kelola koneksi &amp; sinkron' : '🔌 Hubungkan ke server'}</button>
    </div>

    <div class="kartu">
      <p style="font-size:12.5px;font-weight:600;color:var(--ungu);margin-bottom:8px">🗄️ Data &amp; cadangan</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="tbl-garis" onclick="unduhCadangan()">⬇️ Unduh cadangan</button>
        <button class="tbl-garis" onclick="document.getElementById('berkas-pulih').click()">⬆️ Pulihkan</button>
        <input type="file" id="berkas-pulih" accept=".json" style="display:none" onchange="pulihkanCadangan(this)">
      </div>
      <p class="info-kecil">Data tersimpan <b>otomatis</b> di perangkat ini setiap kali Anda menekan simpan — tidak perlu dipulihkan rutin. Cadangan mingguan hanyalah salinan pengaman; tombol Pulihkan hanya dipakai saat pindah perangkat atau data hilang. Kebiasaan baik: unduh cadangan tiap Jumat 😉</p>
      <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px">
        <button class="tbl-garis" onclick="tahunBaru()">🎓 Mulai tahun ajaran baru</button>
        <button class="tbl-garis" style="color:#A32D2D;border-color:rgba(163,45,45,.3)" onclick="hapusSemua()">🗑️ Hapus semua data</button>
      </div>
    </div>
    </div>`, 'pengaturan');
}
function simpanIdentitas() {
  const g = val('p-guru'), k = val('p-kelas');
  if (!g || !k) { toast('Nama wali kelas dan kelas wajib diisi'); return; }
  db.profil = { guru: g, nip: val('p-nip'), sekolah: val('p-sekolah'), kelas: k, tahun: val('p-tahun'), logo: db.profil.logo || '', foto: db.profil.foto || '' };
  simpan(); toast('Identitas disimpan ✅');
}
function unggahLogo(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      const u = Math.min(1, 200 / Math.max(img.width, img.height));
      c.width = Math.max(1, Math.round(img.width * u)); c.height = Math.max(1, Math.round(img.height * u));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      db.profil.logo = c.toDataURL('image/png');
      simpan(); layarPengaturan(); toast('Logo sekolah dipasang ✅');
    };
    img.onerror = () => toast('Berkas gambar tidak bisa dibaca 🙏');
    img.src = r.result;
  };
  r.readAsDataURL(f); input.value = '';
}
function unggahFoto(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    const img = new Image();
    img.onload = () => {
      const maks = 220; const sk = Math.min(1, maks / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * sk); c.height = Math.round(img.height * sk);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      db.profil.foto = c.toDataURL('image/jpeg', .85);
      simpan(); layarPengaturan(); toast('Foto guru tersimpan ✅');
    };
    img.src = r.result;
  };
  r.readAsDataURL(f); input.value = '';
}
function hapusFoto() { db.profil.foto = ''; simpan(); layarPengaturan(); toast('Foto dihapus'); }
function hapusLogo() {
  db.profil.logo = ''; simpan(); layarPengaturan(); toast('Logo dihapus');
}
function tambahSiswa() {
  const n = val('p-siswa-baru'); if (!n) return;
  if (db.siswa.some(s => s.nama.toLowerCase() === n.toLowerCase())) { toast('Nama itu sudah ada di daftar'); return; }
  db.siswa.push({ id: idBaru(), nama: n }); simpan(); layarPengaturan(); toast('Siswa ditambahkan ✅');
}
function arsipSiswa(id) {
  const s = db.siswa.find(x => x.id === id);
  if (!confirm('Arsipkan ' + s.nama + '?\nIa tak muncul lagi di absensi/nilai, tapi seluruh riwayatnya tetap tersimpan dan bisa dipulihkan.')) return;
  s.aktif = false; simpan(); layarPengaturan(); toast('Siswa diarsipkan 📦');
}
function pulihkanSiswa(id) {
  const s = db.siswa.find(x => x.id === id);
  s.aktif = true; simpan(); layarPengaturan(); toast(s.nama + ' kembali aktif ↩️');
}
function hapusSiswa(id) {
  const s = db.siswa.find(x => x.id === id);
  if (!confirm('HAPUS PERMANEN ' + s.nama + '?\nSemua riwayat absensi & nilainya tidak akan ditampilkan lagi. Tindakan ini tidak bisa dibatalkan.')) return;
  db.siswa = db.siswa.filter(x => x.id !== id); simpan(); layarPengaturan();
}
function tambahMapel() {
  const m = val('p-mapel-baru'); if (!m) return;
  if (db.mapel.some(x => x.toLowerCase() === m.toLowerCase())) { toast('Mapel itu sudah ada'); return; }
  db.mapel.push(m); simpan(); layarPengaturan();
}
function hapusMapel(i) {
  if (!confirm('Hapus mapel ' + db.mapel[i] + '?')) return;
  db.mapel.splice(i, 1); simpan(); layarPengaturan();
}
function simpanBobot() {
  const b = { harian: +val('b-harian') || 0, tugas: +val('b-tugas') || 0, sts: +val('b-sts') || 0, sas: +val('b-sas') || 0 };
  const jml = b.harian + b.tugas + b.sts + b.sas;
  if (jml !== 100) { toast('Jumlah bobot saat ini ' + jml + '%. Harus pas 100% ya'); return; }
  db.bobot = b; simpan(); toast('Bobot nilai disimpan ✅');
}
function kalTambahLibur() {
  const t = val('kal-tgl'); const n = val('kal-nama') || 'Libur satuan pendidikan';
  if (!t) { toast('Pilih dulu tanggalnya 🙏'); return; }
  db.kalender.libur[t] = n; delete db.kalender.masuk[t];
  simpan(); layarPengaturan(); toast('Hari libur ditambahkan 🏖️');
}
function kalHapus(jenis, t) {
  delete db.kalender[jenis][t]; simpan(); layarPengaturan(); toast('Entri kalender dihapus');
}
function simpanLabelJenis() {
  const l = { harian: val('lj-harian'), tugas: val('lj-tugas'), sts: val('lj-sts'), sas: val('lj-sas') };
  if (!l.harian || !l.tugas || !l.sts || !l.sas) { toast('Semua nama jenis harus diisi 🙏'); return; }
  db.labelJenis = l; simpan(); layarPengaturan(); toast('Nama jenis nilai disimpan ✅');
}
function unduhCadangan() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  a.download = 'cadangan-sigap-' + tglISO() + '.json'; a.click();
  db.cadanganTerakhir = tglISO(); simpan();
  toast('Cadangan diunduh 📦');
}
function pulihkanCadangan(input) {
  const f = input.files[0]; if (!f) return;
  const r = new FileReader();
  r.onload = () => {
    try {
      const d = JSON.parse(r.result);
      if (!d.versi || !d.profil) { toast('Berkas ini bukan cadangan aplikasi 🙏'); return; }
      if (!confirm('Pulihkan data dari cadangan?\nData yang ada sekarang akan diganti.')) return;
      db = d; simpan(); layarBeranda(); toast('Data berhasil dipulihkan 🎉');
    } catch (e) { toast('Berkas tidak bisa dibaca'); }
  };
  r.readAsText(f); input.value = '';
}
function tahunBaru() {
  if (!confirm('Mulai tahun ajaran baru? 🎓\n\nArsip data tahun ini akan otomatis terunduh dulu, lalu absensi, nilai, dan jurnal dikosongkan untuk tahun baru. Identitas & mapel tetap.')) return;
  // arsip otomatis dulu — jaring pengaman
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' }));
  a.download = 'arsip-sigap-' + String(db.profil.tahun || '').replace('/', '-') + '.json'; a.click();
  const pertahankan = confirm('Pertahankan daftar siswa?\n\nOK = ya (naik kelas bersama Anda)\nBatal = kosongkan (menerima siswa baru)');
  db.absensi = {}; db.nilai = {}; db.jurnal = {};
  if (!pertahankan) db.siswa = [];
  db.profil.tahun = tahunAjarOtomatis();
  db.cadanganTerakhir = tglISO();
  simpan(); layarBeranda();
  toast('Selamat tahun ajaran baru ' + db.profil.tahun + ' 🎓 (arsip lama sudah terunduh)');
}
function hapusSemua() {
  if (!confirm('Yakin menghapus SEMUA data?\nTindakan ini tidak bisa dibatalkan.')) return;
  if (!confirm('Sekali lagi: semua siswa, absensi, nilai, dan jurnal akan hilang. Lanjutkan?')) return;
  
  // 1. Wipe the local storage
  localStorage.removeItem(KUNCI); 
  muat(); 
  wiz = { langkah: 1, guru: '', nip: '', sekolah: '', kelas: '', tahun: '', siswa: [], mapel: [...DATA_AWAL.mapel] };
  
  // 2. NEW LOGIC: Lock the portal and kick them back to the Landing Page
  document.getElementById('input-nip').value = '';
  document.getElementById('input-pin').value = '';
  document.getElementById('dashboard-stage').style.display = 'none';
  document.getElementById('landing-stage').style.display = 'flex'; 
  
  // 3. Show a confirmation toast
  toast('Semua data dihapus. Silakan login kembali 🔒');
}

/* ================= MULAI ================= */
muat();
if (db.profil.guru) { 
    // 1. HIDE LANDING & LOGIN STAGES ON RELOAD
    document.getElementById('landing-stage').style.display = 'none';
    document.getElementById('login-stage').style.display = 'none';
    document.getElementById('dashboard-stage').style.display = 'block';

    // 2. Fetch latest students from cloud on load
    if (db.profil.id) {
        fetch(`https://sigap-backendthehans-production.up.railway.app/api/students?teacher_id=${db.profil.id}`)
            .then(res => res.json())
            .then(studentJson => {
                if (studentJson.success) {
                    db.siswa = studentJson.data.map(s => ({ id: s.id, nama: s.name, aktif: s.is_active }));
                    simpan();
                }
                layarBeranda();
            })
            .catch(() => layarBeranda());
    } else {
        layarBeranda(); 
    }
} else { 
    // Make sure the landing stage is visible if not logged in
    document.getElementById('landing-stage').style.display = 'flex';
    document.getElementById('login-stage').style.display = 'none';
    document.getElementById('dashboard-stage').style.display = 'none';
}