export * from "./EventSignatureType.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromSignature as _fromSignature } from "./fromSignature.js";
import { toHex as _toHex } from "./toHex.js";
// Export typed versions
export const equals = _equals;
export const from = _from;
export const fromHex = _fromHex;
export const fromSignature = _fromSignature;
export const toHex = _toHex;
// Namespace export
export const EventSignature = {
    from,
    fromHex,
    fromSignature,
    toHex,
    equals,
};
