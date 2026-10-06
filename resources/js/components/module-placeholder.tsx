import type { LucideIcon } from 'lucide-react';
import { LayoutGrid } from 'lucide-react';
import Heading from '@/components/heading';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

type Props = {
    title: string;
    description: string;
    plannedItems: string[];
    icon?: LucideIcon;
};

export function ModulePlaceholder({
    title,
    description,
    plannedItems,
    icon: Icon = LayoutGrid,
}: Props) {
    return (
        <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
            <Heading title={title} description={description} />

            <Card className="max-w-3xl">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-400">
                            <Icon className="size-5" />
                        </span>
                        <div className="grid gap-1">
                            <p className="font-semibold">
                                Modul dalam pengembangan
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Menu ini sudah terpasang dan akan diisi pada
                                tahap pengembangan berikutnya.
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <p className="mb-3 text-xs font-medium tracking-wide text-muted-foreground uppercase">
                        Rencana isi menu
                    </p>
                    <ul className="grid gap-2 text-sm sm:grid-cols-2">
                        {plannedItems.map((item) => (
                            <li key={item} className="flex items-start gap-2">
                                <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-500" />
                                {item}
                            </li>
                        ))}
                    </ul>
                </CardContent>
            </Card>
        </div>
    );
}
