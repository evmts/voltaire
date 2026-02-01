import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { parseSignature as _parseSignature } from "./parseSignature.js";
import { toHex as _toHex } from "./toHex.js";
// Type-safe wrappers
export function equals(a, b) {
    return _equals(a, b);
}
export function from(value) {
    return _from(value);
}
export function fromSignature(signature) {
    return _fromSignature(signature);
}
export function parseSignature(signature) {
    return _parseSignature(signature);
}
export function toHex(functionSig) {
    return _toHex(functionSig);
}
// Namespace export
export const FunctionSignature = {
    from,
    fromSignature,
    toHex,
    equals,
    parseSignature,
};
