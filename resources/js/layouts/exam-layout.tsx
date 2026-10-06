import type { ReactNode } from 'react';

/**
 * Layout bersih khusus untuk halaman pengerjaan ujian (student/exams/work).
 * Tidak ada sidebar, tidak ada header navigasi — hanya konten ujian penuh layar.
 * Topbar & navigasi soal dikelola langsung oleh halaman work.tsx.
 */
export default function ExamLayout({ children }: { children: ReactNode }) {
    return (
        <div className="flex min-h-screen w-full flex-col bg-muted/30">
            {children}
        </div>
    );
}
