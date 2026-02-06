/**
 * Detect the current platform
 *
 * @returns {'browser' | 'node' | 'bun' | 'worker' | 'unknown'} The detected platform
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const platform = EIP6963.getPlatform();
 * if (platform === 'browser') {
 *   // Safe to use EIP-6963
 * }
 * ```
 */
export function getPlatform(): "browser" | "node" | "bun" | "worker" | "unknown";
/**
 * Assert that we're in a browser environment
 *
 * @throws {UnsupportedEnvironmentError} If not in browser
 *
 * @example
 * ```typescript
 * import { assertBrowser } from '@voltaire/provider/eip6963';
 *
 * assertBrowser(); // Throws if not in browser
 * ```
 */
export function assertBrowser(): void;
//# sourceMappingURL=getPlatform.d.ts.map