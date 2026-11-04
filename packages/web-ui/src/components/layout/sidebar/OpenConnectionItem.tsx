import {useState} from 'react';
import {useLocation} from 'react-router-dom';
import {
    Loader2,
    Shield,
    X,
    AlertCircle,
    Terminal,
    Check,
    Copy,
    Power,
    Columns2,
    Rows2,
    AppWindow,
    SquarePlus,
    Image as ImageIcon,
    RotateCcw,
} from 'lucide-react';
import {useTranslation} from 'react-i18next';
import type {ConnectionStatus} from '@/hooks/useConnectionManager';
import {getConnectionItemClass, getStatusDotClass} from '@/utils/connectionManager';
import {canActivateSplit, canAddToSplit} from '@/utils/connectionLayout';
import {useConnectionLayoutContext} from '@/hooks/useConnectionLayoutContext';
import {ContextMenu} from '@/components/ui/ContextMenu';
import {ConnectionIconImage} from '@/components/ConnectionIconImage';
import {RailIndicator} from './RailIndicator';
import type {PluginManifest} from '@/types/plugins';
import {getConnectionAccent, getConnectionIcon} from '@/utils/driverUI';
import {useDatabase} from '@/hooks/useDatabase';
import {useAlert} from '@/hooks/useAlert';
import {usePlatformCapabilities} from '@/hooks/usePlatformCapabilities';
import {useTabularisClient} from '@/hooks/useTabularisClient';
import {isEditorRoute} from '@/routing';
import type {ConnectionAppearance, IconOverride} from '@/contexts/DatabaseContext';

interface Props {
    connection: ConnectionStatus;
    driverManifest?: PluginManifest | null;
    isSelected: boolean;
    onSwitch: () => void;
    onOpenInEditor: () => void;
    onOpenInNewWindow: () => void;
    onDisconnect: () => void;
    onToggleSelect: (isCtrlHeld: boolean) => void;
    selectedConnectionIds: Set<string>;
    onActivateSplit: (mode: 'vertical' | 'horizontal') => void;
    shortcutIndex?: number;
    showShortcutHint?: boolean;
    /** Starts a pointer-based drag session (reorder / drop into split group) */
    onMoveMouseDown?: (e: React.MouseEvent) => void;
    dropIndicator?: 'above' | 'below' | null;
}

export const OpenConnectionItem = ({
    connection,
    driverManifest,
    isSelected,
    onSwitch,
    onOpenInEditor,
    onOpenInNewWindow,
    onDisconnect,
    onToggleSelect,
    selectedConnectionIds,
    onActivateSplit,
    shortcutIndex,
    showShortcutHint = false,
    onMoveMouseDown,
    dropIndicator = null,
}: Props) => {
    const {t} = useTranslation();
    const {connections, loadConnections} = useDatabase();
    const platform = usePlatformCapabilities();
    const client = useTabularisClient();
    const {showAlert} = useAlert();
    const location = useLocation();
    const {isActive, isConnecting, name, database, sshEnabled, error} = connection;
    // The rail indicator marks the current view: a connection "owns" it only in
    // the editor, otherwise it belongs to the active nav item (connections/mcp/settings)
    const isCurrentView = isActive && isEditorRoute(location.pathname);
    const savedConnection = connections.find((c) => c.id === connection.id);
    const driverColor = getConnectionAccent(savedConnection, driverManifest);
    const iconOverride = savedConnection?.appearance?.icon;
    const currentImagePath = iconOverride?.type === 'image' ? iconOverride.path : null;
    const hasError = !!error;
    const canSplit = canActivateSplit(selectedConnectionIds);
    const {splitView, addConnectionToSplit} = useConnectionLayoutContext();
    const canJoinSplit = canAddToSplit(splitView, connection.id);

    const [contextMenu, setContextMenu] = useState<{x: number; y: number} | null>(null);

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        setContextMenu({x: e.clientX, y: e.clientY});
    };

    /** Persists the icon override, keeping the other appearance fields (accent color). */
    const writeIconOverride = async (icon: IconOverride | undefined) => {
        if (!savedConnection) return;
        const next: ConnectionAppearance = {...savedConnection.appearance};
        if (icon) next.icon = icon;
        else delete next.icon;
        // Same payload convention as the connection form: an empty appearance is cleared.
        const appearance = next.icon || next.accentColor ? next : undefined;
        await client.call('set_connection_appearance', {id: savedConnection.id, appearance});
        await loadConnections();
    };

    /** Best-effort removal of an uploaded icon file that is no longer referenced. */
    const removeIconFile = (relativePath: string) =>
        client.call('delete_connection_icon', {relativePath}).catch(() => {});

    const reportLogoError = (e: unknown) => {
        showAlert(`${t('sidebar.failChangeLogo')}${String(e)}`, {
            kind: 'error',
            title: t('common.error'),
        });
    };

    const handleChangeLogo = async () => {
        if (!savedConnection) return;
        const previousPath = currentImagePath;
        let stored: string | null = null;
        try {
            // Cancelling the picker resolves to null: nothing to persist.
            stored = await platform.chooseConnectionIcon(savedConnection.id);
            if (!stored) return;
            await writeIconOverride({type: 'image', path: stored});
        } catch (e) {
            // The new file is orphaned when persisting it failed.
            if (stored) void removeIconFile(stored);
            reportLogoError(e);
            return;
        }
        if (previousPath && previousPath !== stored) void removeIconFile(previousPath);
    };

    const handleResetLogo = async () => {
        if (!savedConnection) return;
        const previousPath = currentImagePath;
        try {
            await writeIconOverride(undefined);
        } catch (e) {
            reportLogoError(e);
            return;
        }
        if (previousPath) void removeIconFile(previousPath);
    };

    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey) {
            onToggleSelect(true);
        } else {
            onSwitch();
        }
    };

    const splitItems = canSplit
        ? [
              {
                  label: t('sidebar.splitVertical'),
                  icon: Columns2,
                  action: () => onActivateSplit('vertical'),
              },
              {
                  label: t('sidebar.splitHorizontal'),
                  icon: Rows2,
                  action: () => onActivateSplit('horizontal'),
              },
              {separator: true as const},
          ]
        : [];

    const joinSplitItems = canJoinSplit
        ? [
              {
                  label: t('sidebar.addToSplitGroup'),
                  icon: SquarePlus,
                  action: () => addConnectionToSplit(connection.id),
              },
              {separator: true as const},
          ]
        : [];

    const menuItems = [
        ...splitItems,
        ...joinSplitItems,
        {
            label: t('sidebar.openInEditor'),
            icon: Terminal,
            action: onOpenInEditor,
        },
        {
            label: t('sidebar.openInNewWindow'),
            icon: AppWindow,
            action: onOpenInNewWindow,
        },
        {
            label: t('sidebar.setAsActive'),
            icon: Check,
            action: onSwitch,
            disabled: isActive,
        },
        {separator: true as const},
        ...(savedConnection
            ? [
                  {
                      label: t('sidebar.changeLogo'),
                      icon: ImageIcon,
                      action: handleChangeLogo,
                  },
                  ...(iconOverride
                      ? [
                            {
                                label: t('sidebar.resetLogo'),
                                icon: RotateCcw,
                                action: handleResetLogo,
                            },
                        ]
                      : []),
                  {separator: true as const},
              ]
            : []),
        {
            label: t('sidebar.copyName'),
            icon: Copy,
            action: () => navigator.clipboard.writeText(name),
        },
        {separator: true as const},
        {
            label: t('connections.disconnect'),
            icon: Power,
            action: onDisconnect,
            danger: true,
        },
    ];

    return (
        <>
            <div className="relative group w-full flex flex-col items-center mb-1">
                {/* Drop indicator - above */}
                {dropIndicator === 'above' && (
                    <div className="absolute -top-0.5 left-2 right-2 h-0.5 bg-accent-primary rounded-full z-30" />
                )}

                <RailIndicator isActive={isCurrentView} />

                <button
                    onClick={handleClick}
                    onMouseDown={onMoveMouseDown}
                    onContextMenu={handleContextMenu}
                    className={`flex items-center justify-center w-10 h-10 rounded-lg transition-all relative ${
                        isSelected
                            ? 'ring-2 ring-accent-primary bg-accent-primary/20 text-accent'
                            : getConnectionItemClass(isActive)
                    }`}
                >
                    {isConnecting ? (
                        <Loader2 size={16} className="animate-spin text-accent" />
                    ) : (
                        <div
                            className="w-9 h-9 rounded-lg flex items-center justify-center text-white shadow-md overflow-hidden"
                            style={{backgroundColor: driverColor}}
                        >
                            {iconOverride?.type === 'image' ? (
                                // Uploaded logo: fills the tile with a small inset, driver icon as fallback
                                <ConnectionIconImage
                                    path={iconOverride.path}
                                    size={28}
                                    fallback={getConnectionIcon(
                                        savedConnection,
                                        driverManifest,
                                        16,
                                    )}
                                />
                            ) : (
                                getConnectionIcon(savedConnection, driverManifest, 16)
                            )}
                        </div>
                    )}

                    {/* Status dot */}
                    {!isConnecting && (
                        <div
                            className={`absolute bottom-1.5 right-1.5 w-2 h-2 rounded-full border border-elevated ${getStatusDotClass(isActive, hasError)}`}
                        />
                    )}

                    {/* Production ring: unmistakable red outline around the icon */}
                    {savedConnection?.environment === 'production' && (
                        <div className="absolute inset-0.5 rounded-lg ring-2 ring-accent-error/70 pointer-events-none" />
                    )}

                    {/* SSH badge */}
                    {sshEnabled &&
                        !showShortcutHint &&
                        !connection.k8sEnabled &&
                        !connection.ssmEnabled && (
                            <div className="absolute top-1 right-1">
                                <Shield
                                    size={9}
                                    className="text-accent-success fill-accent-success/20"
                                />
                            </div>
                        )}

                    {/* K8s badge */}
                    {connection.k8sEnabled && !showShortcutHint && (
                        <div className="absolute top-1 right-1">
                            <Shield size={9} className="text-accent fill-accent-primary/20" />
                        </div>
                    )}

                    {/* AWS SSM badge */}
                    {connection.ssmEnabled && !connection.k8sEnabled && !showShortcutHint && (
                        <div className="absolute top-1 right-1">
                            <Shield
                                size={9}
                                className="text-accent-warning fill-accent-warning/20"
                            />
                        </div>
                    )}

                    {/* Shortcut hint badge */}
                    {showShortcutHint && shortcutIndex !== undefined && (
                        <div className="absolute -top-1 -left-1 w-4 h-4 bg-accent-primary rounded-full flex items-center justify-center text-inverse text-[9px] font-bold z-20 shadow-sm">
                            {shortcutIndex}
                        </div>
                    )}

                    {/* Error indicator */}
                    {hasError && !isConnecting && (
                        <div className="absolute -top-0.5 -left-0.5">
                            <AlertCircle size={12} className="text-accent-error" />
                        </div>
                    )}

                    {/* Selection indicator */}
                    {isSelected && (
                        <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-accent-primary rounded-full flex items-center justify-center">
                            <Check size={8} className="text-white" />
                        </div>
                    )}
                </button>

                {/* Disconnect button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onDisconnect();
                    }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-elevated border border-default rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent-error/20 hover:text-accent-error text-muted z-10"
                    title={t('connections.disconnect')}
                >
                    <X size={8} />
                </button>

                {/* Tooltip */}
                <div className="absolute left-14 top-1/2 -translate-y-1/2 bg-surface-secondary text-primary text-xs px-2 py-1.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-30 pointer-events-none shadow-lg border border-default">
                    <div className="font-medium">{name}</div>
                    <div className="text-muted text-[10px]">{database}</div>
                    {isSelected && (
                        <div className="text-accent text-[10px] mt-0.5">
                            Selected (Ctrl+click to deselect)
                        </div>
                    )}
                    {hasError && (
                        <div className="text-accent-error text-[10px] mt-0.5 max-w-[180px] truncate">
                            {error}
                        </div>
                    )}
                </div>

                {/* Drop indicator - below */}
                {dropIndicator === 'below' && (
                    <div className="absolute -bottom-0.5 left-2 right-2 h-0.5 bg-accent-primary rounded-full z-30" />
                )}
            </div>

            {contextMenu && (
                <ContextMenu
                    x={contextMenu.x}
                    y={contextMenu.y}
                    items={menuItems}
                    onClose={() => setContextMenu(null)}
                />
            )}
        </>
    );
};
