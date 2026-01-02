import React, { useEffect } from 'react';
import { cn } from '../../utils/cn';
import { X } from 'lucide-react';

const Dialog = ({ open, onOpenChange, children }) => {
    useEffect(() => {
        if (open) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [open]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
                onClick={() => onOpenChange(false)}
            />
            {/* Content Container */}
            <div className="relative z-50 w-full p-4 pointer-events-none flex justify-center">
                {children}
            </div>
        </div>
    );
};

const DialogContent = ({ children, className }) => {
    return (
        <div className={cn(
            "bg-background rounded-2xl shadow-2xl p-6 pointer-events-auto border w-full animate-in zoom-in-95 duration-200",
            className
        )}>
            {children}
        </div>
    );
};

const DialogHeader = ({ children, className }) => {
    return (
        <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left mb-4", className)}>
            {children}
        </div>
    );
};

const DialogTitle = ({ children, className }) => {
    return (
        <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
            {children}
        </h2>
    );
};

export { Dialog, DialogContent, DialogHeader, DialogTitle };
