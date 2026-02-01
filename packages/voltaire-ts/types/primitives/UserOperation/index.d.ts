export type { UserOperationType } from "./UserOperationType.js";
import type { AddressType } from "../Address/AddressType.js";
import type { PackedUserOperationType } from "../PackedUserOperation/PackedUserOperationType.js";
import { from } from "./from.js";
import { hash as _hash } from "./hash.js";
import { pack as _pack } from "./pack.js";
import type { UserOperationType } from "./UserOperationType.js";
export { from };
export declare function hash(userOp: UserOperationType, entryPoint: number | bigint | string | Uint8Array | AddressType, chainId: bigint | number): Uint8Array;
export declare function pack(userOp: UserOperationType): PackedUserOperationType;
export { _hash, _pack };
export declare const UserOperation: {
    from: typeof from;
    hash: typeof hash;
    pack: typeof pack;
};
//# sourceMappingURL=index.d.ts.map