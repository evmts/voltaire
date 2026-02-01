/**
 * Web3 Secret Storage Definition (v3) types
 * @see https://github.com/ethereum/wiki/wiki/Web3-Secret-Storage-Definition
 */
/**
 * Scrypt KDF parameters
 */
export type ScryptParams = {
    dklen: number;
    n: number;
    p: number;
    r: number;
    salt: string;
};
/**
 * PBKDF2 KDF parameters
 */
export type Pbkdf2Params = {
    c: number;
    dklen: number;
    prf: "hmac-sha256";
    salt: string;
};
/**
 * Web3 Secret Storage Definition v3 keystore
 */
export type KeystoreV3 = {
    version: 3;
    id: string;
    address?: string | undefined;
    crypto: {
        cipher: "aes-128-ctr";
        ciphertext: string;
        cipherparams: {
            iv: string;
        };
        kdf: "scrypt" | "pbkdf2";
        kdfparams: ScryptParams | Pbkdf2Params;
        mac: string;
    };
};
/**
 * Options for encryption
 */
export type EncryptOptions = {
    /** KDF to use (default: scrypt) */
    kdf?: "scrypt" | "pbkdf2" | undefined;
    /** Custom UUID (default: auto-generated) */
    uuid?: string | undefined;
    /** Custom IV (default: random 16 bytes) */
    iv?: Uint8Array | undefined;
    /** Custom salt (default: random 32 bytes) */
    salt?: Uint8Array | undefined;
    /** Scrypt N parameter (default: 262144) */
    scryptN?: number | undefined;
    /** Scrypt r parameter (default: 8) */
    scryptR?: number | undefined;
    /** Scrypt p parameter (default: 1) */
    scryptP?: number | undefined;
    /** PBKDF2 iterations (default: 262144) */
    pbkdf2C?: number | undefined;
    /** Include address in keystore (default: false) */
    includeAddress?: boolean | undefined;
};
//# sourceMappingURL=KeystoreType.d.ts.map