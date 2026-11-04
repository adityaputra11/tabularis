import {ChevronDown} from 'lucide-react';

export interface StyledSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: string[];
    /** Optional display label for each option value (falls back to the value). */
    getOptionLabel?: (value: string) => string;
    ariaLabel?: string;
    active?: boolean;
    className?: string;
}

export const StyledSelect = ({
    value,
    onChange,
    options,
    getOptionLabel,
    ariaLabel,
    active = false,
    className = '',
}: StyledSelectProps) => (
    <div className={`relative shrink-0 ${className}`}>
        <select
            aria-label={ariaLabel}
            data-active={active || undefined}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`w-full appearance-none bg-input border rounded-sm px-2 pr-6 h-[26px] text-xs focus:border-focus focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus cursor-pointer transition-colors ${
                active
                    ? 'border-accent-primary/50 text-accent font-medium hover:border-accent-primary/70'
                    : 'border-default text-secondary hover:border-default/80'
            }`}
        >
            {options.map((opt) => (
                <option key={opt} value={opt}>
                    {getOptionLabel ? getOptionLabel(opt) : opt}
                </option>
            ))}
        </select>
        <ChevronDown
            size={10}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
    </div>
);
