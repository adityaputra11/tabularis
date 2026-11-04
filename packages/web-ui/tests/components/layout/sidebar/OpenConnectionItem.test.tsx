import {describe, it, expect, vi, beforeEach} from 'vitest';
import {render, screen, fireEvent, waitFor} from '@testing-library/react';
import {MemoryRouter} from 'react-router-dom';
import {OpenConnectionItem} from '@/components/layout/sidebar/OpenConnectionItem';
import type {ConnectionStatus} from '@/utils/connectionManager';
import type {SavedConnection} from '@/contexts/DatabaseContext';

const mocks = vi.hoisted(() => ({
    chooseConnectionIcon: vi.fn(),
    call: vi.fn(),
    loadConnections: vi.fn(),
    showAlert: vi.fn(),
    connections: [] as SavedConnection[],
}));

// tests/setup.ts stubs lucide-react with a fixed icon set; use the real icons here.
vi.mock('lucide-react', async (importOriginal) => importOriginal());

vi.mock('react-i18next', () => ({
    useTranslation: () => ({t: (key: string) => key}),
}));

vi.mock('@/hooks/usePlatformCapabilities', () => ({
    usePlatformCapabilities: () => ({chooseConnectionIcon: mocks.chooseConnectionIcon}),
}));

vi.mock('@/hooks/useTabularisClient', () => ({
    useTabularisClient: () => ({call: mocks.call}),
}));

vi.mock('@/hooks/useDatabase', () => ({
    useDatabase: () => ({connections: mocks.connections, loadConnections: mocks.loadConnections}),
}));

vi.mock('@/hooks/useAlert', () => ({
    useAlert: () => ({showAlert: mocks.showAlert}),
}));

vi.mock('@/hooks/useConnectionLayoutContext', () => ({
    useConnectionLayoutContext: () => ({splitView: null, addConnectionToSplit: vi.fn()}),
}));

// The real image loader resolves assets through the platform; stub it to expose the path.
vi.mock('@/components/ConnectionIconImage', () => ({
    ConnectionIconImage: ({path}: {path: string}) => (
        <span data-testid="rail-logo" data-path={path} />
    ),
}));

const CONNECTION_ID = 'conn-1';

function savedConnection(overrides: Partial<SavedConnection> = {}): SavedConnection {
    return {
        id: CONNECTION_ID,
        name: 'Prod DB',
        params: {driver: 'postgres', database: 'app'},
        ...overrides,
    } as SavedConnection;
}

function status(): ConnectionStatus {
    return {
        id: CONNECTION_ID,
        name: 'Prod DB',
        driver: 'postgres',
        database: 'app',
        sshEnabled: false,
        k8sEnabled: false,
        ssmEnabled: false,
        isOpen: true,
        isActive: false,
        isConnecting: false,
        isConnected: true,
    };
}

function renderItem() {
    return render(
        <MemoryRouter>
            <OpenConnectionItem
                connection={status()}
                isSelected={false}
                onSwitch={vi.fn()}
                onOpenInEditor={vi.fn()}
                onOpenInNewWindow={vi.fn()}
                onDisconnect={vi.fn()}
                onToggleSelect={vi.fn()}
                selectedConnectionIds={new Set()}
                onActivateSplit={vi.fn()}
            />
        </MemoryRouter>,
    );
}

// The rail button is the first button in the item (the disconnect control comes after it).
function openContextMenu(container: HTMLElement) {
    const railButton = container.querySelector('button') as HTMLButtonElement;
    fireEvent.contextMenu(railButton);
}

describe('OpenConnectionItem logo actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mocks.connections = [savedConnection()];
        mocks.call.mockResolvedValue(undefined);
        mocks.loadConnections.mockResolvedValue(undefined);
    });

    it('shows "Change Logo" in the context menu and hides "Reset Logo" without an override', () => {
        const {container} = renderItem();
        openContextMenu(container);

        expect(screen.getByText('sidebar.changeLogo')).toBeInTheDocument();
        expect(screen.queryByText('sidebar.resetLogo')).not.toBeInTheDocument();
    });

    it('shows "Reset Logo" when an icon override exists', () => {
        mocks.connections = [
            savedConnection({appearance: {icon: {type: 'image', path: 'connection-icons/a.png'}}}),
        ];
        const {container} = renderItem();
        openContextMenu(container);

        expect(screen.getByText('sidebar.resetLogo')).toBeInTheDocument();
    });

    it('renders the uploaded logo in the rail tile', () => {
        mocks.connections = [
            savedConnection({appearance: {icon: {type: 'image', path: 'connection-icons/a.png'}}}),
        ];
        renderItem();

        expect(screen.getByTestId('rail-logo')).toHaveAttribute(
            'data-path',
            'connection-icons/a.png',
        );
    });

    it('uploads a logo and persists it while keeping the accent color', async () => {
        mocks.connections = [savedConnection({appearance: {accentColor: '#ff0000'}})];
        mocks.chooseConnectionIcon.mockResolvedValue('connection-icons/new.png');
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.changeLogo'));

        await waitFor(() => {
            expect(mocks.call).toHaveBeenCalledWith('set_connection_appearance', {
                id: CONNECTION_ID,
                appearance: {
                    accentColor: '#ff0000',
                    icon: {type: 'image', path: 'connection-icons/new.png'},
                },
            });
        });
        expect(mocks.chooseConnectionIcon).toHaveBeenCalledWith(CONNECTION_ID);
        expect(mocks.loadConnections).toHaveBeenCalled();
        // No previous image, so nothing to clean up
        expect(mocks.call).not.toHaveBeenCalledWith('delete_connection_icon', expect.anything());
    });

    it('deletes the previous image file after replacing it', async () => {
        mocks.connections = [
            savedConnection({
                appearance: {icon: {type: 'image', path: 'connection-icons/old.png'}},
            }),
        ];
        mocks.chooseConnectionIcon.mockResolvedValue('connection-icons/new.png');
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.changeLogo'));

        await waitFor(() => {
            expect(mocks.call).toHaveBeenCalledWith('delete_connection_icon', {
                relativePath: 'connection-icons/old.png',
            });
        });
    });

    it('does nothing when the picker is cancelled', async () => {
        mocks.chooseConnectionIcon.mockResolvedValue(null);
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.changeLogo'));

        await waitFor(() => expect(mocks.chooseConnectionIcon).toHaveBeenCalled());
        expect(mocks.call).not.toHaveBeenCalled();
        expect(mocks.loadConnections).not.toHaveBeenCalled();
        expect(mocks.showAlert).not.toHaveBeenCalled();
    });

    it('removes the orphaned upload and reports the error when persisting fails', async () => {
        mocks.chooseConnectionIcon.mockResolvedValue('connection-icons/new.png');
        mocks.call.mockImplementation(async (command: string) => {
            if (command === 'set_connection_appearance') throw new Error('disk full');
        });
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.changeLogo'));

        await waitFor(() => {
            expect(mocks.showAlert).toHaveBeenCalledWith(
                expect.stringContaining('sidebar.failChangeLogo'),
                expect.objectContaining({kind: 'error'}),
            );
        });
        expect(mocks.call).toHaveBeenCalledWith('delete_connection_icon', {
            relativePath: 'connection-icons/new.png',
        });
        expect(mocks.loadConnections).not.toHaveBeenCalled();
    });

    it('reset removes the icon override and its file, keeping the accent color', async () => {
        mocks.connections = [
            savedConnection({
                appearance: {
                    accentColor: '#00ff00',
                    icon: {type: 'image', path: 'connection-icons/a.png'},
                },
            }),
        ];
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.resetLogo'));

        await waitFor(() => {
            expect(mocks.call).toHaveBeenCalledWith('set_connection_appearance', {
                id: CONNECTION_ID,
                appearance: {accentColor: '#00ff00'},
            });
        });
        expect(mocks.call).toHaveBeenCalledWith('delete_connection_icon', {
            relativePath: 'connection-icons/a.png',
        });
    });

    it('reset clears the whole appearance when nothing else is set', async () => {
        mocks.connections = [
            savedConnection({appearance: {icon: {type: 'image', path: 'connection-icons/a.png'}}}),
        ];
        const {container} = renderItem();
        openContextMenu(container);

        fireEvent.click(screen.getByText('sidebar.resetLogo'));

        await waitFor(() => {
            expect(mocks.call).toHaveBeenCalledWith('set_connection_appearance', {
                id: CONNECTION_ID,
                appearance: undefined,
            });
        });
    });
});
