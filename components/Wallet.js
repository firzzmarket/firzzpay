"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, QrCode, Clock3, Bell, Wallet,
  Home, Activity, UserRound, ShieldCheck, Plus, ChevronRight,
  CircleHelp, X, Sparkles, RefreshCw
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

const money = (n) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(n || 0));

const dateLabel = (value) => new Intl.DateTimeFormat("id-ID", {
  day: "2-digit", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit"
}).format(new Date(value));

export default function WalletApp() {
  const [tab, setTab] = useState("Beranda");
  const [modal, setModal] = useState("");
  const [showBalance, setShowBalance] = useState(true);
  const [notice, setNotice] = useState("");
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [amount, setAmount] = useState("25000");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("Pengguna FirzzPay");
  const [profileDraft, setProfileDraft] = useState("");
  const [profileEditing, setProfileEditing] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);

  const supabase = getSupabase();

  const loadWallet = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      setError("Sesi login tidak ditemukan. Silakan masuk kembali.");
      setLoading(false);
      return;
    }
    setEmail(userData.user.email || "");
    const savedName = userData.user.user_metadata?.display_name || "Pengguna FirzzPay";
    setDisplayName(savedName);
    setProfileDraft(savedName);
    const { data: wallet, error: walletError } = await supabase
      .from("wallets").select("balance").eq("user_id", userData.user.id).maybeSingle();
    if (walletError) {
      setError("Database belum disiapkan. Jalankan SQL FirzzPay di Supabase terlebih dahulu.");
      setLoading(false);
      return;
    }
    if (!wallet) {
      setError("Dompet demo belum tersedia. Muat ulang halaman beberapa saat lagi.");
      setLoading(false);
      return;
    }
    const { data: rows, error: txError } = await supabase
      .from("wallet_transactions")
      .select("id,title,amount,type,status,created_at")
      .eq("user_id", userData.user.id)
      .order("created_at", { ascending: false })
      .limit(30);
    if (txError) {
      setError("Riwayat belum dapat dimuat. Periksa kebijakan tabel Supabase.");
    } else {
      setBalance(Number(wallet.balance));
      setTransactions(rows || []);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadWallet(); }, [loadWallet]);

  const actions = [
    { label: "Top Up", icon: Plus },
    { label: "Transfer", icon: ArrowUpRight },
    { label: "QR Pay", icon: QrCode },
    { label: "Riwayat", icon: Clock3 }
  ];

  function openAction(action) {
    if (action === "Riwayat") setTab("Aktivitas");
    else if (action === "QR Pay") setModal("QR Pay");
    else {
      setModal(action);
      setAmount("25000");
      setDescription("");
      setError("");
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    const cleanName = profileDraft.trim();
    if (!cleanName || cleanName.length > 30) {
      setError("Nama harus diisi dan maksimal 30 karakter.");
      return;
    }
    setProfileSaving(true);
    setError("");
    const { error: updateError } = await supabase.auth.updateUser({ data: { display_name: cleanName } });
    if (updateError) setError(updateError.message || "Nama belum berhasil disimpan.");
    else {
      setDisplayName(cleanName);
      setProfileEditing(false);
      setNotice("Profil berhasil diperbarui.");
    }
    setProfileSaving(false);
  }

  async function submitDemoTransaction(e) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const numericAmount = Number(amount);
    if (!Number.isSafeInteger(numericAmount) || numericAmount < 1000 || numericAmount > 1000000) {
      setError("Masukkan nominal Rp1.000 sampai Rp1.000.000.");
      setSaving(false);
      return;
    }
    const type = modal === "Top Up" ? "in" : "out";
    const { error: rpcError } = await supabase.rpc("apply_demo_transaction", {
      p_type: type,
      p_amount: numericAmount,
      p_description: description.trim() || (type === "in" ? "Top Up Demo" : "Transfer Demo")
    });
    if (rpcError) {
      setError(rpcError.message || "Transaksi demo gagal diproses.");
      setSaving(false);
      return;
    }
    setModal("");
    setNotice("Transaksi simulasi berhasil dicatat.");
    await loadWallet();
    setSaving(false);
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="#" onClick={(e) => { e.preventDefault(); setTab("Beranda"); }}>
          <span className="brand-mark"><Wallet size={21} /></span>
          <span>FIRZZ<span className="brand-light">PAY</span></span>
        </a>
        <button className="icon-button" aria-label="Notifikasi" onClick={() => setNotice(transactions.length ? `Ada ${transactions.length} catatan transaksi di riwayat akunmu.` : "Belum ada aktivitas baru.")}>
          <Bell size={19} /><i />
        </button>
      </header>

      <section className="welcome">
        <div>
          <p className="eyebrow">DOMPET DIGITAL DEMO</p>
          <h1>Halo, {displayName} 👋</h1>
          <p className="muted">Selamat datang di FirzzPay.</p>
        </div>
        <span className="secure-pill"><ShieldCheck size={13} /> Demo aman</span>
      </section>

      {error && !modal && <div className="wallet-error" role="alert">{error}</div>}

      {tab === "Beranda" && <>
        <section className="balance-card">
          <div className="balance-top">
            <span><Wallet size={16} /> Saldo demo</span>
            <button className="text-button" onClick={() => setShowBalance(!showBalance)}>
              {showBalance ? "Sembunyikan" : "Tampilkan"}
            </button>
          </div>
          <div className="balance-amount">
            {loading ? "Memuat..." : showBalance ? money(balance) : "••••••••"}
          </div>
          <div className="balance-foot">
            <span>Saldo simulasi · bukan uang sungguhan</span>
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
          {loading ? <p className="muted">Memuat riwayat...</p> : <TransactionList items={transactions.slice(0, 4)} />}
          {!loading && transactions.length === 0 && <p className="muted empty-state">Belum ada transaksi. Coba Top Up demo untuk membuat catatan pertama.</p>}
        </section>

        <section className="notice-card">
          <span className="notice-icon"><ShieldCheck size={20} /></span>
          <div><b>Keamanan adalah prioritas</b><p>FirzzPay masih tahap demo. Saldo dan transaksi hanya simulasi, bukan uang sungguhan.</p></div>
        </section>
      </>}

      {tab === "Aktivitas" && <section className="section page-section">
        <div className="section-heading">
          <div><p className="eyebrow">CATATAN AKUN</p><h2>Riwayat transaksi</h2></div>
          <button className="link-button" onClick={loadWallet}><RefreshCw size={14}/> Muat ulang</button>
        </div>
        <p className="muted">Riwayat tersimpan untuk akun yang sedang login.</p>
        {loading ? <p className="muted">Memuat riwayat...</p> : <TransactionList items={transactions} />}
        {!loading && transactions.length === 0 && <p className="muted empty-state">Belum ada transaksi.</p>}
      </section>}

      {tab === "Profil" && <section className="section page-section">
        <p className="eyebrow">AKUN</p><h2>Profil pengguna</h2>
        <div className="profile-card">
          <div className="avatar">{(displayName[0] || "F").toUpperCase()}</div><div><b>{displayName}</b><p className="muted">{email}</p></div>
        </div>
        {profileEditing ? <form className="profile-edit-form" onSubmit={saveProfile}><label>Nama tampilan</label><input value={profileDraft} maxLength={30} onChange={e => setProfileDraft(e.target.value)} placeholder="Nama kamu" required/><div className="profile-edit-actions"><button type="button" onClick={() => {setProfileEditing(false);setProfileDraft(displayName);setError("");}}>Batal</button><button type="submit" disabled={profileSaving}>{profileSaving ? "Menyimpan..." : "Simpan nama"}</button></div>{error && <p className="auth-error">{error}</p>}</form> : <button className="settings-row settings-button" onClick={() => {setProfileEditing(true);setProfileDraft(displayName);}}><UserRound size={18}/><span>Edit nama profil</span><ChevronRight size={17}/></button>}
        <div className="settings-row"><ShieldCheck size={18}/><span>Keamanan akun</span><ChevronRight size={17}/></div>
        <div className="settings-row"><CircleHelp size={18}/><span>Pusat bantuan</span><ChevronRight size={17}/></div>
        <p className="muted small">Akun demo FirzzPay. Jangan gunakan saldo simulasi sebagai alat pembayaran.</p>
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

      {modal && <div className="modal-backdrop" onClick={() => !saving && setModal("")}>
        <div className="modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" disabled={saving} onClick={() => setModal("")}><X size={19}/></button>
          {modal === "QR Pay" ? <><span className="modal-icon"><QrCode size={22}/></span><p className="eyebrow">QR PAY SIMULASI</p><h2>QR pembayaran demo</h2><p className="muted">Ini hanya tampilan contoh. Kode ini tidak dapat dipindai dan tidak menerima pembayaran.</p><div className="qr-demo-code" aria-label="Ilustrasi QR demo"><span/><span/><span/><span/><span/><span/><span/><span/><span/></div><div className="demo-warning">QR tidak aktif · Jangan gunakan untuk transaksi sungguhan.</div><button className="primary-button" onClick={() => setModal("")}>Mengerti</button></> : <><span className="modal-icon"><Sparkles size={22}/></span>
          <p className="eyebrow">TRANSAKSI SIMULASI</p>
          <h2>{modal} Demo</h2>
          <p className="muted">{modal === "Top Up" ? "Nominal akan ditambahkan ke saldo demo akun ini." : "Nominal akan dikurangi dari saldo demo akun ini. Tidak ada uang yang dikirim ke orang lain."}</p>
          <form className="demo-form" onSubmit={submitDemoTransaction}>
            <label>Nominal (Rp)</label>
            <input type="number" min="1000" max="1000000" step="1000" required value={amount} onChange={e => setAmount(e.target.value)} />
            <label>Keterangan (opsional)</label>
            <input type="text" maxLength="60" value={description} onChange={e => setDescription(e.target.value)} placeholder={modal === "Top Up" ? "Top Up Demo" : "Transfer Demo"} />
            {error && <p className="auth-error">{error}</p>}
            <div className="demo-warning">Hanya simulasi. Tidak melibatkan uang atau pembayaran sungguhan.</div>
            <button className="primary-button" disabled={saving || loading}>{saving ? "Memproses..." : "Konfirmasi simulasi"}</button>
          </form></>}
        </div>
      </div>}

      {notice && <div className="toast" role="status">{notice}<button onClick={() => setNotice("")}>Tutup</button></div>}
      <footer>FIRZZPAY © 2026 <span>Versi 1.1 · Demo</span></footer>
    </main>
  );
}

function TransactionList({ items }) {
  if (!items.length) return null;
  return <div className="transaction-list">
    {items.map((tx) => (
      <div className="transaction" key={tx.id}>
        <span className={tx.type === "in" ? "tx-icon incoming" : "tx-icon outgoing"}>
          {tx.type === "in" ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}
        </span>
        <div className="tx-info"><b>{tx.title}</b><span>{dateLabel(tx.created_at)} · {tx.status}</span></div>
        <strong className={tx.type === "in" ? "positive" : ""}>{tx.type === "in" ? "+" : "-"}{money(tx.amount)}</strong>
      </div>
    ))}
  </div>;
}
