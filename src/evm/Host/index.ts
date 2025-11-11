// Type exports
export type { BrandedHost } from "./BrandedHost.js";

// Internal exports
export { from as _from } from "./from.js";
export { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";

// Re-export as Host namespace
import type { BrandedHost } from "./BrandedHost.js";
import { from as _from } from "./from.js";
import { createMemoryHost as _createMemoryHost } from "./createMemoryHost.js";

/**
 * Host namespace - EVM host interface for external state
 *
 * Based on guillotine-mini HostInterface architecture.
 */
export const Host = {
	from: _from,
	createMemoryHost: _createMemoryHost,
} as const;
