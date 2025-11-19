import { equals as _equals } from "./equals.js";
import { estimateGas as _estimateGas } from "./estimateGas.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { toHex as _toHex } from "./toHex.js";

// Re-export types
export type * from "./InitCodeType.js";

// Export internal functions
export { _equals, _estimateGas, _extractRuntime, _toHex };

// Export factory functions
export { from, fromHex };

// Wrapper exports
export function equals(
	a: import("./InitCodeType.js").InitCodeType | string | Uint8Array,
	b: import("./InitCodeType.js").InitCodeType | string | Uint8Array,
): boolean {
	return _equals(from(a), from(b));
}

export function toHex(
	value: import("./InitCodeType.js").InitCodeType | string | Uint8Array,
): import("../Hex/HexType.js").HexType {
	return _toHex(from(value));
}

export function extractRuntime(
	value: import("./InitCodeType.js").InitCodeType | string | Uint8Array,
	offset: number,
): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType {
	return _extractRuntime(from(value), offset);
}

export function estimateGas(
	value: import("./InitCodeType.js").InitCodeType | string | Uint8Array,
): bigint {
	return _estimateGas(from(value));
}
