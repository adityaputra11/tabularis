import type {ReactNode} from 'react';

interface ExplorerIconProps {
    size?: number;
    className?: string;
    strokeWidth?: number;
}

/** Decorative like lucide icons: the control around the icon carries the label. */
function Base({
    size = 24,
    className,
    strokeWidth = 2,
    children,
}: ExplorerIconProps & {children: ReactNode}) {
    return (
        <svg
            viewBox="0 0 24 24"
            width={size}
            height={size}
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
        >
            {children}
        </svg>
    );
}

function Dots({points, r = 1}: {points: Array<[number, number]>; r?: number}) {
    return (
        <>
            {points.map(([cx, cy]) => (
                <circle
                    key={`${cx}-${cy}`}
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill="currentColor"
                    stroke="none"
                />
            ))}
        </>
    );
}

function Cells({size, points}: {size: number; points: Array<[number, number]>}) {
    return (
        <>
            {points.map(([x, y]) => (
                <rect
                    key={`${x}-${y}`}
                    x={x}
                    y={y}
                    width={size}
                    height={size}
                    rx={0.6}
                    fill="currentColor"
                    stroke="none"
                />
            ))}
        </>
    );
}

/** Rounded square holding a 3x3 dot grid. Used for tables. */
export const DotsGridIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <rect x={3} y={3} width={18} height={18} rx={5} />
        <Dots
            points={[
                [7.5, 7.5],
                [12, 7.5],
                [16.5, 7.5],
                [7.5, 12],
                [12, 12],
                [16.5, 12],
                [7.5, 16.5],
                [12, 16.5],
                [16.5, 16.5],
            ]}
            r={1.15}
        />
    </Base>
);

/** Two-tier database cylinder with a dot per tier. */
export const DatabaseDotsIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <ellipse cx={12} cy={5.2} rx={7} ry={2.7} />
        <path d="M5 5.2v13.6c0 1.5 3.13 2.7 7 2.7s7-1.2 7-2.7V5.2" />
        <path d="M5 12c0 1.5 3.13 2.7 7 2.7s7-1.2 7-2.7" />
        <Dots
            points={[
                [16.4, 10.6],
                [16.4, 17.2],
            ]}
        />
    </Base>
);

/** Folder holding two rows of four cells. Used for connection groups. */
export const FolderCellsIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <path d="M3 8V7a3 3 0 0 1 3-3h3.2L11 6h7a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8z" />
        <Cells
            size={2}
            points={[
                [6.6, 10.5],
                [9.8, 10.5],
                [13, 10.5],
                [16.2, 10.5],
                [6.6, 14],
                [9.8, 14],
                [13, 14],
                [16.2, 14],
            ]}
        />
    </Base>
);

/** Card with two binder pins and a two-row dot-and-line list. */
export const PinnedListIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <rect x={3} y={4.5} width={18} height={16.5} rx={5} />
        <path d="M3 10h18" />
        <path d="M8 2.8v3.4" />
        <path d="M16 2.8v3.4" />
        <Dots
            points={[
                [7.5, 13.6],
                [7.5, 17.2],
            ]}
        />
        <path d="M11 13.6h6" />
        <path d="M11 17.2h6" />
    </Base>
);

/** Card with a header divider and two rows of three cells. */
export const CardGridIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <rect x={3.5} y={3} width={17} height={18} rx={5} />
        <path d="M3.5 8.5h17" />
        <Cells
            size={2.4}
            points={[
                [7.4, 11.2],
                [10.8, 11.2],
                [14.2, 11.2],
                [7.4, 14.8],
                [10.8, 14.8],
                [14.2, 14.8],
            ]}
        />
    </Base>
);

/** Card split in two with a pair of dots per half. */
export const SplitDotsIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <rect x={3} y={3} width={18} height={18} rx={5} />
        <path d="M3 12h18" />
        <Dots
            points={[
                [13.6, 7.5],
                [17, 7.5],
                [13.6, 16.5],
                [17, 16.5],
            ]}
            r={1.15}
        />
    </Base>
);

/** Plug with two prongs, a rounded body holding two dots, and a cord. */
export const ConnectionIcon = (props: ExplorerIconProps) => (
    <Base {...props}>
        <path d="M9 2.8v4.4" />
        <path d="M15 2.8v4.4" />
        <rect x={4.5} y={7.2} width={15} height={9.3} rx={4} />
        <path d="M12 16.5v4.7" />
        <Dots
            points={[
                [9.8, 11.85],
                [14.2, 11.85],
            ]}
            r={1.15}
        />
    </Base>
);
