"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownLeft, ArrowUpRight, QrCode, Clock3, Bell, Wallet,
  Home, Activity, UserRound, ShieldCheck, Plus, ChevronRight,
  CircleHelp, X, Sparkles, RefreshCw, Download
} from "lucide-react";
import { getSupabase } from "../lib/supabase";

const money = (n) => new Intl.NumberFormat("id-ID", {
  style: "currency", currency: "IDR", maximumFractionDigits: 0
}).format(Number(n || 0));

const transactionCategory = (title) => {
  const match = String(title || "").match(/^\\[([^\\]]+)\\]\\s*/);
  return match ? match[1] : "";
};
const transactionTitle = (title) => String(title || "").replace(/^\\[[^\\]]+\\]\\s*/, "");

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
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  const [historyType, setHistoryType] = useState("all");
  const [historyDate, setHistoryDate] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("Lainnya");
  const [monthlyBudget, setMonthlyBudget] = useState(200000);
  const [budgetDraft, setBudgetDraft] = useState("200000");

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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("firzzpay-demo-monthly-budget");
      if (saved && Number.isSafeInteger(Number(saved)) && Number(saved) >= 1000) {
        setMonthlyBudget(Number(saved));
        setBudgetDraft(String(saved));
      }
    } catch {}
  }, []);

  const filteredTransactions = transactions.filter((tx) => {
    const query = historySearch.trim().toLocaleLowerCase("id-ID");
    const matchesSearch = !query || String(tx.title || "").toLocaleLowerCase("id-ID").includes(query) || String(tx.status || "").toLocaleLowerCase("id-ID").includes(query) || String(tx.id || "").toLowerCase().includes(query);
    const matchesType = historyType === "all" || tx.type === historyType;
    const txDate = new Date(tx.created_at);
    const now = new Date();
    const matchesDate = historyDate === "all" || (historyDate === "today" && txDate.toDateString() === now.toDateString()) || (historyDate === "week" && (now - txDate) <= 7 * 86400000 && txDate <= now) || (historyDate === "month" && txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear());
    return matchesSearch && matchesType && matchesDate;
  });

  const totalIncoming = transactions.filter((tx) => tx.type === "in").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const totalOutgoing = transactions.filter((tx) => tx.type === "out").reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const weeklyStats = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setHours(0, 0, 0, 0);
    day.setDate(day.getDate() - (6 - index));
    const nextDay = new Date(day);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayRows = transactions.filter((tx) => {
      const date = new Date(tx.created_at);
      return date >= day && date < nextDay;
    });
    return {
      label: new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(day),
      incoming: dayRows.filter((tx) => tx.type === "in").reduce((sum, tx) => sum + Number(tx.amount || 0), 0),
      outgoing: dayRows.filter((tx) => tx.type === "out").reduce((sum, tx) => sum + Number(tx.amount || 0), 0)
    };
  });
  const weeklyMax = Math.max(1, ...weeklyStats.map((day) => day.incoming + day.outgoing));
  const currentMonthExpenses = transactions.filter((tx) => {
    const date = new Date(tx.created_at);
    const now = new Date();
    return tx.type === "out" && date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
  }).reduce((sum, tx) => sum + Number(tx.amount || 0), 0);
  const budgetPercent = Math.min(100, Math.round(currentMonthExpenses / Math.max(1, monthlyBudget) * 100));

  function saveMonthlyBudget(e) {
    e.preventDefault();
    const value = Number(budgetDraft);
    if (!Number.isSafeInteger(value) || value < 1000 || value > 100000000) {
      setNotice("Anggaran harus Rp1.000 sampai Rp100.000.000.");
      return;
    }
    setMonthlyBudget(value);
    try { window.localStorage.setItem("firzzpay-demo-monthly-budget", String(value)); } catch {}
    setNotice("Anggaran demo bulanan berhasil disimpan di perangkat ini.");
  }


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

  function exportHistoryCsv() {
    if (!filteredTransactions.length) {
      setNotice("Tidak ada catatan untuk diekspor.");
      return;
    }
    const columns = ["Tanggal", "Keterangan", "Jenis", "Nominal", "Status", "ID Catatan"];
    const safeCell = (value) => {
      const text = String(value ?? "");
      const protectedText = /^[=+@\\-]/.test(text) ? "'" + text : text;
      return '"' + protectedText.replace(/"/g, '""') + '"';
    };
    const rows = filteredTransactions.map((tx) => [
      dateLabel(tx.created_at),
      tx.title,
      tx.type === "in" ? "Uang masuk (simulasi)" : "Uang keluar (simulasi)",
      tx.amount,
      tx.status,
      tx.id
    ]);
    const csv = "\\uFEFF" + [columns, ...rows].map((row) => row.map(safeCell).join(",")).join("\\r\\n");
    const file = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = "firzzpay-riwayat-demo.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("File CSV riwayat demo berhasil disiapkan.");
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
      p_description: type === "in" ? (description.trim() || "Top Up Demo") : `[${selectedCategory}] ${description.trim() || "Transfer Demo"}`
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

        <section className="section budget-card">
          <div className="section-heading"><div><p className="eyebrow">KONTROL PENGELUARAN</p><h2>Anggaran demo bulanan</h2></div></div>
          <div className="budget-amounts"><b>{money(currentMonthExpenses)}</b><span>dari {money(monthlyBudget)}</span></div>
          <div className="budget-track"><span style={{width: `${budgetPercent}%`}} /></div>
          <p className="muted">{budgetPercent}% terpakai bulan ini · berdasarkan catatan uang keluar</p>
          <form className="budget-form" onSubmit={saveMonthlyBudget}>
            <label htmlFor="monthly-demo-budget">Atur batas anggaran (Rp)</label>
            <div><input id="monthly-demo-budget" type="number" min="1000" max="100000000" step="1000" value={budgetDraft} onChange={e => setBudgetDraft(e.target.value)}/><button type="submit">Simpan</button></div>
          </form>
          <p className="muted budget-note">Pengaturan anggaran tersimpan di perangkat ini saja. Ini bukan rekening atau uang sungguhan.</p>
        </section>

        <section className="section stats-card">
          <div className="section-heading">
            <div><p className="eyebrow">ANALISIS DEMO</p><h2>Statistik 30 catatan terakhir</h2></div>
          </div>
          <div className="stats-totals">
            <div><span className="stats-dot incoming-dot"/> <span>Uang masuk</span><b>{money(totalIncoming)}</b></div>
            <div><span className="stats-dot outgoing-dot"/> <span>Uang keluar</span><b>{money(totalOutgoing)}</b></div>
          </div>
          <div className="stats-chart" aria-label="Grafik transaksi simulasi tujuh hari terakhir">
            {weeklyStats.map((day) => (
              <div className="stats-day" key={day.label}>
                <div className="stats-bars">
                  <span className="stats-bar incoming-bar" style={{ height: `${Math.max(day.incoming ? 5 : 0, day.incoming / weeklyMax * 100)}%` }} title={`Masuk ${money(day.incoming)}`} />
                  <span className="stats-bar outgoing-bar" style={{ height: `${Math.max(day.outgoing ? 5 : 0, day.outgoing / weeklyMax * 100)}%` }} title={`Keluar ${money(day.outgoing)}`} />
                </div>
                <span>{day.label}</span>
              </div>
            ))}
          </div>
          <p className="muted stats-caption">Grafik berdasarkan transaksi simulasi yang termuat di 30 catatan terakhir.</p>
        </section>

        <section className="section">
          <div className="section-heading">
            <div><p className="eyebrow">RINGKASAN</p><h2>Aktivitas terbaru</h2></div>
            <button className="link-button" onClick={() => setTab("Aktivitas")}>Lihat semua <ChevronRight size={15} /></button>
          </div>
          {loading ? <p className="muted">Memuat riwayat...</p> : <TransactionList items={transactions.slice(0, 4)} onSelect={setSelectedTransaction} />}
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
          <div className="history-heading-actions">
            <button className="link-button" onClick={exportHistoryCsv} disabled={!filteredTransactions.length}><Download size={14}/> Ekspor CSV</button>
            <button className="link-button" onClick={loadWallet}><RefreshCw size={14}/> Muat ulang</button>
          </div>
        </div>
        <p className="muted">Riwayat tersimpan untuk akun yang sedang login.</p>
        <div className="history-filters">
          <input className="history-search" type="search" value={historySearch} onChange={e => setHistorySearch(e.target.value)} placeholder="Cari nama atau nomor catatan..." aria-label="Cari transaksi" />
          <div className="history-filter-row">
            <label>Jenis<select value={historyType} onChange={e => setHistoryType(e.target.value)}><option value="all">Semua</option><option value="in">Uang masuk</option><option value="out">Uang keluar</option></select></label>
            <label>Waktu<select value={historyDate} onChange={e => setHistoryDate(e.target.value)}><option value="all">Semua waktu</option><option value="today">Hari ini</option><option value="week">7 hari terakhir</option><option value="month">Bulan ini</option></select></label>
          </div>
          <p className="muted filter-count">{filteredTransactions.length} dari {transactions.length} catatan</p>
        </div>
        {loading ? <p className="muted">Memuat riwayat...</p> : <TransactionList items={filteredTransactions} onSelect={setSelectedTransaction} />}
        {!loading && transactions.length === 0 && <p className="muted empty-state">Belum ada transaksi.</p>}
        {!loading && transactions.length > 0 && filteredTransactions.length === 0 && <p className="muted empty-state">Tidak ada transaksi yang cocok. Coba ubah kata kunci atau filter.</p>}
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

      {selectedTransaction && <div className="modal-backdrop" onClick={() => setSelectedTransaction(null)}>
        <div className="modal transaction-detail-modal" onClick={(e) => e.stopPropagation()}>
          <button className="close-button" aria-label="Tutup detail" onClick={() => setSelectedTransaction(null)}><X size={19}/></button>
          <span className={selectedTransaction.type === "in" ? "tx-icon incoming detail-tx-icon" : "tx-icon outgoing detail-tx-icon"}>{selectedTransaction.type === "in" ? <ArrowDownLeft size={22}/> : <ArrowUpRight size={22}/>}</span>
          <p className="eyebrow">DETAIL TRANSAKSI</p>
          <h2>{transactionTitle(selectedTransaction.title)}</h2>
          <div className={selectedTransaction.type === "in" ? "detail-amount positive" : "detail-amount"}>{selectedTransaction.type === "in" ? "+" : "-"}{money(selectedTransaction.amount)}</div>
          <div className="detail-rows">
            <div><span>Jenis transaksi</span><b>{selectedTransaction.type === "in" ? "Uang masuk (simulasi)" : "Uang keluar (simulasi)"}</b></div>
            <div><span>Tanggal</span><b>{dateLabel(selectedTransaction.created_at)}</b></div>
            <div><span>Status</span><b className="detail-status">{selectedTransaction.status}</b></div>
            <div><span>Nomor catatan</span><b className="detail-id">{String(selectedTransaction.id).slice(0, 8).toUpperCase()}</b></div>
          </div>
          <div className="demo-warning">Catatan ini hanya transaksi simulasi dan bukan bukti pembayaran.</div>
          <button className="primary-button" onClick={() => setSelectedTransaction(null)}>Tutup detail</button>
        </div>
      </div>}

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
            {modal === "Transfer" && <><label>Kategori pengeluaran</label><select className="demo-category-select" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}><option>Makanan</option><option>Transportasi</option><option>Belanja</option><option>Tagihan</option><option>Hiburan</option><option>Pendidikan</option><option>Kesehatan</option><option>Lainnya</option></select></>}
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

function TransactionList({ items, onSelect }) {
  if (!items.length) return null;
  return <div className="transaction-list">
    {items.map((tx) => (
      <button className="transaction transaction-button" key={tx.id} onClick={() => onSelect?.(tx)} aria-label={`Lihat detail ${tx.title}`}>
        <span className={tx.type === "in" ? "tx-icon incoming" : "tx-icon outgoing"}>
          {tx.type === "in" ? <ArrowDownLeft size={19}/> : <ArrowUpRight size={19}/>}
        </span>
        <div className="tx-info"><b>{transactionTitle(tx.title)}</b><span>{transactionCategory(tx.title) ? `${transactionCategory(tx.title)} · ` : ""}{dateLabel(tx.created_at)} · {tx.status}</span></div>
        <strong className={tx.type === "in" ? "positive" : ""}>{tx.type === "in" ? "+" : "-"}{money(tx.amount)}</strong>
      </button>
    ))}
  </div>;
}
