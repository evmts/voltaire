import { encodeData as encodeDataImpl } from "./encodeData.js";
import { encodeType as encodeTypeImpl } from "./encodeType.js";
import { encodeValue as encodeValueImpl } from "./encodeValue.js";
import { from as fromImpl } from "./from.js";
import { getEIP712DomainType as getEIP712DomainTypeImpl } from "./getEIP712DomainType.js";
import { getFieldsBitmap as getFieldsBitmapImpl } from "./getFieldsBitmap.js";
import { hashType as hashTypeImpl } from "./hashType.js";
import { toErc5267Response as toErc5267ResponseImpl } from "./toErc5267Response.js";
import { toHash as toHashImpl } from "./toHash.js";
export { ERC5267_FIELDS } from "./ERC5267Type.js";
export { encodeData as _encodeData } from "./encodeData.js";
export { encodeType as _encodeType } from "./encodeType.js";
export { encodeValue as _encodeValue } from "./encodeValue.js";
export * from "./errors.js";
// Internal exports (prefixed with _)
export { from as _from } from "./from.js";
export { getEIP712DomainType as _getEIP712DomainType } from "./getEIP712DomainType.js";
export { getFieldsBitmap as _getFieldsBitmap } from "./getFieldsBitmap.js";
export { hashType as _hashType } from "./hashType.js";
export { toErc5267Response as _toErc5267Response } from "./toErc5267Response.js";
export { toHash as _toHash } from "./toHash.js";
// Public wrapper functions
export function from(domain) {
    return fromImpl(domain);
}
export function toHash(domain, crypto) {
    return toHashImpl(domain, crypto);
}
export function encodeData(primaryType, 
// biome-ignore lint/suspicious/noExplicitAny: EIP-712 data is dynamically typed based on primaryType
data, types, crypto) {
    return encodeDataImpl(primaryType, data, types, crypto);
}
export function encodeType(primaryType, types) {
    return encodeTypeImpl(primaryType, types);
}
export function encodeValue(type, 
// biome-ignore lint/suspicious/noExplicitAny: EIP-712 values are dynamically typed based on type parameter
value, types, crypto) {
    return encodeValueImpl(type, value, types, crypto);
}
export function hashType(primaryType, types, crypto) {
    return hashTypeImpl(primaryType, types, crypto);
}
export function getEIP712DomainType(domain) {
    return getEIP712DomainTypeImpl(domain);
}
export function getFieldsBitmap(domain) {
    return getFieldsBitmapImpl(domain);
}
export function toErc5267Response(domain) {
    return toErc5267ResponseImpl(domain);
}
