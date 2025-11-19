// Export type definition
export type { BundlerType } from "./BundlerType.js";

// Import all functions
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
import type { AddressType } from "../Address/AddressType.js";
import type { BundlerType } from "./BundlerType.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toHex(
	bundler: number | bigint | string | Uint8Array | AddressType,
): string {
	return _toHex(from(bundler));
}

export function equals(
	bundler1: number | bigint | string | Uint8Array | AddressType,
	bundler2: number | bigint | string | Uint8Array | AddressType,
): boolean {
	return _equals(from(bundler1), from(bundler2));
}

// Export internal functions (tree-shakeable)
export { _toHex, _equals };

// Export as namespace (convenience)
export const Bundler = {
	from,
	toHex,
	equals,
};
