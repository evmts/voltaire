import { equals as equalsImpl } from "./equals.js";
import { from as fromImpl } from "./from.js";
import { fromBytes as fromBytesImpl } from "./fromBytes.js";
import { fromHex as fromHexImpl } from "./fromHex.js";
import { toHex as toHexImpl } from "./toHex.js";
export { SIZE } from "./DomainSeparatorType.js";
export { equals as _equals } from "./equals.js";
export * from "./errors.js";
// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { fromBytes as _fromBytes } from "./fromBytes.js";
export { fromHex as _fromHex } from "./fromHex.js";
export { toHex as _toHex } from "./toHex.js";
// Public wrapper functions (auto-convert inputs)
export function from(value) {
    return fromImpl(value);
}
export function fromBytes(bytes) {
    return fromBytesImpl(bytes);
}
export function fromHex(hex) {
    return fromHexImpl(hex);
}
export function toHex(separator) {
    return toHexImpl(separator);
}
export function equals(a, b) {
    return equalsImpl(a, b);
}
