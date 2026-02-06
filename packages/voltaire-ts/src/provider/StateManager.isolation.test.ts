import { describe, expect, test } from "vitest";
import { StateManager } from "../state-manager/StateManager/index.js";

// Skip these tests when not running in Bun (requires bun:ffi for native FFI)
const isBun = typeof globalThis.Bun !== "undefined";

describe.skipIf(!isBun)("StateManager isolation (no fork)", () => {
	test("should create StateManager without fork backend", () => {
		const sm = new StateManager({
			rpcClient: null, // No fork backend
		});
		expect(sm).toBeDefined();
	});

	test("should set and get balance without fork", async () => {
		const sm = new StateManager({
			rpcClient: null,
		});

		const addr = "0x1234567890123456789012345678901234567890";
		await sm.setBalance(addr, 1000000000000000000n);

		const balance = await sm.getBalance(addr);
		expect(balance).toBe(1000000000000000000n);
	});

	test("should get balance sync without fork", () => {
		const sm = new StateManager({
			rpcClient: null,
		});

		const addr = "0x1234567890123456789012345678901234567890";
		sm.setBalanceSync(addr, 1000000000000000000n);

		const balance = sm.getBalanceSync(addr);
		expect(balance).toBe(1000000000000000000n);
	});
});
