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
import { Eip712EncodingError, Eip712Error, Eip712InvalidMessageError, Eip712TypeNotFoundError, } from "./EIP712/index.js";
import { Keccak256Wasm } from "./keccak256.wasm.js";
import { Secp256k1Wasm } from "./secp256k1.wasm.js";
// Re-export error types
export { Eip712Error, Eip712EncodingError, Eip712TypeNotFoundError, Eip712InvalidMessageError, };
// ============================================================================
// Main Eip712Wasm Namespace
// ============================================================================
export var Eip712Wasm;
(function (Eip712Wasm) {
    // ==========================================================================
    // Core Types (same as Noble implementation)
    // ==========================================================================
    // ==========================================================================
    // Domain Operations
    // ==========================================================================
    let Domain;
    (function (Domain) {
        /**
         * Hash domain separator
         *
         * @param domain - Domain separator fields
         * @returns 32-byte domain hash
         */
        function hash(domain) {
            const types = {
                EIP712Domain: [],
            };
            const domainTypes = types.EIP712Domain;
            if (!domainTypes)
                throw new Error("EIP712Domain type missing");
            const mutableDomain = domainTypes;
            // Build type definition based on present fields
            if (domain.name !== undefined) {
                mutableDomain.push({ name: "name", type: "string" });
            }
            if (domain.version !== undefined) {
                mutableDomain.push({ name: "version", type: "string" });
            }
            if (domain.chainId !== undefined) {
                mutableDomain.push({ name: "chainId", type: "uint256" });
            }
            if (domain.verifyingContract !== undefined) {
                mutableDomain.push({ name: "verifyingContract", type: "address" });
            }
            if (domain.salt !== undefined) {
                mutableDomain.push({ name: "salt", type: "bytes32" });
            }
            return hashStruct("EIP712Domain", domain, types);
        }
        Domain.hash = hash;
    })(Domain = Eip712Wasm.Domain || (Eip712Wasm.Domain = {}));
    // ==========================================================================
    // Type Operations
    // ==========================================================================
    /**
     * Encode type string (e.g., "Mail(Person from,Person to,string contents)")
     *
     * @param primaryType - Name of primary type
     * @param types - Type definitions
     * @returns Type encoding string
     */
    function encodeType(primaryType, types) {
        const deps = new Set();
        const visited = new Set();
        function findDeps(typeName) {
            if (visited.has(typeName) || !types[typeName])
                return;
            visited.add(typeName);
            for (const field of types[typeName]) {
                const baseType = field.type.replace(/\[.*\]$/, "");
                if (types[baseType] && !visited.has(baseType)) {
                    deps.add(baseType);
                    findDeps(baseType);
                }
            }
        }
        findDeps(primaryType);
        const sortedDeps = Array.from(deps).sort();
        const allTypes = [primaryType, ...sortedDeps];
        return allTypes
            .map((typeName) => {
            const typeFields = types[typeName];
            if (!typeFields)
                return "";
            const fields = typeFields
                // biome-ignore lint/suspicious/noExplicitAny: dynamic EIP-712 types
                .map((field) => `${field.type} ${field.name}`)
                .join(",");
            return `${typeName}(${fields})`;
        })
            .join("");
    }
    Eip712Wasm.encodeType = encodeType;
    /**
     * Hash type string
     *
     * @param primaryType - Name of primary type
     * @param types - Type definitions
     * @returns 32-byte type hash
     */
    function hashType(primaryType, types) {
        const encoded = encodeType(primaryType, types);
        return Keccak256Wasm.hashString(encoded);
    }
    Eip712Wasm.hashType = hashType;
    // ==========================================================================
    // Value Encoding
    // ==========================================================================
    /**
     * Encode single value
     *
     * @param type - Solidity type string
     * @param value - Value to encode
     * @param types - Type definitions (for structs)
     * @returns 32-byte encoded value
     */
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: EIP-712 encoding inherently complex
    function encodeValue(type, value, types) {
        const result = new Uint8Array(32);
        // Handle arrays
        if (type.includes("[")) {
            if (!Array.isArray(value)) {
                throw new Eip712EncodingError(`Expected array for type ${type}`);
            }
            const baseType = type.replace(/\[.*\]$/, "");
            const encodedElements = value.map((item) => encodeValue(baseType, item, types));
            const concatenated = new Uint8Array(encodedElements.length * 32);
            for (let i = 0; i < encodedElements.length; i++) {
                const elem = encodedElements[i];
                if (elem) {
                    concatenated.set(elem, i * 32);
                }
            }
            return Keccak256Wasm.hash(concatenated);
        }
        // Handle structs
        if (types[type]) {
            return hashStruct(type, value, types);
        }
        // Handle atomic types
        if (type === "string") {
            const bytes = new TextEncoder().encode(value);
            return Keccak256Wasm.hash(bytes);
        }
        if (type === "bytes") {
            return Keccak256Wasm.hash(value);
        }
        if (type.startsWith("bytes")) {
            const size = Number.parseInt(type.slice(5), 10);
            const bytes = value;
            result.set(bytes.slice(0, size), 0);
            return result;
        }
        if (type === "address") {
            const addr = typeof value === "string" ? hexToBytes(value) : value;
            result.set(addr, 12);
            return result;
        }
        if (type === "bool") {
            result[31] = value ? 1 : 0;
            return result;
        }
        if (type.startsWith("uint") || type.startsWith("int")) {
            const num = value;
            const bigNum = typeof num === "bigint" ? num : BigInt(num);
            // Convert to 32-byte big-endian
            const hex = bigNum.toString(16).padStart(64, "0");
            for (let i = 0; i < 32; i++) {
                result[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
            }
            return result;
        }
        throw new Eip712EncodingError(`Unsupported type: ${type}`);
    }
    Eip712Wasm.encodeValue = encodeValue;
    /**
     * Encode data for struct
     *
     * @param primaryType - Name of struct type
     * @param message - Message data
     * @param types - Type definitions
     * @returns Encoded data
     */
    function encodeData(primaryType, message, types) {
        const typeDef = types[primaryType];
        if (!typeDef) {
            throw new Eip712TypeNotFoundError(`Type ${primaryType} not found`);
        }
        const typeHash = hashType(primaryType, types);
        const encoded = [typeHash];
        for (const field of typeDef) {
            const value = message[field.name];
            if (value === undefined) {
                throw new Eip712InvalidMessageError(`Missing field ${field.name} in ${primaryType}`);
            }
            encoded.push(encodeValue(field.type, value, types));
        }
        const totalLength = encoded.reduce((sum, arr) => sum + arr.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const arr of encoded) {
            result.set(arr, offset);
            offset += arr.length;
        }
        return result;
    }
    Eip712Wasm.encodeData = encodeData;
    /**
     * Hash struct
     *
     * @param primaryType - Name of struct type
     * @param message - Message data
     * @param types - Type definitions
     * @returns 32-byte struct hash
     */
    function hashStruct(primaryType, message, types) {
        const encoded = encodeData(primaryType, message, types);
        return Keccak256Wasm.hash(encoded);
    }
    Eip712Wasm.hashStruct = hashStruct;
    // ==========================================================================
    // Main Operations
    // ==========================================================================
    /**
     * Hash typed data (EIP-712 signing hash)
     *
     * @param typedData - Complete typed data structure
     * @returns 32-byte hash ready for signing
     */
    function hashTypedData(typedData) {
        const domainHash = Domain.hash(typedData.domain);
        const messageHash = hashStruct(typedData.primaryType, typedData.message, typedData.types);
        // \x19\x01 || domainSeparator || hashStruct(message)
        const encoded = new Uint8Array(2 + 32 + 32);
        encoded[0] = 0x19;
        encoded[1] = 0x01;
        encoded.set(domainHash, 2);
        encoded.set(messageHash, 34);
        return Keccak256Wasm.hash(encoded);
    }
    Eip712Wasm.hashTypedData = hashTypedData;
    /**
     * Sign typed data with private key
     *
     * @param typedData - Typed data to sign
     * @param privateKey - 32-byte private key
     * @returns Signature (r, s, v)
     */
    function signTypedData(typedData, privateKey) {
        const hash = hashTypedData(typedData);
        return Secp256k1Wasm.sign(hash, privateKey);
    }
    Eip712Wasm.signTypedData = signTypedData;
    /**
     * Recover signer address from signature
     *
     * @param signature - Signature to recover from
     * @param typedData - Typed data that was signed
     * @returns Recovered address
     */
    function recoverAddress(signature, typedData) {
        const hash = hashTypedData(typedData);
        const publicKey = Secp256k1Wasm.recoverPublicKey(signature, hash);
        // Derive address from public key: keccak256(publicKey)[12:]
        const pubKeyHash = Keccak256Wasm.hash(publicKey);
        return pubKeyHash.slice(12);
    }
    Eip712Wasm.recoverAddress = recoverAddress;
    /**
     * Verify typed data signature against address
     *
     * @param signature - Signature to verify
     * @param typedData - Typed data that was signed
     * @param address - Expected signer address
     * @returns True if signature is valid
     */
    function verifyTypedData(signature, typedData, address) {
        try {
            const recovered = recoverAddress(signature, typedData);
            return bytesEqual(recovered, address);
        }
        catch {
            return false;
        }
    }
    Eip712Wasm.verifyTypedData = verifyTypedData;
    // ==========================================================================
    // Utility Functions
    // ==========================================================================
    /**
     * Validate typed data structure
     */
    function validate(typedData) {
        if (!typedData.types || !typedData.primaryType || !typedData.message) {
            return false;
        }
        if (!typedData.types[typedData.primaryType]) {
            return false;
        }
        return true;
    }
    Eip712Wasm.validate = validate;
    /**
     * Format typed data for display
     */
    function format(typedData) {
        return JSON.stringify(typedData, (_, v) => (typeof v === "bigint" ? v.toString() : v), 2);
    }
    Eip712Wasm.format = format;
    /**
     * Initialize WASM modules
     *
     * Must be called before using any Eip712Wasm functions.
     */
    async function init() {
        await Keccak256Wasm.init();
        // await Secp256k1Wasm.init();
    }
    Eip712Wasm.init = init;
    // ==========================================================================
    // Helper Functions
    // ==========================================================================
    function hexToBytes(hex) {
        const normalized = hex.startsWith("0x") ? hex.slice(2) : hex;
        const bytes = new Uint8Array(normalized.length / 2);
        for (let i = 0; i < bytes.length; i++) {
            bytes[i] = Number.parseInt(normalized.slice(i * 2, i * 2 + 2), 16);
        }
        return bytes;
    }
    function bytesEqual(a, b) {
        if (a.length !== b.length)
            return false;
        for (let i = 0; i < a.length; i++) {
            if (a[i] !== b[i])
                return false;
        }
        return true;
    }
})(Eip712Wasm || (Eip712Wasm = {}));
// Re-export namespace as default
export default Eip712Wasm;
