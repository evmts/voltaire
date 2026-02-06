export * from "./constants.js";
export * from "./errors.js";
export * from "./types.js";
// Crypto dependencies
import { hash as keccak256 } from "../../crypto/Keccak256/hash.js";
import { recoverPublicKey } from "../../crypto/Secp256k1/recoverPublicKey.js";
import { sign as secp256k1Sign } from "../../crypto/Secp256k1/sign.js";
import { FromPublicKey } from "../Address/fromPublicKey.js";
import { encode as rlpEncode } from "../Rlp/encode.js";
// Create address factory with crypto dependencies
const addressFromPublicKey = FromPublicKey({ keccak256 });
// Import factory functions with proper types
import { Hash as HashFactory } from "./hash.js";
import { Sign as SignFactory } from "./sign.js";
import { Verify as VerifyFactory } from "./verify.js";
// Re-export typed factories (types are flexible for crypto deps)
export const Hash = HashFactory;
export const Sign = SignFactory;
export const Verify = VerifyFactory;
// Import other functions with proper types
import { calculateGasCost as calculateGasCostImpl } from "./calculateGasCost.js";
import { MAGIC_BYTE, PER_AUTH_BASE_COST, PER_EMPTY_ACCOUNT_COST, SECP256K1_HALF_N, SECP256K1_N, } from "./constants.js";
import { equalsAuth as equalsAuthImpl, equals as equalsImpl, } from "./equals.js";
import { format as formatImpl } from "./format.js";
import { getGasCost as getGasCostImpl } from "./getGasCost.js";
import { isItem as isItemImpl } from "./isItem.js";
import { isUnsigned as isUnsignedImpl } from "./isUnsigned.js";
import { process as processImpl } from "./process.js";
import { processAll as processAllImpl } from "./processAll.js";
import { validate as validateImpl } from "./validate.js";
// Typed function signatures
export const calculateGasCost = calculateGasCostImpl;
export const equals = equalsImpl;
export const equalsAuth = equalsAuthImpl;
export const format = formatImpl;
export const getGasCost = getGasCostImpl;
export const isItem = isItemImpl;
export const isUnsigned = isUnsignedImpl;
export const process = processImpl;
export const processAll = processAllImpl;
export const validate = validateImpl;
// Create wrapped functions with auto-injected crypto
const hash = Hash({
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    keccak256: keccak256,
    rlpEncode,
});
const verify = Verify({
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    keccak256: keccak256,
    rlpEncode,
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    recoverPublicKey: recoverPublicKey,
    addressFromPublicKey,
});
const sign = Sign({
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    keccak256: keccak256,
    rlpEncode,
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    sign: secp256k1Sign,
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    recoverPublicKey: recoverPublicKey,
    addressFromPublicKey,
});
// Export wrapped functions
export { hash, sign, verify };
// Namespace export
export const Authorization = {
    // Factories
    Hash,
    Verify,
    Sign,
    // Wrapped functions
    isItem,
    isUnsigned,
    validate,
    hash,
    sign,
    verify,
    calculateGasCost,
    getGasCost,
    process,
    processAll,
    format,
    equals,
    equalsAuth,
    // Constants
    MAGIC_BYTE,
    PER_AUTH_BASE_COST,
    PER_EMPTY_ACCOUNT_COST,
    SECP256K1_N,
    SECP256K1_HALF_N,
};
// Re-export WASM functions
export * from "./Authorization.wasm.js";
