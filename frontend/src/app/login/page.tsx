'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import {
  ArrowRight, BarChart3, CheckCircle2, Database, Eye, EyeOff,
  KeyRound, Loader2, LockKeyhole, ShieldCheck, User, UsersRound,
} from 'lucide-react';
import { toast } from 'sonner';

import api from '@/lib/api';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const capabilities = [
  { icon: Database, title: 'Data terintegrasi', description: 'Satu sumber data koperasi dan pelaku usaha.' },
  { icon: BarChart3, title: 'Insight ekonomi', description: 'Statistik yang mendukung keputusan berbasis data.' },
  { icon: UsersRound, title: 'Layanan tepat sasaran', description: 'Pemantauan program dan penerima manfaat.' },
];

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Masukkan username dan kata sandi Anda.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.post('/auth/login', { username: username.trim(), password });
      const { user, accessToken, refreshToken } = response.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`Selamat datang kembali, ${user.nama}!`);
      router.push('/dashboard');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Login gagal. Periksa kembali username dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f8fb] text-slate-950">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_12%_10%,rgba(13,148,136,0.12),transparent_34%),radial-gradient(circle_at_88%_90%,rgba(30,64,175,0.1),transparent_32%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.035] [background-image:linear-gradient(rgba(15,23,42,0.9)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.9)_1px,transparent_1px)] [background-size:32px_32px]" />

      <div className="relative mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden bg-[#071b35] px-12 py-10 text-white lg:flex lg:flex-col xl:px-20 xl:py-14">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(20,184,166,0.24),transparent_32%),radial-gradient(circle_at_88%_82%,rgba(37,99,235,0.3),transparent_34%)]" />
          <div className="absolute -right-32 top-20 h-96 w-96 rounded-full border border-white/10" />
          <div className="absolute -right-20 top-32 h-72 w-72 rounded-full border border-white/10" />
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-300/60 to-transparent" />

          <div className="relative z-10 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-white p-2.5 shadow-2xl shadow-cyan-950/30">
              <Image src="/logo_only.png" alt="Logo APLI DAKOP" width={64} height={64} className="h-full w-full object-contain" priority />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">Pemerintah Kabupaten Konawe Selatan</p>
              <p className="mt-1 text-sm text-slate-300">Dinas Koperasi dan UMKM</p>
            </div>
          </div>

          <div className="relative z-10 my-auto max-w-2xl py-16">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3.5 py-2 text-xs font-medium text-cyan-100">
              <ShieldCheck className="h-4 w-4 text-cyan-300" />
              Platform data ekonomi daerah terintegrasi
            </div>
            <h1 className="max-w-xl text-4xl font-semibold leading-[1.15] tracking-tight xl:text-5xl">
              Data yang tertata untuk ekonomi daerah yang lebih kuat.
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300">
              APLI DAKOP membantu pemerintah mengelola data koperasi, pelaku usaha, pembiayaan, dan program bantuan dalam satu layanan digital.
            </p>

            <div className="mt-10 grid gap-4 xl:grid-cols-3">
              {capabilities.map(({ icon: Icon, title, description }) => (
                <div key={title} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4 backdrop-blur-sm">
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-300/10 text-cyan-300">
                    <Icon className="h-[18px] w-[18px]" />
                  </div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="mt-1.5 text-xs leading-5 text-slate-400">{description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative z-10 flex items-center justify-between border-t border-white/10 pt-6 text-xs text-slate-400">
            <span>© {new Date().getFullYear()} Pemerintah Kabupaten Konawe Selatan</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Sistem layanan resmi</span>
          </div>
        </section>

        <section className="flex min-h-screen items-center justify-center px-5 py-8 sm:px-10 lg:px-14 xl:px-24">
          <div className="w-full max-w-[460px]">
            <div className="mb-8 lg:hidden">
              <Image src="/logo_with_text.png" alt="APLI DAKOP — Aplikasi Data Koperasi dan UMKM" width={427} height={115} className="h-auto w-full max-w-[320px] object-contain object-left" priority />
            </div>

            <div className="rounded-[28px] border border-slate-200/80 bg-white p-6 shadow-[0_24px_80px_-28px_rgba(15,23,42,0.28)] sm:p-9">
              <div className="hidden lg:block">
                <Image src="/logo_with_text.png" alt="APLI DAKOP — Aplikasi Data Koperasi dan UMUM" width={427} height={115} className="h-auto w-full max-w-[330px] object-contain object-left" priority />
              </div>

              <div className="mt-7">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Portal Internal</p>
                <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">Selamat datang kembali</h2>
                <p className="mt-2 text-sm leading-6 text-slate-500">Masukkan akun terdaftar untuk mengakses dashboard APLI DAKOP.</p>
              </div>

              <form onSubmit={handleLogin} className="mt-8 space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-sm font-semibold text-slate-700">Username</Label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input id="username" type="text" autoComplete="username" placeholder="Masukkan username" value={username} onChange={(event) => setUsername(event.target.value)} className="h-12 rounded-xl border-slate-200 bg-slate-50/70 pl-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/15" disabled={loading} required autoFocus />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-semibold text-slate-700">Kata sandi</Label>
                  <div className="relative">
                    <KeyRound className="pointer-events-none absolute left-3.5 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-slate-400" />
                    <Input id="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Masukkan kata sandi" value={password} onChange={(event) => setPassword(event.target.value)} className="h-12 rounded-xl border-slate-200 bg-slate-50/70 px-11 text-slate-950 placeholder:text-slate-400 focus-visible:border-teal-600 focus-visible:ring-teal-600/15" disabled={loading} required />
                    <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600" aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}>
                      {showPassword ? <EyeOff className="h-[18px] w-[18px]" /> : <Eye className="h-[18px] w-[18px]" />}
                    </button>
                  </div>
                </div>

                <Button type="submit" disabled={loading} className="h-12 w-full rounded-xl bg-gradient-to-r from-teal-700 to-blue-800 text-sm font-semibold text-white shadow-lg shadow-teal-900/15 transition-all hover:-translate-y-0.5 hover:from-teal-600 hover:to-blue-700 hover:shadow-xl disabled:translate-y-0">
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Memverifikasi akun...</> : <>Masuk ke dashboard<ArrowRight className="ml-2 h-4 w-4" /></>}
                </Button>
              </form>

              <div className="mt-7 flex items-start gap-3 rounded-xl border border-slate-200/80 bg-slate-50 px-4 py-3.5">
                <LockKeyhole className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
                <p className="text-xs leading-5 text-slate-500">Akses terbatas untuk pengguna berwenang. Aktivitas masuk dilindungi dan dikelola sesuai hak akses pengguna.</p>
              </div>
            </div>

            <p className="mt-6 text-center text-xs leading-5 text-slate-400">
              Mengalami kendala akses? Hubungi administrator sistem Dinas Koperasi dan UMKM.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}
