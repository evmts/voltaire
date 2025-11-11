import { describe, expect, it } from "vitest";
import { sload } from "./0x54_SLOAD.js";
import { from as frameFrom } from "../../Frame/index.js";
import { createMemoryHost } from "../../Host/createMemoryHost.js";
import { from as addressFrom } from "../../../primitives/Address/BrandedAddress/from.js";

describe("SLOAD (0x54)", () => {
	it("loads value from storage", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		// Set storage value
		host.setStorage(addr, 0x42n, 0x1337n);

		const frame = frameFrom({
			stack: [0x42n], // key
			gasRemaining: 10000n,
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toBeNull();
		expect(frame.stack).toEqual([0x1337n]);
		expect(frame.pc).toBe(1);
		expect(frame.gasRemaining).toBeLessThan(10000n);
	});

	it("loads zero for empty storage slot", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		const frame = frameFrom({
			stack: [0x42n], // key
			gasRemaining: 10000n,
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toBeNull();
		expect(frame.stack).toEqual([0n]);
		expect(frame.pc).toBe(1);
	});

	it("returns StackUnderflow when stack is empty", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		const frame = frameFrom({
			stack: [],
			gasRemaining: 10000n,
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toEqual({ type: "StackUnderflow" });
		expect(frame.pc).toBe(0);
	});

	it("returns OutOfGas when insufficient gas", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		const frame = frameFrom({
			stack: [0x42n],
			gasRemaining: 10n, // Not enough for cold SLOAD (2100)
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toEqual({ type: "OutOfGas" });
		expect(frame.gasRemaining).toBe(0n);
		expect(frame.pc).toBe(0);
	});

	it("returns StackOverflow when stack is full", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		// Create stack with 1024 items (max)
		const fullStack = new Array(1024).fill(0n);

		const frame = frameFrom({
			stack: fullStack,
			gasRemaining: 10000n,
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toEqual({ type: "StackOverflow" });
		expect(frame.pc).toBe(0);
	});

	it("loads max uint256 value", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		const maxUint256 = (1n << 256n) - 1n;
		host.setStorage(addr, 0x42n, maxUint256);

		const frame = frameFrom({
			stack: [0x42n],
			gasRemaining: 10000n,
			address: addr,
		});

		const error = sload(frame, host);

		expect(error).toBeNull();
		expect(frame.stack).toEqual([maxUint256]);
		expect(frame.pc).toBe(1);
	});

	it("loads from different storage keys", () => {
		const host = createMemoryHost();
		const addr = addressFrom("0x1234567890123456789012345678901234567890");

		// Set multiple storage slots
		host.setStorage(addr, 0x0n, 0x111n);
		host.setStorage(addr, 0x1n, 0x222n);
		host.setStorage(addr, 0xffffffffffffffffffffffffffffffffffffffffn, 0x333n);

		// Load from slot 0
		let frame = Frame.from({
			stack: [0x0n],
			gasRemaining: 10000n,
			address: addr,
		});
		let error = sload(frame, host);
		expect(error).toBeNull();
		expect(frame.stack).toEqual([0x111n]);

		// Load from slot 1
		frame = frameFrom({
			stack: [0x1n],
			gasRemaining: 10000n,
			address: addr,
		});
		error = sload(frame, host);
		expect(error).toBeNull();
		expect(frame.stack).toEqual([0x222n]);

		// Load from max slot
		frame = frameFrom({
			stack: [0xffffffffffffffffffffffffffffffffffffffffn],
			gasRemaining: 10000n,
			address: addr,
		});
		error = sload(frame, host);
		expect(error).toBeNull();
		expect(frame.stack).toEqual([0x333n]);
	});

	it("isolates storage by address", () => {
		const host = createMemoryHost();
		const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
		const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

		// Set storage for addr1
		host.setStorage(addr1, 0x42n, 0xaabbn);

		// Set storage for addr2
		host.setStorage(addr2, 0x42n, 0xccddn);

		// Load from addr1
		let frame = frameFrom({
			stack: [0x42n],
			gasRemaining: 10000n,
			address: addr1,
		});
		let error = sload(frame, host);
		expect(error).toBeNull();
		expect(frame.stack).toEqual([0xaabbn]);

		// Load from addr2
		frame = frameFrom({
			stack: [0x42n],
			gasRemaining: 10000n,
			address: addr2,
		});
		error = sload(frame, host);
		expect(error).toBeNull();
		expect(frame.stack).toEqual([0xccddn]);
	});
});
