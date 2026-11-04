import {useCallback, useEffect, useRef, type UIEvent} from 'react';

export const SCROLLBAR_HIDE_DELAY_MS = 800;

/**
 * Returns an `onScroll` handler that reveals a `.scrollbar-on-scroll` thumb and
 * hides it again once scrolling has been idle for a moment. The thumb color goes
 * through an inline custom property because WKWebView does not repaint
 * `::-webkit-scrollbar-thumb` when a class or attribute on the element changes.
 * Writing to the DOM directly also keeps scrolling from re-rendering the component.
 */
export const useScrollbarReveal = () => {
    const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

    useEffect(() => () => clearTimeout(timerRef.current), []);

    return useCallback((e: UIEvent<HTMLElement>) => {
        const el = e.currentTarget;
        el.style.setProperty('--scrollbar-thumb', 'var(--surface-secondary)');
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            el.style.removeProperty('--scrollbar-thumb');
        }, SCROLLBAR_HIDE_DELAY_MS);
    }, []);
};
