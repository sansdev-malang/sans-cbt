import { Head, Link, usePage } from '@inertiajs/react';
import { ArrowUpRight, GraduationCap } from 'lucide-react';
import { dashboard, login } from '@/routes';

export default function Welcome() {
    const { auth } = usePage().props;
    const destination = auth.user ? dashboard() : login();
    const actionLabel = auth.user ? 'Buka dashboard' : 'Masuk ke CBT';

    return (
        <>
            <Head title="CBT SD Anak Saleh" />

            <main className="landing-mesh relative isolate flex min-h-svh flex-col overflow-hidden text-white">
                <div className="relative z-10 mx-auto flex min-h-svh w-full max-w-7xl flex-1 flex-col px-6 sm:px-10 lg:px-12">
                    <header className="flex items-center justify-between py-6 sm:py-8">
                        <div className="flex items-center gap-3">
                            <div className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white shadow-lg shadow-black/10 backdrop-blur-sm">
                                <GraduationCap className="size-5" />
                            </div>
                            <div>
                                <p className="text-sm font-bold tracking-tight">
                                    Anak Saleh
                                </p>
                                <p className="mt-0.5 text-[10px] font-semibold tracking-[0.18em] text-white/65 uppercase">
                                    Computer Based Test
                                </p>
                            </div>
                        </div>

                        <span className="rounded-full border border-white/15 bg-white/[0.07] px-3 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-white/75 uppercase backdrop-blur-sm sm:text-xs">
                            Portal Ujian Digital
                        </span>
                    </header>

                    <section className="flex flex-1 flex-col items-center justify-center py-16 text-center sm:py-20">
                        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3.5 py-2 text-[10px] font-semibold tracking-[0.16em] text-blue-50 uppercase backdrop-blur-sm sm:text-xs">
                            <span className="size-1.5 rounded-full bg-cyan-200 shadow-[0_0_12px_3px_rgba(103,232,249,0.28)]" />
                            Ruang ujian terintegrasi
                        </div>

                        <h1 className="max-w-5xl pb-2 text-5xl leading-[1.15] font-semibold tracking-[-0.055em] text-balance sm:text-7xl lg:text-[5.5rem]">
                            Ujian cerdas,
                            <span className="mt-2 block bg-linear-to-r from-white via-blue-50 to-cyan-200 bg-clip-text text-transparent">
                                langkah pasti.
                            </span>
                        </h1>

                        <p className="mt-7 max-w-xl text-sm leading-7 text-white/75 sm:text-lg sm:leading-8">
                            Sistem CBT SD Anak Saleh untuk pengalaman ujian yang
                            fokus, aman, dan nyaman.
                        </p>

                        <Link
                            href={destination}
                            className="mt-9 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-white px-6 py-3 text-sm font-bold text-slate-950 shadow-lg shadow-black/15 transition hover:-translate-y-0.5 hover:bg-violet-50 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-4 focus-visible:ring-offset-violet-900"
                        >
                            {actionLabel}
                            <ArrowUpRight className="size-4" />
                        </Link>
                    </section>

                    <footer className="relative z-10 grid gap-4 border-t border-white/15 py-5 text-center text-[10px] font-semibold tracking-[0.15em] text-white/60 uppercase sm:grid-cols-3 sm:py-6 sm:text-xs">
                        <span>Akses siswa dan guru</span>
                        <span>Ujian terjadwal</span>
                        <span>Hasil tersimpan terpusat</span>
                    </footer>
                </div>
            </main>
        </>
    );
}
