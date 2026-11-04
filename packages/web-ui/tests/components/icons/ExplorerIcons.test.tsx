import {describe, it, expect} from 'vitest';
import {render} from '@testing-library/react';
import {
    ConnectionIcon,
    DotsGridIcon,
    DatabaseDotsIcon,
    FolderCellsIcon,
    PinnedListIcon,
    CardGridIcon,
    SplitDotsIcon,
} from '@/components/icons/ExplorerIcons';

const icons = {
    ConnectionIcon,
    DotsGridIcon,
    DatabaseDotsIcon,
    FolderCellsIcon,
    PinnedListIcon,
    CardGridIcon,
    SplitDotsIcon,
};

describe('ExplorerIcons', () => {
    it.each(Object.entries(icons))('renders %s as a decorative, themeable svg', (_name, Icon) => {
        const {container} = render(<Icon size={24} />);
        const svg = container.querySelector('svg');
        expect(svg).not.toBeNull();
        expect(svg?.getAttribute('stroke')).toBe('currentColor');
        expect(svg?.getAttribute('viewBox')).toBe('0 0 24 24');
        expect(svg?.getAttribute('aria-hidden')).toBe('true');
    });

    it('respects size, className and strokeWidth props', () => {
        const {container} = render(
            <DotsGridIcon size={18} strokeWidth={1.5} className="text-muted" />,
        );
        const svg = container.querySelector('svg');
        expect(svg?.getAttribute('width')).toBe('18');
        expect(svg?.getAttribute('height')).toBe('18');
        expect(svg?.getAttribute('stroke-width')).toBe('1.5');
        expect(svg?.getAttribute('class')).toBe('text-muted');
    });
});
