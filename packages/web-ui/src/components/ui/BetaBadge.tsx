import {useTranslation} from 'react-i18next';
import clsx from 'clsx';

interface BetaBadgeProps {
    className?: string;
}

/** Small "BETA" pill for features that are still experimental. */
export const BetaBadge = ({className}: BetaBadgeProps) => {
    const {t} = useTranslation();
    return (
        <span
            className={clsx(
                'rounded-sm px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide',
                'border border-accent-primary/30 bg-accent-primary/15 text-accent',
                className,
            )}
        >
            {t('common.beta')}
        </span>
    );
};
