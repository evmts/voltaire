// Export type definition
export type { UserOperationType } from "./UserOperationType.js";

// Import all functions
import { from } from "./from.js";
import { hash as _hash } from "./hash.js";
import { pack as _pack } from "./pack.js";
import type { AddressType } from "../Address/AddressType.js";
import type { UserOperationType } from "./UserOperationType.js";
import type { PackedUserOperationType } from "../PackedUserOperation/PackedUserOperationType.js";

// Export constructors
export { from };

// Export public wrapper functions
export function hash(
	userOp: UserOperationType,
	entryPoint: number | bigint | string | Uint8Array | AddressType,
	chainId: bigint | number,
): Uint8Array {
	return _hash(userOp, entryPoint, chainId);
}

export function pack(userOp: UserOperationType): PackedUserOperationType {
	return _pack(userOp);
}

// Export internal functions (tree-shakeable)
export { _hash, _pack };

// Export as namespace (convenience)
export const UserOperation = {
	from,
	hash,
	pack,
};
