/**
 * Recover public key from signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {Uint8Array} Recovered public key (64 bytes)
 */
export function secp256k1RecoverPubkey(messageHash: Uint8Array, signature: Uint8Array): Uint8Array;
/**
 * Recover Ethereum address from signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {Uint8Array} Recovered address (20 bytes)
 */
export function secp256k1RecoverAddress(messageHash: Uint8Array, signature: Uint8Array): Uint8Array;
/**
 * Derive public key from private key
 * @param {Uint8Array} privateKey - Private key (32 bytes)
 * @returns {Uint8Array} Public key (64 bytes)
 */
export function secp256k1PubkeyFromPrivate(privateKey: Uint8Array): Uint8Array;
/**
 * Validate signature against public key
 * @param {Uint8Array} signature - 65-byte signature
 * @param {Uint8Array} messageHash - Hash of signed message
 * @param {Uint8Array} publicKey - Public key (64 bytes)
 * @returns {boolean} True if signature is valid
 */
export function secp256k1ValidateSignature(signature: Uint8Array, messageHash: Uint8Array, publicKey: Uint8Array): boolean;
/**
 * Normalize signature to low-s form
 * @param {Uint8Array} signature - 65-byte signature
 * @returns {Uint8Array} Normalized signature
 */
export function signatureNormalize(signature: Uint8Array): Uint8Array;
/**
 * Check if signature is in canonical form
 * @param {Uint8Array} signature - 65-byte signature
 * @returns {boolean} True if signature is canonical
 */
export function signatureIsCanonical(signature: Uint8Array): boolean;
/**
 * Parse signature from bytes
 * @param {Uint8Array} signature - 65-byte signature (r+s+v)
 * @returns {ParsedSignature} Parsed signature object
 */
export function signatureParse(signature: Uint8Array): ParsedSignature;
/**
 * Serialize signature to bytes
 * @param {ParsedSignature} signature - Parsed signature object
 * @returns {Uint8Array} 65-byte signature (r+s+v)
 */
export function signatureSerialize(signature: ParsedSignature): Uint8Array;
/**
 * ParsedSignature type
 */
export type ParsedSignature = {
    /**
     * - R component (32 bytes)
     */
    r: Uint8Array;
    /**
     * - S component (32 bytes)
     */
    s: Uint8Array;
    /**
     * - Recovery ID (0, 1, 27, or 28)
     */
    v: number;
};
/**
 * ParsedSignature type
 * @typedef {Object} ParsedSignature
 * @property {Uint8Array} r - R component (32 bytes)
 * @property {Uint8Array} s - S component (32 bytes)
 * @property {number} v - Recovery ID (0, 1, 27, or 28)
 */
export const ParsedSignature: undefined;
//# sourceMappingURL=signature.wasm.d.ts.map