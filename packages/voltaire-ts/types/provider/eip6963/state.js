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
export const providers = new Map();
/**
 * Set of listener functions
 * @type {Set<import('./types.js').ProviderListener>}
 */
export const listeners = new Set();
/**
 * Whether we're currently listening for announcements
 * @type {boolean}
 */
export let listening = false;
/**
 * Set listening state
 * @param {boolean} value
 */
export function setListening(value) {
    listening = value;
}
/**
 * Notify all listeners of current state
 */
export function notify() {
    const snapshot = [...providers.values()];
    for (const listener of listeners) {
        try {
            listener(snapshot);
        }
        catch {
            // Ignore listener errors
        }
    }
}
/**
 * Clear all state (for testing)
 */
export function reset() {
    providers.clear();
    listeners.clear();
    listening = false;
}
