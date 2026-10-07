import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, GraduationCap, ShieldCheck } from 'lucide-react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const destination = auth.user ? dashboard() : login();
    const actionLabel = auth.user ? 'Buka dashboard' : 'Masuk ke CBT';

    return (
        <>
            <Head title="CBT SD Anak Saleh" />

            <main className="relative isolate min-h-screen overflow-hidden bg-slate-50 text-slate-950">
                <div className="absolute inset-0 -z-20 bg-[radial-gradient(circle_at_78%_24%,rgba(139,92,246,0.16),transparent_23%),radial-gradient(circle_at_20%_85%,rgba(59,130,246,0.12),transparent_30%),linear-gradient(135deg,#f8fafc_0%,#f5f3ff_48%,#f8fafc_100%)]" />
                <div className="absolute inset-0 -z-10 opacity-[0.32] [background-image:linear-gradient(rgba(99,102,241,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.16)_1px,transparent_1px)] [background-size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent_82%)]" />
                <div className="absolute top-[-14rem] right-[-10rem] -z-10 size-[32rem] rounded-full border border-violet-300/30" />
                <div className="absolute top-[-8rem] right-[-4rem] -z-10 size-[20rem] rounded-full border border-blue-300/30" />

                <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-6 py-6 sm:px-10 lg:px-12">
                    <header className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-xl bg-violet-600 text-white shadow-lg shadow-violet-500/20">
                                <GraduationCap className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight text-slate-950">Anak Saleh</p>
                                <p className="text-[10px] font-semibold tracking-[0.18em] text-violet-600 uppercase">Computer Based Test</p>
                            </div>
                        </div>

                        <span className="hidden rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-xs font-medium text-slate-500 shadow-sm sm:block">Portal Ujian Digital</span>
                    </header>

                    <section className="flex flex-1 items-center py-16 sm:py-20">
                        <div className="grid w-full items-center gap-14 lg:grid-cols-[1.1fr_0.9fr] lg:gap-20">
                            <div className="max-w-2xl">
                                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold tracking-wide text-emerald-700">
                                    <span className="size-1.5 rounded-full bg-emerald-500 shadow-[0_0_10px_3px_rgba(16,185,129,0.2)]" />
                                    RUANG UJIAN TERINTEGRASI
                                </div>

                                <h1 className="max-w-xl pb-4 text-5xl leading-[1.17] font-black tracking-[-0.055em] text-balance sm:text-6xl lg:text-7xl">
                                    Ujian cerdas,
                                    <span className="block bg-gradient-to-r from-violet-600 via-blue-600 to-cyan-600 bg-clip-text text-transparent">langkah pasti.</span>
                                </h1>

                                <p className="mt-6 max-w-lg text-base leading-7 text-slate-600 sm:text-lg">
                                    Sistem CBT SD Anak Saleh untuk pengalaman ujian yang fokus, aman, dan nyaman.
                                </p>

                                <Link
                                    href={destination}
                                    className="mt-9 inline-flex items-center gap-3 rounded-xl bg-slate-900 px-5 py-3.5 text-sm font-bold text-white transition hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-[0_12px_30px_rgba(109,40,217,0.22)] focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-50 focus-visible:outline-none"
                                >
                                    {actionLabel}
                                    <ArrowUpRight className="size-4" />
                                </Link>
                            </div>

                            <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                                <div className="absolute -inset-5 rounded-[2rem] bg-violet-400/20 blur-3xl" />
                                <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white/85 p-5 shadow-2xl shadow-slate-900/10 backdrop-blur-xl sm:p-6">
                                    <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                                        <div className="flex items-center gap-3">
                                            <div className="size-2 rounded-full bg-emerald-500" />
                                            <span className="font-mono text-xs text-slate-500">CBT / READY</span>
                                        </div>
                                        <ShieldCheck className="size-5 text-violet-600" />
                                    </div>
                                    <div className="mt-8 space-y-4">
                                        <div className="h-2 w-24 rounded-full bg-violet-500/70" />
                                        <div className="h-2 w-full rounded-full bg-slate-100" />
                                        <div className="h-2 w-4/5 rounded-full bg-slate-100" />
                                        <div className="mt-7 grid grid-cols-3 gap-3">
                                            {[0, 1, 2].map((item) => (
                                                <div key={item} className="aspect-square rounded-xl border border-slate-100 bg-slate-50" />
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <footer className="text-xs text-slate-400">© {new Date().getFullYear()} SD Anak Saleh</footer>
                </div>
            </main>
        </>
    );
}
