/**
 * WASM EIP-712 Structured Data Signing
 *
 * WASM-accelerated implementation using Keccak256Wasm and Secp256k1Wasm.
 * Provides identical interface to the Noble-based implementation.
 *
 * @example
 * ```typescript
 * import { Eip712Wasm } from './eip712.wasm.js';
 *
 * // Initialize WASM
 * await Eip712Wasm.init();
 *
 * // Sign typed data
 * const signature = Eip712Wasm.signTypedData(typedData, privateKey);
 * ```
 */
import type { AddressType as BrandedAddress } from "../primitives/Address/AddressType.js";
import type { HashType } from "../primitives/Hash/index.js";
import type { Domain, Message, TypeDefinitions, TypedData } from "./EIP712/index.js";
import { Eip712EncodingError, Eip712Error, Eip712InvalidMessageError, Eip712TypeNotFoundError } from "./EIP712/index.js";
import { Secp256k1Wasm } from "./secp256k1.wasm.js";
export { Eip712Error, Eip712EncodingError, Eip712TypeNotFoundError, Eip712InvalidMessageError, };
export declare namespace Eip712Wasm {
    type Signature = Secp256k1Wasm.Signature;
    type Types = TypeDefinitions;
    namespace Domain {
        /**
         * Hash domain separator
         *
         * @param domain - Domain separator fields
         * @returns 32-byte domain hash
         */
        function hash(domain: Domain): HashType;
    }
    /**
     * Encode type string (e.g., "Mail(Person from,Person to,string contents)")
     *
     * @param primaryType - Name of primary type
     * @param types - Type definitions
     * @returns Type encoding string
     */
    function encodeType(primaryType: string, types: Types): string;
    /**
     * Hash type string
     *
     * @param primaryType - Name of primary type
     * @param types - Type definitions
     * @returns 32-byte type hash
     */
    function hashType(primaryType: string, types: Types): HashType;
    /**
     * Encode single value
     *
     * @param type - Solidity type string
     * @param value - Value to encode
     * @param types - Type definitions (for structs)
     * @returns 32-byte encoded value
     */
    function encodeValue(type: string, value: unknown, types: Types): Uint8Array;
    /**
     * Encode data for struct
     *
     * @param primaryType - Name of struct type
     * @param message - Message data
     * @param types - Type definitions
     * @returns Encoded data
     */
    function encodeData(primaryType: string, message: Message, types: Types): Uint8Array;
    /**
     * Hash struct
     *
     * @param primaryType - Name of struct type
     * @param message - Message data
     * @param types - Type definitions
     * @returns 32-byte struct hash
     */
    function hashStruct(primaryType: string, message: Message, types: Types): HashType;
    /**
     * Hash typed data (EIP-712 signing hash)
     *
     * @param typedData - Complete typed data structure
     * @returns 32-byte hash ready for signing
     */
    function hashTypedData(typedData: TypedData): HashType;
    /**
     * Sign typed data with private key
     *
     * @param typedData - Typed data to sign
     * @param privateKey - 32-byte private key
     * @returns Signature (r, s, v)
     */
    function signTypedData(typedData: TypedData, privateKey: Uint8Array): Signature;
    /**
     * Recover signer address from signature
     *
     * @param signature - Signature to recover from
     * @param typedData - Typed data that was signed
     * @returns Recovered address
     */
    function recoverAddress(signature: Signature, typedData: TypedData): BrandedAddress;
    /**
     * Verify typed data signature against address
     *
     * @param signature - Signature to verify
     * @param typedData - Typed data that was signed
     * @param address - Expected signer address
     * @returns True if signature is valid
     */
    function verifyTypedData(signature: Signature, typedData: TypedData, address: BrandedAddress): boolean;
    /**
     * Validate typed data structure
     */
    function validate(typedData: TypedData): boolean;
    /**
     * Format typed data for display
     */
    function format(typedData: TypedData): string;
    /**
     * Initialize WASM modules
     *
     * Must be called before using any Eip712Wasm functions.
     */
    function init(): Promise<void>;
}
export default Eip712Wasm;
//# sourceMappingURL=eip712.wasm.d.ts.map