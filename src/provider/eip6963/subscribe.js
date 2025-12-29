/**
 * Subscribe to wallet provider announcements
 *
 * Implements the dapp side of EIP-6963 discovery.
 *
 * @module provider/eip6963/subscribe
 */

import { InvalidArgumentError } from "./errors.js";
import { assertBrowser } from "./getPlatform.js";
import { ProviderDetail } from "./ProviderDetail.js";
import {
	providers,
	listeners,
	listening,
	setListening,
	notify,
} from "./state.js";

/**
 * Handle provider announcement event
 * @param {Event} event
 */
function handleAnnounce(event) {
	try {
		const customEvent = /** @type {CustomEvent} */ (event);
		if (!customEvent.detail) return;

		// Validate and freeze the detail
		const detail = ProviderDetail(customEvent.detail);

		// Store by uuid (deduplicate/update)
		providers.set(detail.info.uuid, detail);

		// Notify listeners
		notify();
	} catch {
		// Ignore malformed announcements (don't crash dapp)
		// Could log warning here if debug mode
	}
}

/**
 * Subscribe to wallet provider announcements
 *
 * Listens for EIP-6963 provider announcements and calls the listener
 * with the current list of discovered providers. Automatically handles
 * deduplication by UUID (same UUID updates existing entry).
 *
 * @param {import('./types.js').ProviderListener} listener - Called with providers array on each change
 * @returns {() => void} Unsubscribe function
 * @throws {UnsupportedEnvironmentError} If not in browser
 * @throws {InvalidArgumentError} If listener is not a function
 *
 * @example
 * ```typescript
 * import * as EIP6963 from '@voltaire/provider/eip6963';
 *
 * const unsubscribe = EIP6963.subscribe((providers) => {
 *   console.log('Discovered wallets:', providers.length);
 *
 *   for (const { info, provider } of providers) {
 *     console.log(`- ${info.name} (${info.rdns})`);
 *   }
 * });
 *
 * // Later, cleanup
 * unsubscribe();
 * ```
 */
export function subscribe(listener) {
	// Validate environment
	assertBrowser();

	// Validate listener
	if (typeof listener !== "function") {
		throw new InvalidArgumentError(
			"subscribe",
			"function",
			typeof listener,
		);
	}

	// Add listener
	listeners.add(listener);

	// Start listening if not already
	if (!listening) {
		window.addEventListener("eip6963:announceProvider", handleAnnounce);
		setListening(true);

		// Request providers to trigger announcements
		window.dispatchEvent(new Event("eip6963:requestProvider"));
	}

	// Call listener immediately with current state
	listener([...providers.values()]);

	// Return unsubscribe function
	return () => {
		listeners.delete(listener);

		// Stop listening when all unsubscribed
		if (listeners.size === 0 && listening) {
			window.removeEventListener("eip6963:announceProvider", handleAnnounce);
			setListening(false);
		}
	};
}
