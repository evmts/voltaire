import { encode as encodeImpl } from "./encode.js";
import { from as fromImpl } from "./from.js";
import { hash as hashImpl } from "./hash.js";
import { validate as validateImpl } from "./validate.js";
export { encode as _encode } from "./encode.js";
export * from "./errors.js";
// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { hash as _hash } from "./hash.js";
export { validate as _validate } from "./validate.js";
// Public wrapper functions
export function from(typedData) {
    return fromImpl(typedData);
}
export function hash(typedData, crypto) {
    return hashImpl(typedData, crypto);
}
export function encode(typedData, crypto) {
    return encodeImpl(typedData, crypto);
}
export function validate(typedData) {
    validateImpl(typedData);
}
