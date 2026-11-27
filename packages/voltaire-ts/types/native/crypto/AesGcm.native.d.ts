/**
 * AES-GCM synchronous native bindings using Zig C ABI (Bun FFI / Node-API),
 * paired with full WebCrypto-compatible AesGcm namespace parity.
 */
/**
 * Encrypt raw bytes synchronously with AES-128-GCM or AES-256-GCM via native Zig FFI.
 * Output format: `ciphertext || 16-byte authentication tag`.
 */
export declare function encryptRawSync(plaintext: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array): Uint8Array;
/**
 * Decrypt raw bytes synchronously with AES-128-GCM or AES-256-GCM via native Zig FFI.
 * Input format: `ciphertext || 16-byte authentication tag`.
 */
export declare function decryptRawSync(ciphertext: Uint8Array, key: Uint8Array, nonce: Uint8Array, additionalData?: Uint8Array): Uint8Array;
export declare const AesGcm: {
    encryptRawSync: typeof encryptRawSync;
    decryptRawSync: typeof decryptRawSync;
    generateKey: typeof import("../../crypto/AesGcm/generateKey.js").generateKey;
    importKey: typeof import("../../crypto/AesGcm/importKey.js").importKey;
    exportKey: typeof import("../../crypto/AesGcm/exportKey.js").exportKey;
    encrypt: typeof import("../../crypto/AesGcm/encrypt.js").encrypt;
    decrypt: typeof import("../../crypto/AesGcm/decrypt.js").decrypt;
    generateNonce: typeof import("../../crypto/AesGcm/generateNonce.js").generateNonce;
    deriveKey: typeof import("../../crypto/AesGcm/deriveKey.js").deriveKey;
    AES128_KEY_SIZE: number;
    AES256_KEY_SIZE: number;
    NONCE_SIZE: number;
    TAG_SIZE: number;
};
//# sourceMappingURL=AesGcm.native.d.ts.map