import type { brand } from "../../brand.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Geth-style structured execution log entry
 * Each entry represents one opcode execution with human-readable formatting
 *
 * @see https://voltaire.tevm.sh/primitives/struct-log for StructLog documentation
 * @since 0.0.0
 */
export type StructLogType = {
    readonly [brand]: "StructLog";
    /** Program counter */
    readonly pc: number;
    /** Opcode name (e.g., "PUSH1", "ADD", "SSTORE") */
    readonly op: string;
    /** Remaining gas before this operation */
    readonly gas: Uint256Type;
    /** Gas cost for this operation */
    readonly gasCost: Uint256Type;
    /** Call depth (0 for top-level call) */
    readonly depth: number;
    /** Stack contents as hex strings (top to bottom) */
    readonly stack: readonly string[];
    /** Memory contents as 32-byte hex chunks */
    readonly memory?: readonly string[];
    /** Storage changes (hex key -> hex value) */
    readonly storage?: Record<string, string>;
    /** Gas refund counter */
    readonly refund?: Uint256Type;
    /** Error message if operation failed */
    readonly error?: string;
};
//# sourceMappingURL=StructLogType.d.ts.map