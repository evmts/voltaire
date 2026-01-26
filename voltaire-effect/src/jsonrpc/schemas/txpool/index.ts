/**
 * @fileoverview Effect Schemas for txpool_* JSON-RPC methods.
 * @module jsonrpc/schemas/txpool
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./content.js";
export * from "./inspect.js";
export * from "./status.js";

// =============================================================================
// Import for union building
// =============================================================================

import { ContentRequest } from "./content.js";
import { InspectRequest } from "./inspect.js";
import { StatusRequest } from "./status.js";

// =============================================================================
// Union Schema for all txpool_* requests
// =============================================================================

/**
 * Union schema for all txpool_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const TxpoolMethodRequest = S.Union(
	ContentRequest,
	InspectRequest,
	StatusRequest,
);

/** Type for TxpoolMethodRequest union */
export type TxpoolMethodRequestType = S.Schema.Type<typeof TxpoolMethodRequest>;
