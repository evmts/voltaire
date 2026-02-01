/**
 * TraceConfig Benchmarks: Voltaire TS
 *
 * Compares performance of trace configuration operations.
 * TraceConfig defines options for debug_traceTransaction.
 */

import { bench, run } from "mitata";
import * as TraceConfig from "./index.js";

// ============================================================================
// Test Data
// ============================================================================

// Pre-created configs
const defaultConfig = TraceConfig.from();
const _minimalConfig = TraceConfig.disableAll();
const _callTracerConfig = TraceConfig.withTracer(
	TraceConfig.from(),
	"callTracer",
);
const _prestateTracerConfig = TraceConfig.withTracer(
	TraceConfig.from(),
	"prestateTracer",
	{ diffMode: true },
);

// Full custom config
const fullConfig = TraceConfig.from({
	disableStorage: true,
	disableStack: false,
	enableMemory: true,
	enableReturnData: true,
	timeout: "30s",
	tracer: "callTracer",
	tracerConfig: { onlyTopCall: true },
});

// ============================================================================
// from benchmarks (creation)
// ============================================================================

bench("from - default - voltaire", () => {
	TraceConfig.from();
});

bench("from - minimal options - voltaire", () => {
	TraceConfig.from({
		disableStorage: true,
	});
});

bench("from - partial options - voltaire", () => {
	TraceConfig.from({
		disableStorage: true,
		disableStack: true,
		enableMemory: false,
	});
});

bench("from - full options - voltaire", () => {
	TraceConfig.from({
		disableStorage: true,
		disableStack: false,
		enableMemory: true,
		enableReturnData: true,
		timeout: "30s",
		tracer: "callTracer",
		tracerConfig: { onlyTopCall: true },
	});
});

await run();

// ============================================================================
// disableAll benchmarks
// ============================================================================

bench("disableAll - no base - voltaire", () => {
	TraceConfig.disableAll();
});

bench("disableAll - from default - voltaire", () => {
	TraceConfig.disableAll(defaultConfig);
});

bench("disableAll - from full - voltaire", () => {
	TraceConfig.disableAll(fullConfig);
});

await run();

// ============================================================================
// withTracer benchmarks
// ============================================================================

bench("withTracer - callTracer - voltaire", () => {
	TraceConfig.withTracer(defaultConfig, "callTracer");
});

bench("withTracer - prestateTracer - voltaire", () => {
	TraceConfig.withTracer(defaultConfig, "prestateTracer");
});

bench("withTracer - with config - voltaire", () => {
	TraceConfig.withTracer(defaultConfig, "callTracer", { onlyTopCall: true });
});

bench("withTracer - complex config - voltaire", () => {
	TraceConfig.withTracer(defaultConfig, "prestateTracer", {
		diffMode: true,
		timeout: "60s",
	});
});

await run();

// ============================================================================
// Combined operations
// ============================================================================

bench("from + withTracer - voltaire", () => {
	const config = TraceConfig.from({ disableStorage: true });
	TraceConfig.withTracer(config, "callTracer");
});

bench("from + disableAll + withTracer - voltaire", () => {
	const config = TraceConfig.from();
	const minimal = TraceConfig.disableAll(config);
	TraceConfig.withTracer(minimal, "callTracer");
});

await run();

// ============================================================================
// Batch operations
// ============================================================================

const tracers = [
	"callTracer",
	"prestateTracer",
	"4byteTracer",
	"noopTracer",
	"opCountTracer",
];

bench("withTracer - 5 different tracers - voltaire", () => {
	for (const tracer of tracers) {
		TraceConfig.withTracer(defaultConfig, tracer);
	}
});

await run();

const configOptions = [
	{},
	{ disableStorage: true },
	{ disableStack: true },
	{ enableMemory: true },
	{ enableReturnData: true },
	{ disableStorage: true, disableStack: true },
	{ enableMemory: true, enableReturnData: true },
	{ disableStorage: true, enableMemory: true, timeout: "30s" },
];

bench("from - 8 different configs - voltaire", () => {
	for (const options of configOptions) {
		TraceConfig.from(options);
	}
});

await run();
