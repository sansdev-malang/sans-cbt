import { Button } from '@/components/ui/button';

export type AdminPaginator<T> = {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
};

export function AdminPagination<T>(props: {
    paginator: AdminPaginator<T>;
    itemLabel: string;
    onPageChange: (page: number) => void;
}) {
    const { paginator, itemLabel, onPageChange } = props;
    const hasData =
        paginator.total > 0 && paginator.from !== null && paginator.to !== null;

    return (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-xs text-muted-foreground">
                {hasData
                    ? `Menampilkan ${paginator.from}-${paginator.to} dari ${paginator.total} ${itemLabel}`
                    : 'Tidak ada data'}
            </p>
            <div className="flex items-center gap-2">
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page <= 1}
                    onClick={() => onPageChange(paginator.current_page - 1)}
                >
                    Sebelumnya
                </Button>
                <span className="text-xs text-muted-foreground">
                    Halaman {paginator.current_page} dari {paginator.last_page}
                </span>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={paginator.current_page >= paginator.last_page}
                    onClick={() => onPageChange(paginator.current_page + 1)}
                >
                    Berikutnya
                </Button>
            </div>
        </div>
    );
}
