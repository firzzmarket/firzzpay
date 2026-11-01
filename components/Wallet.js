"use client";

import { useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, QrCode, Clock3, Bell, Wallet,
  Home, Activity, UserRound, ShieldCheck, Plus, ChevronRight,
  CircleHelp, X, Sparkles
} from "lucide-react";

const money = (n) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(n);

const transactions = [
  { id: "FP-DEMO-003", title: "Contoh Top Up", date: "Hari ini · 09.15", amount: 100000, type: "in", status: "SIMULASI" },
  { id: "FP-DEMO-002", title: "Contoh pembayaran", date: "Kemarin · 16.40", amount: -25000, type: "out", status: "SIMULASI" },
  { id: "FP-DEMO-001", title: "Contoh Top Up", date: "30 Okt · 11.20", amount: 50000, type: "in", status: "SIMULASI" }
];

export default function WalletApp() {
  const [tab, setTab] = useState("Beranda");
  const [modal, setModal] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [notice, setNotice] = useState("");

  const actions = [
    { label: "Top Up", icon: Plus },
    { label: "Transfer", icon: ArrowUpRight },
    { label: "QR Pay", icon: QrCode },
    { label: "Riwayat", icon: Clock3 }
  ];

  function openAction(action) {
    if (action === "Riwayat") setTab("Aktivitas");
    else setModal(action);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setTab("Beranda"); }}>
          <span className="brand-mark"><Wallet size={21} /></span>
          <span>FIRZZ<span className="brand-light">PAY</span></span>
        </a>
        <button className="icon-button" aria-label="Notifikasi" onClick={() => setNotice("Belum ada notifikasi.")}>
          <Bell size={19} /><i />
        </button>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">DOMPET DIGITAL DEMO</p>
          <h1>Halo, Pengguna 👋</h1>
          <p className="muted">Selamat datang di FirzzPay.</p>
        </div>
        <span className="secure-pill"><ShieldCheck size={13} /> Demo aman</span>
      </section>

      {tab === "Beranda" && <>
        <section className="balance-card">
          <div className="balance-top">
            <span><Wallet size={16} /> Saldo demo</span>
            <button className="text-button" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <div className="balance-amount">{showBalance ? money(500000) : "••••••••"}</div>
          <div className="balance-foot">
            <span>Saldo contoh · bukan uang sungguhan</span>
            <span className="demo-tag">SIMULASI</span>
          </div>
        </section>

        <section className="quick-actions">
          {actions.map(({ label, icon: Icon }) => (
            <button className="action" key={label} onClick={() => openAction(label)}>
              <span className="action-icon"><Icon size={21} /></span>
              <span>{label}</span>
            </button>
          ))}
        </section>

        <section className="section">
          <div className="section-heading">
            <div><p className="eyebrow">RINGKASAN</p><h2>Aktivitas terbaru</h2></div>
            <button className="link-button" onClick={() => setTab("Aktivitas")}>Lihat semua <ChevronRight size={15} /></button>
          </div>
          <TransactionList items={transactions} />
        </section>

        <section className="notice-card">
          <span className="notice-icon"><ShieldCheck size={20} /></span>
          <div><b>Keamanan adalah prioritas</b><p>FirzzPay masih tahap demo. Jangan gunakan untuk menyimpan atau mengirim uang sungguhan.</p></div>
        </section>
      </>}

      {tab === "Aktivitas" && <section className="section page-section">
        <p className="eyebrow">CATATAN AKUN</p><h2>Riwayat transaksi</h2>
        <p className="muted">Semua data berikut hanya contoh untuk pengembangan.</p>
        <TransactionList items={transactions} />
      </section>}

      {tab === "Profil" && <section className="section page-section">
        <p className="eyebrow">AKUN</p><h2>Profil pengguna</h2>
        <div className="profile-card">
          <div className="avatar">F</div><div><b>Pengguna Demo</b><p className="muted">demo@firzzpay.test</p></div>
        </div>
        <div className="settings-row"><ShieldCheck size={18}/><span>Keamanan akun</span><ChevronRight size={17}/></div>
        <div className="settings-row"><CircleHelp size={18}/><span>Pusat bantuan</span><ChevronRight size={17}/></div>
        <p className="muted small">Profil demo. Login dan pengelolaan akun akan ditambahkan pada tahap berikutnya.</p>
      </section>}

      <nav className="bottom-nav">
        {[
          { name: "Beranda", icon: Home },
          { name: "Aktivitas", icon: Activity },
          { name: "Profil", icon: UserRound }
        ].map(({ name, icon: Icon }) => (
          <button key={name} className={tab === name ? "nav-item active" : "nav-item"} onClick={() => setTab(name)}>
            <Icon size={20} /><span>{name}</span>
          </button>
        ))}
      </nav>

      {modal && <div className="modal-backdrop" onClick={() => setModal("")}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" onClick={() => setModal("")}><X size={19}/></button>
          <span className="modal-icon"><Sparkles size={22}/></span>
          <p className="eyebrow">FITUR DALAM PENGEMBANGAN</p>
          <h2>{modal}</h2>
          <p className="muted">Fitur {modal} akan dihubungkan ke penyedia pembayaran resmi setelah proses kelayakan, akun mitra, dan pengujian sandbox selesai.</p>
          <div className="demo-warning">Belum tersedia untuk transaksi uang sungguhan.</div>
          <button className="primary-button" onClick={() => setModal("")}>Mengerti</button>
        </div>
      </div>}

      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>Tutup</button></div>}
      <footer>FIRZZPAY © 2026 <span>Versi 1.0 · Demo</span></footer>
    </main>
  );
}

function TransactionList({ items }) {
  return <div className="transaction-list">
    {items.map((tx) => (
      <div className="transaction" key={tx.id}>
        <span className={tx.type === "in" ? "tx-icon incoming" : "tx-icon outgoing"}>
          {tx.type === "in" ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}
        </span>
        <div className="tx-info"><b>{tx.title}</b><span>{tx.date} · {tx.status}</span></div>
        <strong className={tx.type === "in" ? "positive" : ""}>{tx.amount > 0 ? "+" : ""}{money(tx.amount)}</strong>
      </div>
    ))}
  </div>;
}
