// Export type definition
export type { PackedUserOperationType } from "./PackedUserOperationType.js";

import type { AddressType } from "../Address/AddressType.js";
import type { UserOperationType } from "../UserOperation/UserOperationType.js";
// Import all functions
import { from } from "./from.js";
import { hash as _hash } from "./hash.js";
import type { PackedUserOperationType } from "./PackedUserOperationType.js";
import { unpack as _unpack } from "./unpack.js";

// Export constructors
export { from };

// Export public wrapper functions
export function hash(
	packedUserOp: PackedUserOperationType,
	entryPoint: number | bigint | string | Uint8Array | AddressType,
	chainId: bigint | number,
): Uint8Array {
	return _hash(packedUserOp, entryPoint, chainId);
}

export function unpack(
	packedUserOp: PackedUserOperationType,
): UserOperationType {
	return _unpack(packedUserOp);
}

// Export internal functions (tree-shakeable)
export { _hash, _unpack };

// Export as namespace (convenience)
export const PackedUserOperation = {
	from,
	hash,
	unpack,
};
