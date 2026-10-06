import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';

export function DeleteConfirmationDialog({
    open,
    onOpenChange,
    itemName,
    onConfirm,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    itemName: string | null;
    onConfirm: () => void;
}) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Hapus data?</DialogTitle>
                    <DialogDescription>
                        {itemName
                            ? `Data “${itemName}” akan dihapus dan tindakan ini tidak dapat dibatalkan.`
                            : 'Tindakan ini tidak dapat dibatalkan.'}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Hapus
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
