import type { brand } from "../../brand.js";

/**
 * Configuration options for debug_traceTransaction and debug_traceCall
 *
 * @see https://voltaire.tevm.sh/primitives/trace-config for TraceConfig documentation
 * @since 0.0.0
 */
export type TraceConfigType = {
	readonly [brand]: "TraceConfig";
	/** Don't track storage changes (reduces overhead) */
	readonly disableStorage?: boolean;
	/** Don't track stack (reduces overhead) */
	readonly disableStack?: boolean;
	/** Don't track memory (reduces overhead) */
	readonly disableMemory?: boolean;
	/** Track memory (conflicts with disableMemory) */
	readonly enableMemory?: boolean;
	/** Track return data */
	readonly enableReturnData?: boolean;
	/** Tracer name: "callTracer", "prestateTracer", "4byteTracer", etc */
	readonly tracer?: string;
	/** Timeout for trace execution (e.g., "5s", "30s") */
	readonly timeout?: string;
	/** Tracer-specific configuration */
	readonly tracerConfig?: Record<string, unknown>;
};
