/**
 * WASM implementation of signature operations (secp256k1)
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Parsed ECDSA signature components
 */
export interface ParsedSignature {
    /** R component (32 bytes) */
    r: Uint8Array;
    /** S component (32 bytes) */
    s: Uint8Array;
    /** V recovery parameter (1 byte) */
    v: number;
}
/**
 * Recover public key from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1RecoverPubkey(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): Uint8Array;
/**
 * Recover Ethereum address from ECDSA signature
 * @param messageHash - 32-byte message hash
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @param v - Recovery parameter (0-3)
 * @returns Ethereum address (20 bytes)
 */
export declare function secp256k1RecoverAddress(messageHash: Uint8Array, r: Uint8Array, s: Uint8Array, v: number): Uint8Array;
/**
 * Derive public key from private key using secp256k1
 * @param privateKey - 32-byte private key
 * @returns Uncompressed public key (64 bytes)
 */
export declare function secp256k1PubkeyFromPrivate(privateKey: Uint8Array): Uint8Array;
/**
 * Validate ECDSA signature components (r, s)
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @returns true if signature is valid
 */
export declare function secp256k1ValidateSignature(r: Uint8Array, s: Uint8Array): boolean;
/**
 * Normalize signature to low-S form (EIP-2)
 * Modifies signature components to ensure s is in the lower half of the curve order
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @returns Normalized [r, s] components
 */
export declare function signatureNormalize(r: Uint8Array, s: Uint8Array): [Uint8Array, Uint8Array];
/**
 * Check if signature is in canonical form (low-S)
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @returns true if signature is canonical
 */
export declare function signatureIsCanonical(r: Uint8Array, s: Uint8Array): boolean;
/**
 * Parse signature from compact or standard format
 * @param sigData - Signature bytes (64 or 65 bytes)
 * @returns Parsed signature components
 */
export declare function signatureParse(sigData: Uint8Array): ParsedSignature;
/**
 * Serialize signature components to compact format
 * @param r - R component of signature (32 bytes)
 * @param s - S component of signature (32 bytes)
 * @param v - Recovery parameter
 * @param includeV - Whether to include v byte (65 bytes) or not (64 bytes)
 * @returns Serialized signature
 */
export declare function signatureSerialize(r: Uint8Array, s: Uint8Array, v: number, includeV?: boolean): Uint8Array;
declare const _default: {
    secp256k1RecoverPubkey: typeof secp256k1RecoverPubkey;
    secp256k1RecoverAddress: typeof secp256k1RecoverAddress;
    secp256k1PubkeyFromPrivate: typeof secp256k1PubkeyFromPrivate;
    secp256k1ValidateSignature: typeof secp256k1ValidateSignature;
    signatureNormalize: typeof signatureNormalize;
    signatureIsCanonical: typeof signatureIsCanonical;
    signatureParse: typeof signatureParse;
    signatureSerialize: typeof signatureSerialize;
};
export default _default;
//# sourceMappingURL=signature.wasm.d.ts.map