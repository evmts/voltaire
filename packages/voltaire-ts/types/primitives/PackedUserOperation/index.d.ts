export type { PackedUserOperationType } from "./PackedUserOperationType.js";
import type { AddressType } from "../Address/AddressType.js";
import type { UserOperationType } from "../UserOperation/UserOperationType.js";
import { from } from "./from.js";
import { hash as _hash } from "./hash.js";
import type { PackedUserOperationType } from "./PackedUserOperationType.js";
import { unpack as _unpack } from "./unpack.js";
export { from };
export declare function hash(packedUserOp: PackedUserOperationType, entryPoint: number | bigint | string | Uint8Array | AddressType, chainId: bigint | number): Uint8Array;
export declare function unpack(packedUserOp: PackedUserOperationType): UserOperationType;
export { _hash, _unpack };
export declare const PackedUserOperation: {
    from: typeof from;
    hash: typeof hash;
    unpack: typeof unpack;
};
//# sourceMappingURL=index.d.ts.map