import { equals as _equals } from "./equals.js";
import { extractRuntime as _extractRuntime } from "./extractRuntime.js";
import { from } from "./from.js";
import { fromHex } from "./fromHex.js";
import { hasMetadata as _hasMetadata } from "./hasMetadata.js";
import { stripMetadata as _stripMetadata } from "./stripMetadata.js";
import { toHex as _toHex } from "./toHex.js";

// Re-export types
export type * from "./ContractCodeType.js";

// Export internal functions
export { _equals, _extractRuntime, _hasMetadata, _stripMetadata, _toHex };

// Export factory functions
export { from, fromHex };

// Wrapper exports
export function equals(
	a: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
	b: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
): boolean {
	return _equals(from(a), from(b));
}

export function toHex(
	value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
): import("../Hex/HexType.js").HexType {
	return _toHex(from(value));
}

export function hasMetadata(
	value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
): boolean {
	return _hasMetadata(from(value));
}

export function stripMetadata(
	value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType {
	return _stripMetadata(from(value));
}

export function extractRuntime(
	value: import("./ContractCodeType.js").ContractCodeType | string | Uint8Array,
): import("../RuntimeCode/RuntimeCodeType.js").RuntimeCodeType {
	return _extractRuntime(from(value));
}
