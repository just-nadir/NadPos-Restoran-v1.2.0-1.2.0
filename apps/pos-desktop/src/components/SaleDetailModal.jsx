import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from './ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from './ui/table';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import { formatCurrency } from '../utils/currencyUtils';

const SaleDetailModal = ({ isOpen, onClose, sale, checkNumber }) => {
    if (!sale) return null;

    let items = [];
    try {
        if (Array.isArray(sale.items)) {
            items = sale.items;
        } else if (typeof sale.items === 'string') {
            items = JSON.parse(sale.items);
            if (!Array.isArray(items)) items = [];
        }
    } catch (e) {
        console.error("Error parsing sale items:", e);
        items = [];
    }
    const total = sale.amount || 0; // Or calculate from items

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl bg-background border-border text-foreground">
                <DialogHeader>
                    <DialogTitle>Xarid Tafsilotlari #{checkNumber || '---'}</DialogTitle>
                    <div className="text-sm text-muted-foreground">
                        {sale.date && formatDateTime(sale.date)}
                    </div>
                </DialogHeader>

                <div className="mt-4">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-muted/50 border-border">
                                <TableHead className="text-muted-foreground w-[50%]">Mahsulot</TableHead>
                                <TableHead className="text-right text-muted-foreground">Narx</TableHead>
                                <TableHead className="text-center text-muted-foreground">Soni</TableHead>
                                <TableHead className="text-right text-muted-foreground">Jami</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {items.map((item, index) => (
                                <TableRow key={index} className="hover:bg-muted/50 border-border">
                                    <TableCell className="font-medium">{item.product_name || item.name}</TableCell>
                                    <TableCell className="text-right">{formatCurrency(item.price)}</TableCell>
                                    <TableCell className="text-center">{item.quantity} {item.unit || ''}</TableCell>
                                    <TableCell className="text-right font-bold">
                                        {formatCurrency(item.price * item.quantity)}
                                    </TableCell>
                                </TableRow>
                            ))}
                            {items.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-4 text-muted-foreground">
                                        Ma'lumot topilmadi
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>

                <div className="flex justify-end mt-6 pt-4 border-t border-border">
                    <div className="flex flex-col items-end gap-1">
                        <span className="text-muted-foreground text-sm">Umumiy summa</span>
                        <span className="text-2xl font-bold text-primary">
                            {formatCurrency(total)}
                        </span>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default SaleDetailModal;
