import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";

// Re-export types
export type * from "./RuntimeCodeType.js";

// Export internal functions
export { _equals, _toHex };

// Export factory functions
export { from, fromHex };

// Wrapper exports
export function equals(
	a: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array,
	b: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array,
): boolean {
	return _equals(from(a), from(b));
}

export function toHex(
	value: import("./RuntimeCodeType.js").RuntimeCodeType | string | Uint8Array,
): import("../Hex/HexType.js").HexType {
	return _toHex(from(value));
}
