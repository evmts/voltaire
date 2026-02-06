import type { brand } from "../../brand.js";
import type { CallTraceType } from "../CallTrace/CallTraceType.js";
import type { StructLogType } from "../StructLog/StructLogType.js";
import type { Uint256Type } from "../Uint/Uint256Type.js";
/**
 * Complete execution trace result
 * Returned by debug_traceTransaction and debug_traceCall
 *
 * @see https://voltaire.tevm.sh/primitives/trace-result for TraceResult documentation
 * @since 0.0.0
 */
export type TraceResultType = {
    readonly [brand]: "TraceResult";
    /** Total gas used by the execution */
    readonly gas: Uint256Type;
    /** Whether execution failed */
    readonly failed: boolean;
    /** Return value or revert data */
    readonly returnValue: Uint8Array;
    /** Opcode-level execution trace (when using default tracer) */
    readonly structLogs?: readonly StructLogType[];
    /** Call tree (when using callTracer) */
    readonly callTrace?: CallTraceType;
};
//# sourceMappingURL=TraceResultType.d.ts.map