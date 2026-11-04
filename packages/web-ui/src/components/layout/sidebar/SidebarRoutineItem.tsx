import React, {useState, useEffect} from 'react';
import {useTranslation} from 'react-i18next';
import {Code2, Folder, Loader2, ChevronDown, ChevronRight, Variable} from 'lucide-react';
import clsx from 'clsx';
import type {RoutineInfo} from '@/contexts/DatabaseContext';
import {routineLabel} from '@/utils/routines';
import type {ContextMenuData} from '@/types/sidebar';
import {useTabularisClient} from '@/hooks/useTabularisClient';
import {onActivationKey} from '@/utils/keyboardEvents';

interface RoutineParameter {
    name: string;
    data_type: string;
    mode: string;
    ordinal_position: number;
}

interface SidebarRoutineItemProps {
    routine: RoutineInfo;
    onContextMenu: (
        e: React.MouseEvent,
        type: string,
        id: string,
        label: string,
        data?: ContextMenuData,
    ) => void;
    onDoubleClick: (routine: RoutineInfo) => void;
    connectionId: string;
    schema?: string;
    database?: string;
}

export const SidebarRoutineItem = ({
    routine,
    onContextMenu,
    onDoubleClick,
    connectionId,
    schema,
    database,
}: SidebarRoutineItemProps) => {
    const client = useTabularisClient();
    const {t} = useTranslation();

    const [isExpanded, setIsExpanded] = useState(false);
    const [parameters, setParameters] = useState<RoutineParameter[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const refreshParameters = React.useCallback(async () => {
        if (!connectionId) return;
        setIsLoading(true);
        try {
            const params = await client.call('get_routine_parameters', {
                connectionId,
                routineName: routine.name,
                ...(schema ? {schema} : {}),
                ...(database ? {database} : {}),
                ...(routine.identity_args != null ? {identityArgs: routine.identity_args} : {}),
            });
            setParameters(params);
        } catch (err) {
            console.error('Failed to load routine parameters:', err);
        } finally {
            setIsLoading(false);
        }
    }, [client, connectionId, routine.name, routine.identity_args, schema, database]);

    useEffect(() => {
        if (isExpanded) {
            refreshParameters();
        }
    }, [isExpanded, refreshParameters]);

    const handleExpand = (e: React.SyntheticEvent) => {
        e.stopPropagation();
        setIsExpanded((prev) => !prev);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        // Forward the item's schema so menu actions (run / edit / drop) target
        // the right namespace even outside the connection's active schema.
        onContextMenu(e, 'routine', routine.name, routine.name, {...routine, schema, database});
    };

    return (
        <div className="flex flex-col">
            <div
                role="button"
                tabIndex={0}
                aria-expanded={isExpanded}
                onClick={handleExpand}
                onKeyDown={onActivationKey((e: React.KeyboardEvent) => handleExpand(e))}
                onDoubleClick={(e) => {
                    e.stopPropagation();
                    onDoubleClick(routine);
                }}
                onContextMenu={handleContextMenu}
                className={clsx(
                    'flex items-center gap-1 h-[1.6rem] pl-1 pr-3 text-sm rounded-sm cursor-pointer group select-none transition-colors rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
                    'text-secondary hover:bg-surface-hover hover:text-primary',
                )}
            >
                {/* Decorative chevron: the whole row toggles expansion. */}
                <span
                    aria-hidden="true"
                    className="p-0.5 rounded hover:bg-surface-hover text-muted hover:text-primary transition-colors"
                >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                </span>
                <Code2
                    size={14}
                    className="text-accent-success/70 group-hover:text-accent-success"
                />
                <span className="truncate flex-1">
                    {routineLabel(routine.name, routine.identity_args)}
                </span>
            </div>
            {isExpanded && (
                <div className="ml-[22px] border-l border-subtle">
                    {isLoading ? (
                        <div className="flex items-center gap-2 p-2 text-xs text-muted">
                            <Loader2 size={12} className="animate-spin" />
                            {t('sidebar.loadingSchema')}
                        </div>
                    ) : (
                        <div className="flex flex-col">
                            {parameters.length > 0 ? (
                                <>
                                    <div className="flex items-center gap-2 h-[1.6rem] px-2 text-xs text-muted rounded-sm select-none">
                                        <Folder size={12} className="text-accent/70" />
                                        <span>{t('sidebar.parameters')}</span>
                                        {/* mr-3.5 lines the count up with the group counts of
                        Functions / Procedures (px-2 + mr-3.5 = same edge). */}
                                        <span className="ml-auto mr-3.5 text-[10px] opacity-50">
                                            {parameters.length}
                                        </span>
                                    </div>
                                    <div className="ml-4 border-l border-subtle">
                                        {parameters.map((param) => {
                                            const mode =
                                                param.mode ||
                                                (routine.routine_type === 'FUNCTION' && !param.name
                                                    ? 'OUT'
                                                    : '');
                                            return (
                                                <div
                                                    key={`${param.name}-${param.ordinal_position}`}
                                                    className="flex items-center gap-2 h-[1.6rem] px-3 text-xs rounded-sm text-secondary hover:bg-surface-hover hover:text-primary group font-mono"
                                                    title={`${mode} ${param.name} ${param.data_type}`.trim()}
                                                >
                                                    <Variable
                                                        size={12}
                                                        className="text-muted shrink-0"
                                                    />
                                                    <span className="truncate flex-1 min-w-0">
                                                        {param.name || t('routines.returnValue')}
                                                    </span>
                                                    {mode && (
                                                        <span className="text-[10px] text-muted opacity-60 shrink-0">
                                                            {mode}
                                                        </span>
                                                    )}
                                                    {/* px-3 (12px) + mr-2.5 (10px) ends at the same
                              22px right edge as the group / parameter counts. */}
                                                    <span className="text-muted text-[10px] ml-auto mr-2.5 shrink-0">
                                                        {param.data_type}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </>
                            ) : (
                                <div className="p-2 text-xs text-muted italic ml-2">
                                    {t('sidebar.noParameters')}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
