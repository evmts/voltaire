/**
 * WASM implementation of Ethereum Address type
 * Uses WebAssembly bindings to Zig implementation
 */
/**
 * Ethereum address (20 bytes)
 * Implemented using WASM Zig code
 */
export declare class Address {
    private readonly bytes;
    private constructor();
    /**
     * Create address from hex string (with or without 0x prefix)
     * @param hex - Hex string representation
     * @returns Address instance
     */
    static fromHex(hex: string): Address;
    /**
     * Create address from 20-byte buffer
     * @param bytes - 20-byte buffer
     * @returns Address instance
     */
    static fromBytes(bytes: Uint8Array): Address;
    /**
     * Convert address to hex string (42 chars: "0x" + 40 hex)
     * @returns Lowercase hex string with 0x prefix
     */
    toHex(): string;
    /**
     * Convert address to EIP-55 checksummed hex string
     * @returns Mixed-case checksummed hex string
     */
    toChecksumHex(): string;
    /**
     * Check if this is the zero address (0x0000...0000)
     * @returns true if zero address
     */
    isZero(): boolean;
    /**
     * Compare with another address for equality
     * @param other - Address to compare with
     * @returns true if addresses are equal
     */
    equals(other: Address): boolean;
    /**
     * Validate EIP-55 checksum of a hex string
     * @param hex - Hex string to validate
     * @returns true if checksum is valid
     */
    static validateChecksum(hex: string): boolean;
    /**
     * Calculate CREATE contract address (from sender and nonce)
     * @param sender - Deployer address
     * @param nonce - Account nonce
     * @returns Computed contract address
     */
    static calculateCreateAddress(sender: Address, nonce: number): Address;
    /**
     * Calculate CREATE2 contract address
     * @param sender - Deployer address
     * @param salt - 32-byte salt
     * @param initCode - Contract initialization code
     * @returns Computed contract address
     */
    static calculateCreate2Address(sender: Address, salt: Uint8Array, initCode: Uint8Array): Address;
    /**
     * Get raw bytes
     * @returns 20-byte Uint8Array
     */
    toBytes(): Uint8Array;
    /**
     * String representation (checksummed hex)
     * @returns Checksummed hex string
     */
    toString(): string;
}
export default Address;
//# sourceMappingURL=address.wasm.d.ts.map