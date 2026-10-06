import {
    BookOpen,
    ClipboardList,
    GraduationCap,
    LayoutGrid,
    LineChart,
    ScrollText,
    UserCog,
    Users,
} from 'lucide-react';
import { dashboard } from '@/routes';
import { dashboard as adminDashboard } from '@/routes/admin';
import { dashboard as teacherDashboard } from '@/routes/teacher';
import { index as teacherExamsIndex } from '@/routes/teacher/exams';
import { index as teacherQuestionsIndex } from '@/routes/teacher/questions';
import { index as studentExamsIndex } from '@/routes/student/exams';
import { index as studentResultsIndex } from '@/routes/student/results';
import { CalendarCheck } from 'lucide-react';
import { index as auditLogsIndex } from '@/routes/admin/audit-logs';
import { index as classesIndex } from '@/routes/admin/classes';
import { index as examMonitoringIndex } from '@/routes/admin/exam-monitoring';
import { index as reportsIndex } from '@/routes/admin/reports';
import { index as subjectsIndex } from '@/routes/admin/subjects';
import { index as questionsIndex } from '@/routes/admin/questions';
import { index as studentsIndex } from '@/routes/admin/students';
import { index as teachersIndex } from '@/routes/admin/teachers';
import { index as usersIndex } from '@/routes/admin/users';
import type { NavItem, RoleSlug } from '@/types';

export type NavGroup = {
    label: string;
    items: NavItem[];
};

const defaultNavGroups: NavGroup[] = [
    {
        label: 'Platform',
        items: [
            {
                title: 'Dashboard',
                href: dashboard(),
                icon: LayoutGrid,
            },
        ],
    },
];

const adminNavGroups: NavGroup[] = [
    {
        label: 'Menu Utama',
        items: [
            {
                title: 'Dashboard',
                href: adminDashboard(),
                icon: LayoutGrid,
            },
            {
                title: 'Kelola Pengguna',
                href: usersIndex(),
                icon: UserCog,
            },
            {
                title: 'Siswa',
                href: studentsIndex(),
                icon: Users,
            },
            {
                title: 'Guru',
                href: teachersIndex(),
                icon: Users,
            },
        ],
    },
    {
        label: 'Akademik',
        items: [
            {
                title: 'Mata Pelajaran',
                href: subjectsIndex(),
                icon: BookOpen,
            },
            {
                title: 'Bank Soal',
                href: questionsIndex(),
                icon: ClipboardList,
            },
            {
                title: 'Kelas',
                href: classesIndex(),
                icon: GraduationCap,
            },
            {
                title: 'Monitoring Ujian',
                href: examMonitoringIndex(),
                icon: ClipboardList,
            },
        ],
    },
    {
        label: 'Laporan',
        items: [
            {
                title: 'Hasil & Laporan',
                href: reportsIndex(),
                icon: LineChart,
            },
            {
                title: 'Audit Log',
                href: auditLogsIndex(),
                icon: ScrollText,
            },
        ],
    },
];

const guruNavGroups: NavGroup[] = [
    {
        label: 'Menu Utama',
        items: [
            {
                title: 'Dashboard',
                href: teacherDashboard(),
                icon: LayoutGrid,
            },
        ],
    },
    {
        label: 'Mengajar',
        items: [
            {
                title: 'Bank Soal',
                href: teacherQuestionsIndex(),
                icon: ClipboardList,
            },
            {
                title: 'Ujian',
                href: teacherExamsIndex(),
                icon: BookOpen,
            },
        ],
    },
];

const siswaNavGroups: NavGroup[] = [
    {
        label: 'Menu Siswa',
        items: [
            {
                title: 'Ujian Saya',
                href: studentExamsIndex(),
                icon: CalendarCheck,
            },
            {
                title: 'Riwayat Nilai',
                href: studentResultsIndex(),
                icon: LineChart,
            },
        ],
    },
];

export function navGroupsFor(role: RoleSlug | null | undefined): NavGroup[] {
    if (role === 'admin') {
        return adminNavGroups;
    }

    if (role === 'guru') {
        return guruNavGroups;
    }

    if (role === 'siswa') {
        return siswaNavGroups;
    }

    return defaultNavGroups;
}

/**
 * Get the landing page for the given role.
 */
export function homeFor(role: RoleSlug | null | undefined): NavItem['href'] {
    if (role === 'admin') {
        return adminDashboard();
    }

    if (role === 'guru') {
        return teacherDashboard();
    }

    if (role === 'siswa') {
        return studentExamsIndex();
    }

    return dashboard();
}
