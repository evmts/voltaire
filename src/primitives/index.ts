/**
 * Primitives V2 - Data-first branded types for Ethereum primitives
 *
 * This module provides tree-shakeable, data-first interfaces matching the Zig API.
 * All types are branded primitives (Uint8Array, bigint, string) with methods
 * namespaced on the type itself for optimal tree-shaking.
 *
 * @example
 * ```typescript
 * import { Address } from '@tevm/primitives';
 *
 * // Create from hex
 * const addr = Address.fromHex('0xa0cf798816d4b9b9866b5330eea46a18382f251e');
 *
 * // Use methods
 * const checksum = Address.toChecksummed(addr);
 * const isZero = Address.isZero(addr);
 * ```
 */

// Core primitives
export { Address } from "./Address/index.js";
export * as BrandedAddress from "./Address/BrandedAddress/index.js";
export * from "./Hash/index.js";
export * as BrandedHash from "./Hash/BrandedHash/index.js";
export * from "./Hex/index.js";
export * as BrandedHex from "./Hex/BrandedHex/index.js";

// Numeric types
export * as Uint from "./Uint/index.js";
export * as Denomination from "./Denomination/index.js";

// Encoding
export { Rlp } from "./Rlp/index.js";
export * as BrandedRlp from "./Rlp/BrandedRlp/index.js";
export * as Abi from "./Abi/index.js";
export * as BrandedAbi from "./Abi/BrandedAbi/index.js";

// Transactions
export * as Transaction from "./Transaction/index.js";
export { AccessList } from "./AccessList/index.js";
export * as BrandedAccessList from "./AccessList/BrandedAccessList/index.js";
export * as Authorization from "./Authorization/index.js";
export * as BrandedAuthorization from "./Authorization/BrandedAuthorization/index.js";

// EVM
export { Bytecode } from "./Bytecode/index.js";
export * as BrandedBytecode from "./Bytecode/BrandedBytecode/index.js";
export * as Opcode from "./Opcode/index.js";
export * as GasConstants from "./GasConstants/index.js";
export { StorageKey } from "./State/index.js";
export * as BrandedStorageKey from "./State/BrandedState/index.js";

// Protocol
export { Blob } from "./Blob/index.js";
export * as BrandedBlob from "./Blob/BrandedBlob/index.js";
export { Chain } from "./Chain/index.js";
export * as BrandedChain from "./Chain/BrandedChain/index.js";
export * as FeeMarket from "./FeeMarket/index.js";
export * as Hardfork from "./Hardfork/index.js";

// Events & Logs
export * from "./EventLog/index.js";
export * as BrandedEventLog from "./EventLog/BrandedEventLog/index.js";

// Standards
export { Siwe } from "./Siwe/index.js";
export * as BrandedSiwe from "./Siwe/BrandedSiwe/index.js";
export * as Ens from "./Ens/index.js";
export * as BrandedEns from "./Ens/BrandedEns/index.js";

// Data structures
export * as BinaryTree from "./BinaryTree/index.js";
export * as BrandedBinaryTree from "./BinaryTree/BrandedBinaryTree/index.js";
export { BloomFilter } from "./BloomFilter/index.js";
export * as BrandedBloomFilter from "./BloomFilter/BrandedBloomFilter/index.js";

// Utilities
export * as Base64 from "./Base64/index.js";
export * as BrandedBase64 from "./Base64/BrandedBase64/index.js";

// Errors
export * from "./errors/index.js";
