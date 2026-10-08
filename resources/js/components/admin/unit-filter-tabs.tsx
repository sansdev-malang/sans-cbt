import React from 'react';
import { cn } from '@/lib/utils';
import { School, Building2, Layers } from 'lucide-react';

interface UnitFilterTabsProps {
    activeUnit: string;
    counts?: {
        all?: number;
        sd?: number;
        smp?: number;
    };
    onChange: (unit: 'all' | 'sd' | 'smp') => void;
    className?: string;
}

export function UnitFilterTabs({
    activeUnit,
    counts,
    onChange,
    className,
}: UnitFilterTabsProps) {
    const tabs: Array<{
        id: 'all' | 'sd' | 'smp';
        label: string;
        icon: React.ElementType;
        count?: number;
        activeClass: string;
    }> = [
        {
            id: 'all',
            label: 'Semua Unit',
            icon: Layers,
            count: counts?.all,
            activeClass: 'bg-background text-foreground shadow-sm font-medium',
        },
        {
            id: 'sd',
            label: 'Unit SD',
            icon: School,
            count: counts?.sd,
            activeClass: 'bg-emerald-600 text-white shadow-sm font-medium dark:bg-emerald-600',
        },
        {
            id: 'smp',
            label: 'Unit SMP',
            icon: Building2,
            count: counts?.smp,
            activeClass: 'bg-indigo-600 text-white shadow-sm font-medium dark:bg-indigo-600',
        },
    ];

    return (
        <div
            className={cn(
                'inline-flex items-center gap-1 rounded-lg bg-muted/80 p-1 text-muted-foreground',
                className
            )}
        >
            {tabs.map((tab) => {
                const isActive = activeUnit === tab.id;
                const Icon = tab.icon;

                return (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => onChange(tab.id)}
                        className={cn(
                            'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs transition-all hover:text-foreground cursor-pointer',
                            isActive
                                ? tab.activeClass
                                : 'hover:bg-background/50'
                        )}
                    >
                        <Icon className="size-3.5 shrink-0" />
                        <span>{tab.label}</span>
                        {typeof tab.count === 'number' && (
                            <span
                                className={cn(
                                    'ml-1 rounded-full px-1.5 py-0.2 text-[10px] tabular-nums',
                                    isActive
                                        ? tab.id === 'all'
                                            ? 'bg-muted text-foreground'
                                            : 'bg-white/20 text-white'
                                        : 'bg-muted-foreground/15 text-muted-foreground'
                                )}
                            >
                                {tab.count.toLocaleString()}
                            </span>
                        )}
                    </button>
                );
            })}
        </div>
    );
}
