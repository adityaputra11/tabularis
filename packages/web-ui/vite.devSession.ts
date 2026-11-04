import {readFileSync} from 'node:fs';
import type {IncomingMessage, ServerResponse} from 'node:http';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import type {Plugin} from 'vite';

/**
 * Dev-only session stub for `vite` (`pnpm dev`).
 *
 * Browser boot always negotiates a session (`GET /api/v1/session`), but the
 * Vite dev server has no Rust backend, so boot died with
 * "Session negotiation failed with HTTP 404". This middleware answers that
 * one endpoint with a minimal local-admin session so the app renders and UI
 * work gets HMR. Everything else (`/api/.../rpc/...`, events, uploads)
 * still needs the real backend — run `pnpm dev:web` for that.
 *
 * Never ships: `apply: 'serve'` keeps it out of `vite build` and preview.
 */
const SESSION_PATH = '/api/v1/session';

function readDevServerVersion(): string {
    try {
        const pkg = JSON.parse(
            readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'package.json'), 'utf8'),
        ) as {version?: unknown};
        if (typeof pkg.version === 'string' && pkg.version.length > 0) return pkg.version;
    } catch {
        // Fall through to the placeholder below.
    }
    return '0.0.0-vite-dev';
}

export function devSessionStub(): Plugin {
    const serverVersion = readDevServerVersion();
    return {
        name: 'tabularis-dev-session',
        apply: 'serve',
        configureServer(server) {
            server.middlewares.use(
                SESSION_PATH,
                (req: IncomingMessage, res: ServerResponse, next: () => void) => {
                    if (req.method !== 'GET') {
                        next();
                        return;
                    }
                    res.statusCode = 200;
                    res.setHeader('content-type', 'application/json');
                    res.setHeader('x-request-id', 'vite-dev-session');
                    res.end(
                        JSON.stringify({
                            apiVersion: 'v1',
                            serverVersion,
                            serverBuild: {target: 'vite-dev', profile: 'debug', commit: null},
                            authenticated: true,
                            csrfToken: 'vite-dev-csrf-token',
                            access: {
                                remote: false,
                                authorizationLevel: 'local-admin',
                                highRiskCapabilities: false,
                            },
                            capabilities: {
                                rpc: true,
                                events: false,
                                uploads: false,
                                downloads: false,
                                pluginAssets: false,
                                mcpHostConfiguration: false,
                                serverFileBrowser: false,
                                nativeUpdater: false,
                            },
                            queryResponsePolicy: {
                                maxRowsPerPage: 1000,
                                maxResponseBytes: 8388608,
                                streaming: false,
                            },
                        }),
                    );
                },
            );
        },
    };
}
