// Export type definition
export type { PaymasterType } from "./PaymasterType.js";

// Import all functions
import { equals as _equals } from "./equals.js";
import { from } from "./from.js";
import { toHex as _toHex } from "./toHex.js";
import type { AddressType } from "../Address/AddressType.js";
import type { PaymasterType } from "./PaymasterType.js";

// Export constructors
export { from };

// Export public wrapper functions
export function toHex(
	paymaster: number | bigint | string | Uint8Array | AddressType,
): string {
	return _toHex(from(paymaster));
}

export function equals(
	paymaster1: number | bigint | string | Uint8Array | AddressType,
	paymaster2: number | bigint | string | Uint8Array | AddressType,
): boolean {
	return _equals(from(paymaster1), from(paymaster2));
}

// Export internal functions (tree-shakeable)
export { _toHex, _equals };

// Export as namespace (convenience)
export const Paymaster = {
	from,
	toHex,
	equals,
};
