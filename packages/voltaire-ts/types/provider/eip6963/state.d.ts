/**
 * Set listening state
 * @param {boolean} value
 */
export function setListening(value: boolean): void;
/**
 * Notify all listeners of current state
 */
export function notify(): void;
/**
 * Clear all state (for testing)
 */
export function reset(): void;
/**
 * Shared state for EIP-6963 provider discovery
 *
 * Module-scoped state for tracking discovered providers and listeners.
 *
 * @module provider/eip6963/state
 */
/**
 * Map of uuid -> ProviderDetail for deduplication
 * @type {Map<string, import('./types.js').ProviderDetailType>}
 */
export const providers: Map<string, import("./types.js").ProviderDetailType>;
/**
 * Set of listener functions
 * @type {Set<import('./types.js').ProviderListener>}
 */
export const listeners: Set<import("./types.js").ProviderListener>;
/**
 * Whether we're currently listening for announcements
 * @type {boolean}
 */
export let listening: boolean;
//# sourceMappingURL=state.d.ts.map