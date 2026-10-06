import { Link, usePage } from '@inertiajs/react';
import { ArrowLeft, CheckCircle2, ShieldCheck, Timer } from 'lucide-react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

const highlights = [
    { icon: Timer, label: 'Timer ujian berbasis waktu server' },
    { icon: ShieldCheck, label: 'Deteksi aktivitas mencurigakan' },
    { icon: CheckCircle2, label: 'Nilai otomatis setelah submit' },
];

export default function AuthBrandedLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            <div className="relative hidden flex-col justify-between overflow-hidden bg-brand-700 p-10 text-white lg:flex">
                <div className="absolute -top-24 -right-16 size-72 rounded-full bg-brand-500/40 blur-3xl" />
                <div className="absolute -bottom-24 -left-16 size-72 rounded-full bg-brand-400/30 blur-3xl" />

                <Link
                    href={home()}
                    className="relative z-10 flex items-center gap-3"
                >
                    <span className="flex size-10 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/25">
                        <AppLogoIcon className="size-6 fill-current text-white" />
                    </span>
                    <span className="grid leading-tight">
                        <span className="text-base font-semibold">{name}</span>
                        <span className="text-xs text-white/70">
                            Computer Based Test
                        </span>
                    </span>
                </Link>

                <div className="relative z-10 max-w-md">
                    <h2 className="text-3xl font-semibold tracking-tight text-balance">
                        Ujian sekolah yang aman, tenang, dan terpercaya.
                    </h2>
                    <p className="mt-3 text-sm text-white/80">
                        Satu sistem untuk siswa mengerjakan ujian, guru
                        mengelola bank soal, dan orang tua memantau nilai anak.
                    </p>
                    <ul className="mt-8 grid gap-3 text-sm">
                        {highlights.map((item) => (
                            <li
                                key={item.label}
                                className="flex items-center gap-3"
                            >
                                <span className="flex size-8 items-center justify-center rounded-lg bg-white/10 ring-1 ring-white/20">
                                    <item.icon className="size-4" />
                                </span>
                                {item.label}
                            </li>
                        ))}
                    </ul>
                </div>

                <p className="relative z-10 text-xs text-white/60">
                    © {new Date().getFullYear()} {name}
                </p>
            </div>

            <div className="flex flex-col justify-center bg-background px-6 py-10 sm:px-10 lg:px-16">
                <div className="mx-auto w-full max-w-sm">
                    <Link
                        href={home()}
                        className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                        <ArrowLeft className="size-4" />
                        Kembali ke beranda
                    </Link>

                    <div className="mb-8 flex items-center gap-3 lg:hidden">
                        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-600 text-white">
                            <AppLogoIcon className="size-6 fill-current" />
                        </span>
                        <span className="text-sm font-semibold">{name}</span>
                    </div>

                    <div className="mb-8 grid gap-2">
                        <h1 className="text-2xl font-semibold tracking-tight">
                            {title}
                        </h1>
                        {description && (
                            <p className="text-sm text-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {children}
                </div>
            </div>
        </div>
    );
}
