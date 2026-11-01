"use client";

import { useEffect, useState } from "react";
import { getSupabase } from "../lib/supabase";
import Wallet from "./Wallet";
import { Wallet as WalletIcon, Eye, EyeOff, ShieldCheck } from "lucide-react";

export default function AuthGate() {
  const [supabase, setSupabase] = useState(null);
  const [session, setSession] = useState(null);
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let subscription;
    try {
      const client = getSupabase();
      setSupabase(client);
      client.auth.getSession().then(({ data }) => setSession(data.session));
      const result = client.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
      subscription = result.data.subscription;
    } catch (e) { setError(e.message); }
    return () => subscription?.unsubscribe();
  }, []);

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(""); setMessage("");
    try {
      if (!supabase) throw new Error("Supabase belum siap. Periksa Environment Variables Vercel.");
      if (mode === "signup") {
        const { data, error: authError } = await supabase.auth.signUp({ email: email.trim(), password });
        if (authError) throw authError;
        if (data.session) setMessage("Pendaftaran berhasil. Akun kamu sudah masuk.");
        else setMessage("Pendaftaran berhasil. Periksa email untuk konfirmasi akun sebelum login.");
      } else {
        const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
        if (authError) throw authError;
      }
    } catch (e) { setError(e.message || "Terjadi kesalahan. Coba lagi."); }
    finally { setBusy(false); }
  }

  async function signOut() { await supabase?.auth.signOut(); setMessage("Kamu sudah keluar."); }

  if (session) return <><div className="signed-in-bar"><span>{session.user.email}</span><button onClick={signOut}>Keluar</button></div><Wallet /></>;

  return <main className="auth-page">
    <section className="auth-card">
      <div className="auth-brand"><span className="auth-logo"><WalletIcon size={24}/></span><span>FIRZZ<span>PAY</span></span></div>
      <p className="eyebrow">DOMPET DIGITAL DEMO</p>
      <h1>{mode === "login" ? "Selamat datang kembali" : "Buat akun FirzzPay"}</h1>
      <p className="muted auth-subtitle">Masuk untuk melanjutkan ke dashboard FirzzPay.</p>
      <form onSubmit={submit} className="auth-form">
        <label>Email</label>
        <input type="email" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="nama@email.com"/>
        <label>Password</label>
        <div className="password-wrap"><input type={showPassword ? "text" : "password"} autoComplete={mode === "login" ? "current-password" : "new-password"} minLength={6} required value={password} onChange={e => setPassword(e.target.value)} placeholder="Minimal 6 karakter"/><button type="button" onClick={() => setShowPassword(!showPassword)} aria-label="Tampilkan password">{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
        <button className="auth-submit" disabled={busy}>{busy ? "Memproses..." : mode === "login" ? "Masuk" : "Daftar akun"}</button>
      </form>
      {error && <p className="auth-error">{error}</p>}
      {message && <p className="auth-message">{message}</p>}
      <p className="auth-switch">{mode === "login" ? "Belum punya akun?" : "Sudah punya akun?"} <button onClick={() => {setMode(mode === "login" ? "signup" : "login");setError("");setMessage("");}}>{mode === "login" ? "Daftar" : "Masuk"}</button></p>
      <div className="auth-safe"><ShieldCheck size={15}/> Demo aman · Belum ada transaksi uang sungguhan</div>
    </section>
  </main>;
}
