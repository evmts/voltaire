/**
 * WASM bindings for Ethereum primitives
 * Uses WebAssembly bindings to Zig implementation for browser compatibility
 */
export { Address } from "./address.wasm.js";
export { Hash, keccak256, eip191HashMessage } from "./keccak.wasm.js";
export { type JumpDestination, analyzeJumpDestinations, isBytecodeBoundary, isValidJumpDest, validateBytecode, } from "./bytecode.wasm.js";
export { sha256, ripemd160, blake2b, solidityKeccak256, soliditySha256, } from "./hash.wasm.js";
export { hexToBytes, bytesToHex } from "./hex.wasm.js";
export { encodeBytes as rlpEncodeBytes, encodeUint as rlpEncodeUint, encodeUintFromBigInt as rlpEncodeUintFromBigInt, toHex as rlpToHex, fromHex as rlpFromHex, } from "./rlp.wasm.js";
export { type ParsedSignature, secp256k1RecoverPubkey, secp256k1RecoverAddress, secp256k1PubkeyFromPrivate, secp256k1ValidateSignature, signatureNormalize, signatureIsCanonical, signatureParse, signatureSerialize, } from "./signature.wasm.js";
export { TransactionType, detectTransactionType, } from "./transaction.wasm.js";
export { u256FromHex, u256ToHex, u256FromBigInt, u256ToBigInt, } from "./uint256.wasm.js";
export { generatePrivateKey, compressPublicKey } from "./wallet.wasm.js";
declare const _default: {
    Address: any;
    Hash: any;
    keccak256: any;
    eip191HashMessage: any;
    analyzeJumpDestinations: any;
    isBytecodeBoundary: any;
    isValidJumpDest: any;
    validateBytecode: any;
    sha256: any;
    ripemd160: any;
    blake2b: any;
    solidityKeccak256: any;
    soliditySha256: any;
    hexToBytes: any;
    bytesToHex: any;
    rlpEncodeBytes: any;
    rlpEncodeUint: any;
    rlpEncodeUintFromBigInt: any;
    rlpToHex: any;
    rlpFromHex: any;
    secp256k1RecoverPubkey: any;
    secp256k1RecoverAddress: any;
    secp256k1PubkeyFromPrivate: any;
    secp256k1ValidateSignature: any;
    signatureNormalize: any;
    signatureIsCanonical: any;
    signatureParse: any;
    signatureSerialize: any;
    TransactionType: any;
    detectTransactionType: any;
    u256FromHex: any;
    u256ToHex: any;
    u256FromBigInt: any;
    u256ToBigInt: any;
    generatePrivateKey: any;
    compressPublicKey: any;
};
export default _default;
//# sourceMappingURL=index.d.ts.map