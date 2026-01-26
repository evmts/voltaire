/**
 * @fileoverview Effect Schemas for web3_* JSON-RPC methods.
 * @module jsonrpc/schemas/web3
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./clientVersion.js";
export * from "./sha3.js";

// =============================================================================
// Import for union building
// =============================================================================

import { ClientVersionRequest } from "./clientVersion.js";
import { Sha3Request } from "./sha3.js";

// =============================================================================
// Union Schema for all web3_* requests
// =============================================================================

/**
 * Union schema for all web3_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const Web3MethodRequest = S.Union(ClientVersionRequest, Sha3Request);

/** Type for Web3MethodRequest union */
export type Web3MethodRequestType = S.Schema.Type<typeof Web3MethodRequest>;
