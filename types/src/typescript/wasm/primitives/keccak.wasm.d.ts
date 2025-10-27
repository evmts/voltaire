/**
 * WASM implementation of Keccak-256 hashing
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Keccak-256 hash (32 bytes)
 */
export declare class Hash {
    private readonly bytes;
    private constructor();
    /**
     * Compute Keccak-256 hash of input data
     * @param data - Input data (string, Uint8Array, or Buffer)
     * @returns Hash instance
     */
    static keccak256(data: string | Uint8Array): Hash;
    /**
     * Create hash from hex string
     * @param hex - 32-byte hex string (with or without 0x prefix)
     * @returns Hash instance
     */
    static fromHex(hex: string): Hash;
    /**
     * Create hash from 32-byte buffer
     * @param bytes - 32-byte buffer
     * @returns Hash instance
     */
    static fromBytes(bytes: Uint8Array): Hash;
    /**
     * Convert hash to hex string (66 chars: "0x" + 64 hex)
     * @returns Hex string with 0x prefix
     */
    toHex(): string;
    /**
     * Compare with another hash for equality (constant-time)
     * @param other - Hash to compare with
     * @returns true if hashes are equal
     */
    equals(other: Hash): boolean;
    /**
     * Get raw bytes
     * @returns 32-byte Uint8Array
     */
    toBytes(): Uint8Array;
    /**
     * String representation (hex)
     * @returns Hex string with 0x prefix
     */
    toString(): string;
}
/**
 * Compute Keccak-256 hash and return as hex string
 * @param data - Input data
 * @returns Hex hash string
 */
export declare function keccak256(data: string | Uint8Array): string;
/**
 * Compute EIP-191 personal message hash
 * Prepends "\x19Ethereum Signed Message:\n{length}" to message
 * @param message - Message to hash
 * @returns Hash of formatted message
 */
export declare function eip191HashMessage(message: string | Uint8Array): Hash;
export default Hash;
//# sourceMappingURL=keccak.wasm.d.ts.map