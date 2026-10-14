import { Link, usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import { home } from '@/routes';
import type { AuthLayoutProps } from '@/types';

export default function AuthCenteredLayout({
    children,
    title,
    description,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <main className="relative isolate flex min-h-svh items-center justify-center overflow-hidden bg-slate-50 px-4 py-10 dark:bg-slate-950 sm:px-6">
            <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.12),transparent_42%),radial-gradient(ellipse_at_15%_90%,rgba(59,130,246,0.08),transparent_35%)] dark:bg-[radial-gradient(ellipse_at_50%_40%,rgba(139,92,246,0.2),transparent_42%),radial-gradient(ellipse_at_15%_90%,rgba(59,130,246,0.12),transparent_35%)]"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[min(90vw,760px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-300/25 dark:border-violet-300/10"
            />
            <div
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -z-0 size-[min(72vw,600px)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-blue-300/20 dark:border-blue-300/10"
            />

            <section className="relative z-10 w-full max-w-[420px] rounded-3xl border border-slate-200/90 bg-white/95 p-6 shadow-2xl shadow-slate-900/[0.08] backdrop-blur sm:p-9 dark:border-slate-800 dark:bg-slate-900/95 dark:shadow-black/40">
                <Link
                    href={home()}
                    className="mb-8 flex items-center justify-center gap-3"
                >
                    <span className="grid size-11 place-items-center rounded-2xl bg-violet-600 text-white shadow-lg shadow-violet-600/20">
                        <AppLogoIcon className="size-6 fill-current" />
                    </span>
                    <span className="grid text-left leading-tight">
                        <span className="text-sm font-semibold text-slate-950 dark:text-slate-100">
                            {name}
                        </span>
                        <span className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-violet-700 uppercase dark:text-violet-300">
                            Computer Based Test
                        </span>
                    </span>
                </Link>

                <header className="mb-7 text-center">
                    <h1 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-100">
                        {title}
                    </h1>
                    {description && (
                        <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">
                            {description}
                        </p>
                    )}
                </header>

                {children}

                <p className="mt-7 text-center text-xs text-slate-400 dark:text-slate-500">
                    Copyright {new Date().getFullYear()} {name}
                </p>
            </section>
        </main>
    );
}
