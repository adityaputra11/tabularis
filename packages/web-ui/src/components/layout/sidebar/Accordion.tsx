import React from 'react';
import {ChevronRight, ChevronDown} from 'lucide-react';

interface AccordionProps {
    title: string;
    isOpen: boolean;
    onToggle: () => void;
    children: React.ReactNode;
    actions?: React.ReactNode;
}

export const Accordion = ({title, isOpen, onToggle, children, actions}: AccordionProps) => (
    <div className="flex flex-col mb-1">
        <div className="flex items-center justify-between pl-3 pr-3 py-1 group/acc">
            <button
                onClick={onToggle}
                className="flex min-w-0 items-center gap-2 text-xs font-semibold text-muted uppercase tracking-wide hover:text-secondary transition-colors select-none flex-1"
            >
                {isOpen ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                <span className="truncate">{title}</span>
            </button>
            {actions && <div className="ml-2 shrink-0 pr-3">{actions}</div>}
        </div>
        {isOpen && <div>{children}</div>}
    </div>
);
