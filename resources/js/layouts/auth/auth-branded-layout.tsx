import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, GraduationCap, ShieldCheck } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthBrandedLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="relative isolate grid min-h-svh overflow-hidden bg-slate-50 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_76%_18%,rgba(139,92,246,0.16),transparent_24%),radial-gradient(circle_at_14%_90%,rgba(59,130,246,0.12),transparent_30%)]" />
            <div className="absolute inset-0 -z-10 opacity-30 [background-image:linear-gradient(rgba(99,102,241,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.16)_1px,transparent_1px)] [background-size:42px_42px]" />

            <aside className="relative hidden overflow-hidden bg-slate-900 p-10 text-white lg:flex lg:flex-col lg:justify-between">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_90%_12%,rgba(139,92,246,0.55),transparent_25%),radial-gradient(circle_at_18%_95%,rgba(37,99,235,0.4),transparent_30%)]" />
                <div className="absolute inset-0 opacity-20 [background-image:linear-gradient(rgba(196,181,253,0.4)_1px,transparent_1px),linear-gradient(90deg,rgba(196,181,253,0.4)_1px,transparent_1px)] [background-size:42px_42px]" />

                <Link href={home()} className="relative z-10 flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-violet-500 text-white shadow-lg shadow-violet-950/30">
                        <AppLogoIcon className="size-6 fill-current" />
                    </span>
                    <span className="grid leading-tight">
                        <span className="text-base font-semibold">{name}</span>
                        <span className="text-[10px] font-semibold tracking-[0.18em] text-violet-200 uppercase">
                            Computer Based Test
                        </span>
                    </span>
                </Link>

                <div className="relative z-10 max-w-md">
                    <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-300/25 bg-emerald-300/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-200">
                        <span className="size-1.5 rounded-full bg-emerald-300 shadow-[0_0_10px_3px_rgba(110,231,183,0.25)]" />
                        SISTEM CBT TERSEDIA
                    </div>
                    <h2 className="text-4xl leading-[1.1] font-bold tracking-tight text-balance">
                        Siap untuk langkah belajar berikutnya.
                    </h2>
                    <p className="mt-4 max-w-sm text-sm leading-6 text-slate-300">
                        Masuk ke ruang ujian digital SD Anak Saleh dengan aman dan nyaman.
                    </p>

                    <div className="mt-10 rounded-2xl border border-white/10 bg-white/[0.06] p-5 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                            <span className="grid size-10 place-items-center rounded-xl bg-violet-400/15 text-violet-200">
                                <ShieldCheck className="size-5" />
                            </span>
                            <div>
                                <p className="text-sm font-semibold">Akses terlindungi</p>
                                <p className="mt-0.5 text-xs text-slate-300">Gunakan akun yang diberikan sekolah.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <p className="relative z-10 text-xs text-slate-400">© {new Date().getFullYear()} {name}</p>
            </aside>

            <main className="flex min-h-svh items-center justify-center px-6 py-10 sm:px-10 lg:px-16">
                <div className="w-full max-w-sm">
                    <Link
                        href={home()}
                        className="mb-10 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-violet-700"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke beranda
                    </Link>

                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <span className="grid size-10 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
                            <GraduationCap className="size-5" />
                        </span>
                        <span className="grid leading-tight">
                            <span className="text-sm font-semibold text-slate-950">{name}</span>
                            <span className="text-[10px] font-semibold tracking-[0.16em] text-violet-600 uppercase">Computer Based Test</span>
                        </span>
                    </div>

                    <div className="mb-8 grid gap-2">
                        <h1 className="text-3xl font-bold tracking-tight text-slate-950">{title}</h1>
                        {description && <p className="text-sm leading-6 text-slate-500">{description}</p>}
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-900/[0.06] sm:p-8">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}
