/**
 * @module BlockHeader
 * @description Effect Schemas for Ethereum block headers.
 *
 * ## Type Declarations
 *
 * ```typescript
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 *
 * function validateHeader(header: BlockHeader.BlockHeaderType) {
 *   // ...
 * }
 * ```
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `BlockHeader.Rpc` | RPC JSON object | BlockHeaderType | Decodes JSON-RPC response format |
 * | `BlockHeader.Schema` | BlockHeaderType | BlockHeaderType | Identity validation schema |
 *
 * ## Usage
 *
 * ```typescript
 * import * as BlockHeader from 'voltaire-effect/primitives/BlockHeader'
 * import * as S from 'effect/Schema'
 *
 * // Decode from RPC response
 * const rpcHeader = {
 *   parentHash: '0x...',
 *   sha3Uncles: '0x...',
 *   miner: '0x...',
 *   stateRoot: '0x...',
 *   // ... other fields
 * }
 * const header = S.decodeSync(BlockHeader.Rpc)(rpcHeader)
 * console.log(header.number) // bigint
 * ```
 *
 * ## Pure Functions
 *
 * ```typescript
 * BlockHeader.calculateHash(header) // BlockHashType (32 bytes)
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { Rpc } from "./Rpc.js";
export {
	BlockHeaderSchema,
	BlockHeaderSchema as Schema,
} from "./BlockHeaderSchema.js";

// Pure functions
export { calculateHash } from "./calculateHash.js";

// Re-export types from voltaire
import type { BlockHeader } from "@tevm/voltaire";
export type BlockHeaderType = BlockHeader.BlockHeaderType;
export type RpcBlockHeader = BlockHeader.RpcBlockHeader;
