// Export type definition

// Export constants
export { ENTRYPOINT_V06, ENTRYPOINT_V07 } from "./constants.js";
export type { EntryPointType } from "./EntryPointType.js";

import type { AddressType } from "../Address/AddressType.js";
// Import all functions
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toHex(
	entryPoint: number | bigint | string | Uint8Array | AddressType,
): string {
	return _toHex(from(entryPoint));
}

export function equals(
	entryPoint1: number | bigint | string | Uint8Array | AddressType,
	entryPoint2: number | bigint | string | Uint8Array | AddressType,
): boolean {
	return _equals(from(entryPoint1), from(entryPoint2));
}

// Export internal functions (tree-shakeable)
export { _toHex, _equals };

// Export as namespace (convenience)
export const EntryPoint = {
	from,
	toHex,
	equals,
};
