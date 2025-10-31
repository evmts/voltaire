/**
 * EIP-712 Structured Data Signing
 *
 * Complete implementation of EIP-712 typed structured data hashing and signing.
 * All types and operations namespaced under Eip712 following the abi.ts pattern.
 *
 * @example
 * ```typescript
 * import { Eip712 } from './eip712.js';
 *
 * // Define typed data
 * const typedData: Eip712.TypedData = {
 *   domain: {
 *     name: 'MyApp',
 *     version: '1',
 *     chainId: 1n,
 *     verifyingContract: contractAddress,
 *   },
 *   types: {
 *     Person: [
 *       { name: 'name', type: 'string' },
 *       { name: 'wallet', type: 'address' },
 *     ],
 *     Mail: [
 *       { name: 'from', type: 'Person' },
 *       { name: 'to', type: 'Person' },
 *       { name: 'contents', type: 'string' },
 *     ],
 *   },
 *   primaryType: 'Mail',
 *   message: {
 *     from: { name: 'Alice', wallet: '0x...' },
 *     to: { name: 'Bob', wallet: '0x...' },
 *     contents: 'Hello!',
 *   },
 * };
 *
 * // Hash typed data
 * const hash = Eip712.hashTypedData(typedData);
 *
 * // Sign typed data
 * const signature = Eip712.signTypedData(typedData, privateKey);
 *
 * // Verify signature
 * const valid = Eip712.verifyTypedData(signature, typedData, address);
 * ```
 */

import type { Address } from "../primitives/address.js";
import { Hash } from "../primitives/hash.js";
import { secp256k1 } from "@noble/curves/secp256k1.js";
import { keccak_256 } from "@noble/hashes/sha3.js";

// ============================================================================
// Error Types
// ============================================================================

export class Eip712Error extends Error {
  constructor(message: string) {
    super(message);
    this.name = "Eip712Error";
  }
}

export class Eip712EncodingError extends Eip712Error {
  constructor(message: string) {
    super(message);
    this.name = "Eip712EncodingError";
  }
}

export class Eip712TypeNotFoundError extends Eip712Error {
  constructor(message: string) {
    super(message);
    this.name = "Eip712TypeNotFoundError";
  }
}

export class Eip712InvalidMessageError extends Eip712Error {
  constructor(message: string) {
    super(message);
    this.name = "Eip712InvalidMessageError";
  }
}

// ============================================================================
// Main Eip712 Namespace
// ============================================================================

export namespace Eip712 {
  // ==========================================================================
  // Core Types
  // ==========================================================================

  /**
   * EIP-712 Domain separator fields
   */
  export type Domain = {
    name?: string;
    version?: string;
    chainId?: bigint;
    verifyingContract?: Address;
    salt?: Hash;
  };

  /**
   * Type property definition
   */
  export type TypeProperty = {
    name: string;
    type: string;
  };

  /**
   * Type definitions mapping type names to their properties
   */
  export type TypeDefinitions = {
    [typeName: string]: readonly TypeProperty[];
  };

  /**
   * Message value (can be primitive or nested object)
   */
  export type MessageValue =
    | string
    | bigint
    | number
    | boolean
    | Address
    | Uint8Array
    | MessageValue[]
    | { [key: string]: MessageValue };

  /**
   * Message data (object with arbitrary structure matching types)
   */
  export type Message = {
    [key: string]: MessageValue;
  };

  /**
   * Complete EIP-712 typed data structure
   */
  export type TypedData = {
    domain: Domain;
    types: TypeDefinitions;
    primaryType: string;
    message: Message;
  };

  /**
   * ECDSA Signature
   */
  export type Signature = {
    r: Uint8Array;
    s: Uint8Array;
    v: number;
  };

  // ==========================================================================
  // Domain Operations
  // ==========================================================================

  export namespace Domain {
    /**
     * Hash EIP-712 domain separator
     *
     * @param domain - Domain separator fields
     * @returns Domain separator hash
     *
     * @example
     * ```typescript
     * const domain: Eip712.Domain = {
     *   name: 'MyApp',
     *   version: '1',
     *   chainId: 1n,
     * };
     * const hash = Eip712.Domain.hash(domain);
     * ```
     */
    export function hash(domain: Eip712.Domain): Hash {
      // Build EIP712Domain type based on fields present
      const domainFields: TypeProperty[] = [];
      const domainValues: Message = {};

      if (domain.name !== undefined) {
        domainFields.push({ name: "name", type: "string" });
        domainValues["name"] = domain.name;
      }
      if (domain.version !== undefined) {
        domainFields.push({ name: "version", type: "string" });
        domainValues["version"] = domain.version;
      }
      if (domain.chainId !== undefined) {
        domainFields.push({ name: "chainId", type: "uint256" });
        domainValues["chainId"] = domain.chainId;
      }
      if (domain.verifyingContract !== undefined) {
        domainFields.push({ name: "verifyingContract", type: "address" });
        domainValues["verifyingContract"] = domain.verifyingContract;
      }
      if (domain.salt !== undefined) {
        domainFields.push({ name: "salt", type: "bytes32" });
        domainValues["salt"] = domain.salt;
      }

      const types: TypeDefinitions = {
        EIP712Domain: domainFields,
      };

      return hashStruct("EIP712Domain", domainValues, types);
    }
  }

  // ==========================================================================
  // Type Encoding
  // ==========================================================================

  /**
   * Encode type string for EIP-712
   *
   * Example: "Mail(Person from,Person to,string contents)Person(string name,address wallet)"
   *
   * @param primaryType - Primary type name
   * @param types - Type definitions
   * @returns Encoded type string
   *
   * @example
   * ```typescript
   * const typeString = Eip712.encodeType('Mail', types);
   * ```
   */
  export function encodeType(
    primaryType: string,
    types: TypeDefinitions,
  ): string {
    const visited = new Set<string>();
    const result: string[] = [];

    function encodeTypeRecursive(typeName: string) {
      if (visited.has(typeName)) return;

      const typeProps = types[typeName];
      if (!typeProps) {
        throw new Eip712TypeNotFoundError(`Type '${typeName}' not found`);
      }

      visited.add(typeName);

      // Add main type definition
      const fields = typeProps.map((p) => `${p.type} ${p.name}`).join(",");
      result.push(`${typeName}(${fields})`);

      // Recursively encode referenced custom types (in alphabetical order)
      const referencedTypes = typeProps
        .map((p) => p.type)
        .filter((t) => types[t] !== undefined)
        .sort();

      for (const refType of referencedTypes) {
        if (!visited.has(refType)) {
          encodeTypeRecursive(refType);
        }
      }
    }

    encodeTypeRecursive(primaryType);
    return result.join("");
  }

  /**
   * Hash type string
   *
   * @param primaryType - Primary type name
   * @param types - Type definitions
   * @returns Type hash
   *
   * @example
   * ```typescript
   * const typeHash = Eip712.hashType('Mail', types);
   * ```
   */
  export function hashType(primaryType: string, types: TypeDefinitions): Hash {
    const encoded = encodeType(primaryType, types);
    const encodedBytes = new TextEncoder().encode(encoded);
    return keccak_256(encodedBytes) as Hash;
  }

  // ==========================================================================
  // Value Encoding
  // ==========================================================================

  /**
   * Encode single value to 32 bytes
   *
   * @param type - Solidity type string
   * @param value - Value to encode
   * @param types - Type definitions (for custom types)
   * @returns 32-byte encoded value
   *
   * @example
   * ```typescript
   * const encoded = Eip712.encodeValue('uint256', 42n, types);
   * ```
   */
  export function encodeValue(
    type: string,
    value: MessageValue,
    types: TypeDefinitions,
  ): Uint8Array {
    const result = new Uint8Array(32);

    // array types (hash the array encoding) - CHECK BEFORE uint/int to avoid matching "uint256[]"
    if (type.endsWith("[]")) {
      const baseType = type.slice(0, -2);
      const arr = value as MessageValue[];
      const encodedElements: Uint8Array[] = [];
      for (const elem of arr) {
        encodedElements.push(encodeValue(baseType, elem, types));
      }
      // Concatenate all encoded elements and hash
      const totalLength = encodedElements.reduce((sum, e) => sum + e.length, 0);
      const concatenated = new Uint8Array(totalLength);
      let offset = 0;
      for (const elem of encodedElements) {
        concatenated.set(elem, offset);
        offset += elem.length;
      }
      const hash = keccak_256(concatenated);
      return hash;
    }

    // uint/int types
    if (type.startsWith("uint") || type.startsWith("int")) {
      let num: bigint;
      if (typeof value === "bigint") {
        num = value;
      } else if (typeof value === "number") {
        num = BigInt(value);
      } else if (typeof value === "string") {
        num = BigInt(value);
      } else {
        throw new Eip712EncodingError(
          `Cannot encode value of type ${typeof value} as ${type}`,
        );
      }
      // Big-endian encoding
      let v = num;
      for (let i = 31; i >= 0; i--) {
        result[i] = Number(v & 0xffn);
        v >>= 8n;
      }
      return result;
    }

    // address type
    if (type === "address") {
      const addr = value as Uint8Array;
      if (addr.length !== 20) {
        throw new Eip712EncodingError("Address must be 20 bytes");
      }
      result.set(addr, 12); // Right-aligned in 32 bytes
      return result;
    }

    // bool type
    if (type === "bool") {
      result[31] = value ? 1 : 0;
      return result;
    }

    // string type (hash)
    if (type === "string") {
      const str = value as string;
      const encoded = new TextEncoder().encode(str);
      const hash = keccak_256(encoded);
      return hash;
    }

    // bytes type (dynamic - hash)
    if (type === "bytes") {
      const bytes = value as Uint8Array;
      const hash = keccak_256(bytes);
      return hash;
    }

    // bytesN type (fixed)
    if (type.startsWith("bytes")) {
      const match = type.match(/^bytes(\d+)$/);
      if (match && match[1]) {
        const size = Number.parseInt(match[1], 10);
        const bytes = value as Uint8Array;
        if (bytes.length !== size) {
          throw new Eip712EncodingError(
            `${type} must be ${size} bytes, got ${bytes.length}`,
          );
        }
        result.set(bytes, 0); // Left-aligned
        return result;
      }
    }

    // Custom struct type (hash the struct)
    if (types[type]) {
      const obj = value as Message;
      const hash = hashStruct(type, obj, types);
      return hash;
    }

    throw new Eip712EncodingError(`Unsupported type: ${type}`);
  }

  /**
   * Encode struct data
   *
   * @param primaryType - Type name
   * @param data - Message data
   * @param types - Type definitions
   * @returns Encoded data
   *
   * @example
   * ```typescript
   * const encoded = Eip712.encodeData('Person', { name: 'Alice', wallet: '0x...' }, types);
   * ```
   */
  export function encodeData(
    primaryType: string,
    data: Message,
    types: TypeDefinitions,
  ): Uint8Array {
    const typeProps = types[primaryType];
    if (!typeProps) {
      throw new Eip712TypeNotFoundError(`Type '${primaryType}' not found`);
    }

    // Type hash + encoded values
    const typeHash = hashType(primaryType, types);
    const encodedValues: Uint8Array[] = [typeHash];

    for (const prop of typeProps) {
      const value = data[prop.name];
      if (value === undefined) {
        throw new Eip712InvalidMessageError(
          `Missing field '${prop.name}' in message`,
        );
      }
      encodedValues.push(encodeValue(prop.type, value, types));
    }

    // Concatenate all
    const totalLength = encodedValues.reduce((sum, v) => sum + v.length, 0);
    const result = new Uint8Array(totalLength);
    let offset = 0;
    for (const encoded of encodedValues) {
      result.set(encoded, offset);
      offset += encoded.length;
    }

    return result;
  }

  /**
   * Hash struct according to EIP-712
   *
   * @param primaryType - Type name
   * @param data - Message data
   * @param types - Type definitions
   * @returns Struct hash
   *
   * @example
   * ```typescript
   * const hash = Eip712.hashStruct('Person', { name: 'Alice', wallet: '0x...' }, types);
   * ```
   */
  export function hashStruct(
    primaryType: string,
    data: Message,
    types: TypeDefinitions,
  ): Hash {
    const encoded = encodeData(primaryType, data, types);
    return keccak_256(encoded) as Hash;
  }

  // ==========================================================================
  // Main EIP-712 Operations
  // ==========================================================================

  /**
   * Hash typed data according to EIP-712
   *
   * Computes: keccak256("\x19\x01" ‖ domainSeparator ‖ hashStruct(message))
   *
   * @param typedData - Complete typed data structure
   * @returns EIP-712 hash
   *
   * @example
   * ```typescript
   * const hash = Eip712.hashTypedData(typedData);
   * ```
   */
  export function hashTypedData(typedData: TypedData): Hash {
    // Hash domain separator
    const domainHash = Domain.hash(typedData.domain);

    // Hash message struct
    const messageHash = hashStruct(
      typedData.primaryType,
      typedData.message,
      typedData.types,
    );

    // EIP-712 prefix + domain + message
    const prefix = new Uint8Array([0x19, 0x01]);
    const combined = new Uint8Array(2 + 32 + 32);
    combined.set(prefix, 0);
    combined.set(domainHash, 2);
    combined.set(messageHash, 34);

    return keccak_256(combined) as Hash;
  }

  // ==========================================================================
  // Signing Operations
  // ==========================================================================

  /**
   * Sign typed data with private key
   *
   * @param typedData - Typed data to sign
   * @param privateKey - 32-byte private key
   * @returns ECDSA signature
   *
   * @example
   * ```typescript
   * const signature = Eip712.signTypedData(typedData, privateKey);
   * ```
   */
  export function signTypedData(
    typedData: TypedData,
    privateKey: Uint8Array,
  ): Signature {
    if (privateKey.length !== 32) {
      throw new Eip712Error("Private key must be 32 bytes");
    }

    const hash = hashTypedData(typedData);

    // Sign with prehash:false (we already have the hash) and format:'recovered' to get recovery bit
    const sigBytes = secp256k1.sign(hash, privateKey, {
      prehash: false,
      format: "recovered",
    });

    // sigBytes is 65 bytes: r (32) || s (32) || recovery_byte (1)
    const r = sigBytes.slice(0, 32);
    const s = sigBytes.slice(32, 64);

    // Convert recovery byte to Ethereum v (27 or 28)
    const v = 27 + (sigBytes[64]! & 1);

    return { r, s, v };
  }

  /**
   * Recover address from typed data signature
   *
   * @param signature - ECDSA signature
   * @param typedData - Typed data that was signed
   * @returns Recovered address
   *
   * @example
   * ```typescript
   * const address = Eip712.recoverAddress(signature, typedData);
   * ```
   */
  export function recoverAddress(
    signature: Signature,
    typedData: TypedData,
  ): Address {
    const hash = hashTypedData(typedData);

    // Convert Ethereum v (27 or 28) to recovery bit (0 or 1)
    const recoveryBit = signature.v - 27;

    // Concatenate r and s for compact signature (64 bytes)
    const compactSig = new Uint8Array(64);
    compactSig.set(signature.r, 0);
    compactSig.set(signature.s, 32);

    // Recover public key point using fromBytes which expects 64-byte compact format
    const point = secp256k1.Signature.fromBytes(compactSig)
      .addRecoveryBit(recoveryBit)
      .recoverPublicKey(hash);

    // Convert point to uncompressed format (remove 0x04 prefix)
    const uncompressedWithPrefix = point.toBytes(false);
    if (uncompressedWithPrefix[0] !== 0x04) {
      throw new Eip712Error("Invalid recovered public key format");
    }
    const uncompressedPubKey = uncompressedWithPrefix.slice(1);

    // Address is last 20 bytes of keccak256(publicKey)
    const pubKeyHash = keccak_256(uncompressedPubKey);
    return pubKeyHash.slice(-20) as Address;
  }

  /**
   * Verify typed data signature
   *
   * @param signature - ECDSA signature
   * @param typedData - Typed data that was signed
   * @param address - Expected signer address
   * @returns True if signature is valid
   *
   * @example
   * ```typescript
   * const valid = Eip712.verifyTypedData(signature, typedData, signerAddress);
   * ```
   */
  export function verifyTypedData(
    signature: Signature,
    typedData: TypedData,
    address: Address,
  ): boolean {
    try {
      const recoveredAddress = recoverAddress(signature, typedData);

      // Constant-time comparison
      if (recoveredAddress.length !== address.length) {
        return false;
      }
      let result = 0;
      for (let i = 0; i < recoveredAddress.length; i++) {
        result |= recoveredAddress[i]! ^ address[i]!;
      }
      return result === 0;
    } catch {
      return false;
    }
  }

  // ==========================================================================
  // Utility Functions
  // ==========================================================================

  /**
   * Format typed data for display
   *
   * @param typedData - Typed data to format
   * @returns Human-readable string
   *
   * @example
   * ```typescript
   * const formatted = Eip712.format(typedData);
   * console.log(formatted);
   * ```
   */
  export function format(typedData: TypedData): string {
    const lines: string[] = [];

    lines.push("EIP-712 Typed Data:");
    lines.push("");

    // Domain
    lines.push("Domain:");
    if (typedData.domain.name) lines.push(`  name: ${typedData.domain.name}`);
    if (typedData.domain.version)
      lines.push(`  version: ${typedData.domain.version}`);
    if (typedData.domain.chainId !== undefined)
      lines.push(`  chainId: ${typedData.domain.chainId}`);
    if (typedData.domain.verifyingContract)
      lines.push(
        `  verifyingContract: 0x${Array.from(typedData.domain.verifyingContract).map((b) => b.toString(16).padStart(2, "0")).join("")}`,
      );
    lines.push("");

    // Primary type
    lines.push(`Primary Type: ${typedData.primaryType}`);
    lines.push("");

    // Types
    lines.push("Types:");
    for (const [typeName, props] of Object.entries(typedData.types)) {
      const fields = props.map((p) => `${p.type} ${p.name}`).join(", ");
      lines.push(`  ${typeName}(${fields})`);
    }
    lines.push("");

    // Message
    lines.push("Message:");
    lines.push(JSON.stringify(typedData.message, null, 2));

    return lines.join("\n");
  }

  /**
   * Validate typed data structure
   *
   * @param typedData - Typed data to validate
   * @throws {Eip712Error} If structure is invalid
   *
   * @example
   * ```typescript
   * Eip712.validate(typedData); // throws if invalid
   * ```
   */
  export function validate(typedData: TypedData): void {
    // Check primary type exists
    if (!typedData.types[typedData.primaryType]) {
      throw new Eip712TypeNotFoundError(
        `Primary type '${typedData.primaryType}' not found in types`,
      );
    }

    // Validate all type references
    function validateType(typeName: string, visited = new Set<string>()) {
      if (visited.has(typeName)) return; // Allow circular references
      visited.add(typeName);

      const typeProps = typedData.types[typeName];
      if (!typeProps) return; // Primitive type

      for (const prop of typeProps) {
        // Check if referenced type exists (if it's a custom type)
        if (typedData.types[prop.type]) {
          validateType(prop.type, visited);
        }
      }
    }

    validateType(typedData.primaryType);
  }
}

/**
 * EIP-712 TypedData type
 *
 * Uses TypeScript declaration merging - Eip712 is both a namespace and a type.
 */
export type Eip712 = Eip712.TypedData;

// Re-export namespace as default
export default Eip712;
