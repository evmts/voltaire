/**
 * @fileoverview Effect Schemas for net_* JSON-RPC methods.
 * @module jsonrpc/schemas/net
 * @since 0.1.0
 */

import * as S from "effect/Schema";

// =============================================================================
// Re-export individual method schemas
// =============================================================================

export * from "./listening.js";
export * from "./peerCount.js";
export * from "./version.js";

// =============================================================================
// Import for union building
// =============================================================================

import { ListeningRequest } from "./listening.js";
import { PeerCountRequest } from "./peerCount.js";
import { VersionRequest } from "./version.js";

// =============================================================================
// Union Schema for all net_* requests
// =============================================================================

/**
 * Union schema for all net_* JSON-RPC request types.
 * Discriminates on the `method` field.
 */
export const NetMethodRequest = S.Union(
	ListeningRequest,
	PeerCountRequest,
	VersionRequest,
);

/** Type for NetMethodRequest union */
export type NetMethodRequestType = S.Schema.Type<typeof NetMethodRequest>;
