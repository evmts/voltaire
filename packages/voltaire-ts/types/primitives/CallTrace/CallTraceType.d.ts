import type { brand } from "../../brand.js";
import type { AddressType } from "../Address/AddressType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Call tree structure from callTracer
 * Represents a single call (or create) and its nested subcalls
 *
 * @see https://voltaire.tevm.sh/primitives/call-trace for CallTrace documentation
 * @since 0.0.0
 */
export type CallTraceType = {
    readonly [brand]: "CallTrace";
    /** Call type */
    readonly type: "CALL" | "STATICCALL" | "DELEGATECALL" | "CALLCODE" | "CREATE" | "CREATE2" | "SELFDESTRUCT";
    /** Caller address */
    readonly from: AddressType;
    /** Callee address (undefined for CREATE/CREATE2 before completion) */
    readonly to?: AddressType;
    /** Call value in wei */
    readonly value?: Uint256Type;
    /** Gas provided to this call */
    readonly gas: Uint256Type;
    /** Gas actually used by this call */
    readonly gasUsed: Uint256Type;
    /** Input data (calldata or init code) */
    readonly input: Uint8Array;
    /** Return data or deployed code */
    readonly output: Uint8Array;
    /** Error message if call failed */
    readonly error?: string;
    /** Decoded revert reason (from Error(string) or Panic(uint256)) */
    readonly revertReason?: string;
    /** Nested calls made by this call */
    readonly calls?: readonly CallTraceType[];
};
//# sourceMappingURL=CallTraceType.d.ts.map