import { equals as equalsImpl } from "./equals.js";
import { from as fromImpl } from "./from.js";
import { fromBytes as fromBytesImpl } from "./fromBytes.js";
import { fromHex as fromHexImpl } from "./fromHex.js";
import { toHex as toHexImpl } from "./toHex.js";

export type { DomainSeparatorType } from "./DomainSeparatorType.js";
export { SIZE } from "./DomainSeparatorType.js";
export { equals as _equals } from "./equals.js";
export * from "./errors.js";
// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { toHex as _toHex } from "./toHex.js";

// Public wrapper functions (auto-convert inputs)
export function from(
	value: string | Uint8Array,
): import("./DomainSeparatorType.js").DomainSeparatorType {
	return fromImpl(value);
}

export function fromBytes(
	bytes: Uint8Array,
): import("./DomainSeparatorType.js").DomainSeparatorType {
	return fromBytesImpl(bytes);
}

export function fromHex(
	hex: string,
): import("./DomainSeparatorType.js").DomainSeparatorType {
	return fromHexImpl(hex);
}

export function toHex(
	separator: import("./DomainSeparatorType.js").DomainSeparatorType,
): string {
	return toHexImpl(separator);
}

export function equals(
	a: import("./DomainSeparatorType.js").DomainSeparatorType,
	b: import("./DomainSeparatorType.js").DomainSeparatorType,
): boolean {
	return equalsImpl(a, b);
}
