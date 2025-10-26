/**
 * WASM bindings for Ethereum primitives
 * Uses WebAssembly bindings to Zig implementation for browser compatibility
 */
import { Address as AddressClass } from "./address.wasm.js";
import { Hash as HashClass, keccak256 as keccak256Fn, eip191HashMessage as eip191HashMessageFn } from "./keccak.wasm.js";
import { type JumpDestination, analyzeJumpDestinations as analyzeJumpDestinationsFn, isBytecodeBoundary as isBytecodeBoundaryFn, isValidJumpDest as isValidJumpDestFn, validateBytecode as validateBytecodeFn } from "./bytecode.wasm.js";
import { sha256 as sha256Fn, ripemd160 as ripemd160Fn, blake2b as blake2bFn, solidityKeccak256 as solidityKeccak256Fn, soliditySha256 as soliditySha256Fn } from "./hash.wasm.js";
import { hexToBytes as hexToBytesFn, bytesToHex as bytesToHexFn } from "./hex.wasm.js";
import { encodeBytes as rlpEncodeBytesFn, encodeUint as rlpEncodeUintFn, encodeUintFromBigInt as rlpEncodeUintFromBigIntFn, toHex as rlpToHexFn, fromHex as rlpFromHexFn } from "./rlp.wasm.js";
import { type ParsedSignature, secp256k1RecoverPubkey as secp256k1RecoverPubkeyFn, secp256k1RecoverAddress as secp256k1RecoverAddressFn, secp256k1PubkeyFromPrivate as secp256k1PubkeyFromPrivateFn, secp256k1ValidateSignature as secp256k1ValidateSignatureFn, signatureNormalize as signatureNormalizeFn, signatureIsCanonical as signatureIsCanonicalFn, signatureParse as signatureParseFn, signatureSerialize as signatureSerializeFn } from "./signature.wasm.js";
import { TransactionType as TransactionTypeEnum, detectTransactionType as detectTransactionTypeFn } from "./transaction.wasm.js";
import { u256FromHex as u256FromHexFn, u256ToHex as u256ToHexFn, u256FromBigInt as u256FromBigIntFn, u256ToBigInt as u256ToBigIntFn } from "./uint256.wasm.js";
import { generatePrivateKey as generatePrivateKeyFn, compressPublicKey as compressPublicKeyFn } from "./wallet.wasm.js";
export { AddressClass as Address };
export { HashClass as Hash, keccak256Fn as keccak256, eip191HashMessageFn as eip191HashMessage };
export { type JumpDestination, analyzeJumpDestinationsFn as analyzeJumpDestinations, isBytecodeBoundaryFn as isBytecodeBoundary, isValidJumpDestFn as isValidJumpDest, validateBytecodeFn as validateBytecode };
export { sha256Fn as sha256, ripemd160Fn as ripemd160, blake2bFn as blake2b, solidityKeccak256Fn as solidityKeccak256, soliditySha256Fn as soliditySha256 };
export { hexToBytesFn as hexToBytes, bytesToHexFn as bytesToHex };
export { rlpEncodeBytesFn as rlpEncodeBytes, rlpEncodeUintFn as rlpEncodeUint, rlpEncodeUintFromBigIntFn as rlpEncodeUintFromBigInt, rlpToHexFn as rlpToHex, rlpFromHexFn as rlpFromHex };
export { type ParsedSignature, secp256k1RecoverPubkeyFn as secp256k1RecoverPubkey, secp256k1RecoverAddressFn as secp256k1RecoverAddress, secp256k1PubkeyFromPrivateFn as secp256k1PubkeyFromPrivate, secp256k1ValidateSignatureFn as secp256k1ValidateSignature, signatureNormalizeFn as signatureNormalize, signatureIsCanonicalFn as signatureIsCanonical, signatureParseFn as signatureParse, signatureSerializeFn as signatureSerialize };
export { TransactionTypeEnum as TransactionType, detectTransactionTypeFn as detectTransactionType };
export { u256FromHexFn as u256FromHex, u256ToHexFn as u256ToHex, u256FromBigIntFn as u256FromBigInt, u256ToBigIntFn as u256ToBigInt };
export { generatePrivateKeyFn as generatePrivateKey, compressPublicKeyFn as compressPublicKey };
declare const _default: {
    Address: typeof AddressClass;
    Hash: typeof HashClass;
    keccak256: typeof keccak256Fn;
    eip191HashMessage: typeof eip191HashMessageFn;
    analyzeJumpDestinations: typeof analyzeJumpDestinationsFn;
    isBytecodeBoundary: typeof isBytecodeBoundaryFn;
    isValidJumpDest: typeof isValidJumpDestFn;
    validateBytecode: typeof validateBytecodeFn;
    sha256: typeof sha256Fn;
    ripemd160: typeof ripemd160Fn;
    blake2b: typeof blake2bFn;
    solidityKeccak256: typeof solidityKeccak256Fn;
    soliditySha256: typeof soliditySha256Fn;
    hexToBytes: typeof hexToBytesFn;
    bytesToHex: typeof bytesToHexFn;
    rlpEncodeBytes: typeof rlpEncodeBytesFn;
    rlpEncodeUint: typeof rlpEncodeUintFn;
    rlpEncodeUintFromBigInt: typeof rlpEncodeUintFromBigIntFn;
    rlpToHex: typeof rlpToHexFn;
    rlpFromHex: typeof rlpFromHexFn;
    secp256k1RecoverPubkey: typeof secp256k1RecoverPubkeyFn;
    secp256k1RecoverAddress: typeof secp256k1RecoverAddressFn;
    secp256k1PubkeyFromPrivate: typeof secp256k1PubkeyFromPrivateFn;
    secp256k1ValidateSignature: typeof secp256k1ValidateSignatureFn;
    signatureNormalize: typeof signatureNormalizeFn;
    signatureIsCanonical: typeof signatureIsCanonicalFn;
    signatureParse: typeof signatureParseFn;
    signatureSerialize: typeof signatureSerializeFn;
    TransactionType: typeof TransactionTypeEnum;
    detectTransactionType: typeof detectTransactionTypeFn;
    u256FromHex: typeof u256FromHexFn;
    u256ToHex: typeof u256ToHexFn;
    u256FromBigInt: typeof u256FromBigIntFn;
    u256ToBigInt: typeof u256ToBigIntFn;
    generatePrivateKey: typeof generatePrivateKeyFn;
    compressPublicKey: typeof compressPublicKeyFn;
};
export default _default;
//# sourceMappingURL=index.d.ts.map