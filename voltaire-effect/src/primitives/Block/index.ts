/**
 * @module Block
 * @description Effect Schemas for complete Ethereum blocks.
 *
 * An Ethereum block contains:
 * - Block header with metadata (number, timestamp, parent hash, etc.)
 * - Block body with transactions and uncles
 * - Block hash (computed from header)
 * - Size in bytes
 *
 * ## Schemas
 *
 * | Schema | Input | Output | Description |
 * |--------|-------|--------|-------------|
 * | `Block.Rpc` | RPC JSON object | BlockType | Decodes JSON-RPC response format |
 * | `Block.Schema` | BlockType | BlockType | Identity validation schema |
 *
 * ## Usage
 *
 * ```typescript
 * import * as Block from 'voltaire-effect/primitives/Block'
 * import * as S from 'effect/Schema'
 *
 * // Decode from RPC response (eth_getBlockByNumber/Hash)
 * const rpcBlock = await provider.send('eth_getBlockByNumber', ['latest', true])
 * const block = S.decodeSync(Block.Rpc)(rpcBlock)
 * console.log(block.header.number) // bigint
 * console.log(block.body.transactions.length)
 * console.log(block.hash) // Uint8Array (32 bytes)
 * ```
 *
 * @since 0.1.0
 */

// Schemas
export { Rpc } from "./Rpc.js";
export { BlockSchema, BlockSchema as Schema } from "./BlockSchema.js";

// Re-export types from voltaire
import type { Block } from "@tevm/voltaire";
export type BlockType = Block.BlockType;
export type RpcBlock = Block.RpcBlock;
export type RpcBlockHeader = Block.RpcBlockHeader;
export type RpcBlockBody = Block.RpcBlockBody;
export type RpcWithdrawal = Block.RpcWithdrawal;
