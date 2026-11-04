import {describe, it, expect, vi, beforeEach, afterEach} from 'vitest';
import {fireEvent, render} from '@testing-library/react';
import {SCROLLBAR_HIDE_DELAY_MS, useScrollbarReveal} from '../../src/hooks/useScrollbarReveal';

const Scroller = () => {
    const onScroll = useScrollbarReveal();
    return <div data-testid="scroller" onScroll={onScroll} />;
};

const thumbColor = (el: HTMLElement) => el.style.getPropertyValue('--scrollbar-thumb');

describe('useScrollbarReveal', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('reveals the thumb on scroll and hides it after the idle delay', () => {
        const {getByTestId} = render(<Scroller />);
        const el = getByTestId('scroller');

        fireEvent.scroll(el);
        expect(thumbColor(el)).toBe('var(--surface-secondary)');

        vi.advanceTimersByTime(SCROLLBAR_HIDE_DELAY_MS);
        expect(thumbColor(el)).toBe('');
    });

    it('keeps the thumb visible while scroll events keep arriving', () => {
        const {getByTestId} = render(<Scroller />);
        const el = getByTestId('scroller');

        fireEvent.scroll(el);
        vi.advanceTimersByTime(SCROLLBAR_HIDE_DELAY_MS - 1);
        fireEvent.scroll(el);
        vi.advanceTimersByTime(SCROLLBAR_HIDE_DELAY_MS - 1);
        expect(thumbColor(el)).toBe('var(--surface-secondary)');

        vi.advanceTimersByTime(1);
        expect(thumbColor(el)).toBe('');
    });

    it('cancels the pending timer on unmount', () => {
        const {getByTestId, unmount} = render(<Scroller />);

        fireEvent.scroll(getByTestId('scroller'));
        unmount();

        expect(vi.getTimerCount()).toBe(0);
    });
});
