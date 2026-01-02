/**
 * Tree-shakeable functional APIs for all primitives
 *
 * @example Namespace imports
 * ```typescript
 * import { Address, Hash, Hex } from '@tevm/voltaire/functional'
 *
 * const addr = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f51e3e')
 * const hash = Hash.keccak256(data)
 * const hex = Hex.from(bytes)
 * ```
 *
 * @example Individual imports for maximum tree-shaking
 * ```typescript
 * import { Address } from '@tevm/voltaire/functional'
 * import { from, toHex } from '@tevm/voltaire/Address/functional'
 * ```
 */

// Core primitives - namespace exports for functional API
export * as Address from "./primitives/Address/internal-index.js";
export * as Hash from "./primitives/Hash/index.js";
export * as Hex from "./primitives/Hex/index.js";
export * as Uint from "./primitives/Uint/index.js";
export * as Rlp from "./primitives/Rlp/index.js";
export * as Signature from "./primitives/Signature/index.js";
export * as Transaction from "./primitives/Transaction/index.js";
export * as Bytecode from "./primitives/Bytecode/index.js";
export * as Base64 from "./primitives/Base64/index.js";
export * as Blob from "./primitives/Blob/index.js";
export * as Ens from "./primitives/Ens/index.js";
export * as EventLog from "./primitives/EventLog/index.js";
export * as AccessList from "./primitives/AccessList/index.js";
export * as Abi from "./primitives/Abi/index.js";
export * as BloomFilter from "./primitives/BloomFilter/index.js";
export * as BinaryTree from "./primitives/BinaryTree/index.js";
export * as Hardfork from "./primitives/Hardfork/index.js";
export * as Opcode from "./primitives/Opcode/index.js";
export * as State from "./primitives/State/index.js";
export * as Siwe from "./primitives/Siwe/index.js";
