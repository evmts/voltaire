/**
 * Transaction Types and Utilities
 *
 * Complete transaction encoding/decoding with type inference for all Ethereum transaction types.
 * All types exported at top level for intuitive access.
 *
 * Supports:
 * - Legacy (Type 0): Original format with fixed gas price
 * - EIP-2930 (Type 1): Access lists and explicit chain ID
 * - EIP-1559 (Type 2): Dynamic fee market
 * - EIP-4844 (Type 3): Blob transactions for L2 scaling
 * - EIP-7702 (Type 4): EOA delegation to smart contracts
 *
 * @example
 * ```typescript
 * import * as Transaction from './transaction.js';
 *
 * // Types
 * const legacy: Transaction.Legacy = { ... };
 * const eip1559: Transaction.EIP1559 = { ... };
 *
 * // Operations
 * const data = Transaction.serialize(tx);
 * const hash = Transaction.hash(tx);
 * const decoded = Transaction.deserialize(data);
 *
 * // Type-specific operations with this: pattern
 * const hash = Transaction.Legacy.hash.call(legacy);
 * const serialized = Transaction.EIP1559.serialize.call(eip1559);
 * ```
 */

// Export types
export * from "./types.js";
export * from "./typeGuards.js";

// Export top-level operations
export { detectType } from "./detectType.js";
export { serialize } from "./serialize.js";
export { hash } from "./hash.js";
export { getSigningHash } from "./getSigningHash.js";
export { deserialize } from "./deserialize.js";
export { getSender } from "./getSender.js";
export { verifySignature } from "./verifySignature.js";
export { format } from "./format.js";
export { getGasPrice } from "./getGasPrice.js";
export { hasAccessList } from "./hasAccessList.js";
export { getAccessList } from "./getAccessList.js";
export { getChainId } from "./getChainId.js";
export { assertSigned } from "./assertSigned.js";
export { isSigned } from "./isSigned.js";

// Export Legacy namespace
export * as Legacy from "./Legacy/index.js";

// Export EIP2930 namespace
export * as EIP2930 from "./EIP2930/index.js";

// Export EIP1559 namespace
export * as EIP1559 from "./EIP1559/index.js";

// Export EIP4844 namespace
export * as EIP4844 from "./EIP4844/index.js";

// Export EIP7702 namespace
export * as EIP7702 from "./EIP7702/index.js";

// Export Authorization namespace
export * as Authorization from "./Authorization/index.js";
