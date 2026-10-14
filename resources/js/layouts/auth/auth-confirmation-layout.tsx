import { usePage } from '@inertiajs/react';
import AppLogoIcon from '@/components/app-logo-icon';
import type { AuthLayoutProps } from '@/types';

export default function AuthConfirmationLayout({
    children,
}: AuthLayoutProps) {
    const { name } = usePage().props;

    return (
        <main className="landing-mesh relative isolate flex min-h-svh items-center justify-center overflow-hidden text-white">
            <header className="absolute top-6 left-6 z-10 flex items-center gap-3 sm:top-8 sm:left-10">
                <span className="grid size-10 place-items-center rounded-xl border border-white/15 bg-white/10 text-white backdrop-blur-sm">
                    <AppLogoIcon className="size-6 fill-current" />
                </span>
                <span className="grid leading-tight">
                    <span className="text-sm font-semibold">{name}</span>
                    <span className="mt-1 text-[10px] font-semibold tracking-[0.16em] text-white/65 uppercase">
                        Computer Based Test
                    </span>
                </span>
            </header>
            {children}
        </main>
    );
}
