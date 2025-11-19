import { describe, it, expect } from "vitest";
import * as TraceConfig from "./index.js";

describe("TraceConfig", () => {
	it("creates empty config", () => {
		const config = TraceConfig.from();
		expect(config).toBeDefined();
	});

	it("creates config with options", () => {
		const config = TraceConfig.from({
			disableStorage: true,
			disableMemory: true,
			enableReturnData: true,
		});
		expect(config.disableStorage).toBe(true);
		expect(config.disableMemory).toBe(true);
		expect(config.enableReturnData).toBe(true);
	});

	it("creates config with tracer", () => {
		const config = TraceConfig.withTracer({}, "callTracer", {
			onlyTopCall: true,
		});
		expect(config.tracer).toBe("callTracer");
		expect(config.tracerConfig).toEqual({ onlyTopCall: true });
	});

	it("disables all tracking", () => {
		const config = TraceConfig.disableAll();
		expect(config.disableStorage).toBe(true);
		expect(config.disableStack).toBe(true);
		expect(config.disableMemory).toBe(true);
	});

	it("merges config with disableAll", () => {
		const base = TraceConfig.from({ enableReturnData: true });
		const config = TraceConfig.disableAll(base);
		expect(config.enableReturnData).toBe(true);
		expect(config.disableStorage).toBe(true);
	});
});
