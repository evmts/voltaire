/**
 * Authorization Module - Ox-based Implementation
 *
 * This module provides EIP-7702 Authorization primitives.
 * Core functionality is provided by Ox (https://oxlib.sh) for code sharing with Viem ecosystem.
 * Voltaire's branded Authorization type with utilities remains available via main index.ts.
 */

// ============================================================================
// Ox Re-exports (Core Functionality)
// ============================================================================

export {
	// Types
	type Authorization,
	type Rpc,
	type List,
	type ListRpc,
	type ListSigned,
	type Signed,
	type Tuple,
	type TupleSigned,
	type TupleList,
	type TupleListSigned,
	// Constructors (5 total)
	from,
	fromRpc,
	fromRpcList,
	fromTuple,
	fromTupleList,
	// Converters (4 total)
	toRpc,
	toRpcList,
	toTuple,
	toTupleList,
	// Utilities (2 total)
	hash,
	getSignPayload,
} from "ox/Authorization";
