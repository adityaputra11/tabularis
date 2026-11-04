import React from 'react';
import {useTranslation} from 'react-i18next';
import {Search, X} from 'lucide-react';
import {isTextCompositionKeyEvent} from '@/utils/keyboardEvents';

interface TableFilterInputProps {
    /** Current filter text value. */
    value: string;
    /** Called when the filter text changes. */
    onChange: (value: string) => void;
    /**
     * Called when Enter is pressed with at least one match.
     * The parent passes the name of the first filtered table.
     */
    onOpenFirstMatch?: () => void;
    /** Whether there is at least one filtered match. */
    hasMatch: boolean;
    /**
     * Whether to stop propagation on input click and clear-button click.
     * Set to true when the filter is inside a clickable accordion.
     */
    stopPropagation?: boolean;
}

/**
 * Shared table-filter input used in the explorer sidebar.
 * Handles Enter to open the first match and Escape to clear.
 */
export const TableFilterInput = ({
    value,
    onChange,
    onOpenFirstMatch,
    hasMatch,
    stopPropagation = false,
}: TableFilterInputProps) => {
    const {t} = useTranslation();

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (isTextCompositionKeyEvent(e.nativeEvent)) return;
        if (e.key === 'Enter') {
            if (hasMatch && onOpenFirstMatch) {
                e.preventDefault();
                onOpenFirstMatch();
            }
        } else if (e.key === 'Escape' && value) {
            e.preventDefault();
            onChange('');
        }
    };

    const handleInputClick = (e: React.MouseEvent) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
    };

    const handleClearClick = (e: React.MouseEvent) => {
        if (stopPropagation) {
            e.stopPropagation();
        }
        onChange('');
    };

    return (
        <div className="px-3 py-1.5">
            <div className="relative flex items-center">
                <Search size={11} className="absolute left-2.5 text-muted pointer-events-none" />
                <input
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    spellCheck={false}
                    type="text"
                    data-table-filter
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onClick={handleInputClick}
                    placeholder={t('sidebar.filterTables')}
                    className="w-full h-[26px] bg-input text-xs text-secondary placeholder:text-muted rounded-sm pl-7 pr-8 border border-default focus:outline-none focus:border-focus"
                />
                {value && (
                    <button
                        type="button"
                        onClick={handleClearClick}
                        aria-label={t('sidebar.clearTableFilter')}
                        className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted hover:text-primary p-0.5 rounded-sm hover:bg-surface-hover"
                    >
                        <X size={11} />
                    </button>
                )}
            </div>
        </div>
    );
};
