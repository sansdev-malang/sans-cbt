import React from 'react';
import { cn } from '@/lib/utils';

interface UnitBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    unit?: 'sd' | 'smp' | string | null;
    size?: 'sm' | 'md';
}

export function UnitBadge({ unit, size = 'sm', className, ...props }: UnitBadgeProps) {
    const normalized = (unit || 'sd').toLowerCase();
    const isSmp = normalized === 'smp';

    return (
        <span
            className={cn(
                'inline-flex items-center font-semibold rounded-md border tracking-wider uppercase',
                size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs',
                isSmp
                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
                className
            )}
            {...props}
        >
            <span
                className={cn(
                    'size-1.5 rounded-full mr-1.5',
                    isSmp ? 'bg-indigo-500' : 'bg-emerald-500'
                )}
            />
            {isSmp ? 'SMP' : 'SD'}
        </span>
    );
}
