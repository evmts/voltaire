import { describe, expect, it } from "vitest";
import { from as addressFrom } from "../../primitives/Address/BrandedAddress/from.js";
import { Host } from "./index.js";

describe("Host", () => {
	describe("from() - custom host creation", () => {
		it("creates host with all required operations", () => {
			const balances = new Map<string, bigint>();
			const codes = new Map<string, Uint8Array>();
			const storage = new Map<string, Map<string, bigint>>();
			const transientStorage = new Map<string, Map<string, bigint>>();
			const nonces = new Map<string, bigint>();

			const host = Host.from({
				getBalance: (addr) => {
					const key = Buffer.from(addr).toString("hex");
					return balances.get(key) ?? 0n;
				},
				setBalance: (addr, balance) => {
					const key = Buffer.from(addr).toString("hex");
					balances.set(key, balance);
				},
				getCode: (addr) => {
					const key = Buffer.from(addr).toString("hex");
					return codes.get(key) ?? new Uint8Array(0);
				},
				setCode: (addr, code) => {
					const key = Buffer.from(addr).toString("hex");
					codes.set(key, code);
				},
				getStorage: (addr, slot) => {
					const key = Buffer.from(addr).toString("hex");
					const addrStorage = storage.get(key);
					if (!addrStorage) return 0n;
					return addrStorage.get(slot.toString(16)) ?? 0n;
				},
				setStorage: (addr, slot, value) => {
					const key = Buffer.from(addr).toString("hex");
					let addrStorage = storage.get(key);
					if (!addrStorage) {
						addrStorage = new Map();
						storage.set(key, addrStorage);
					}
					addrStorage.set(slot.toString(16), value);
				},
				getNonce: (addr) => {
					const key = Buffer.from(addr).toString("hex");
					return nonces.get(key) ?? 0n;
				},
				setNonce: (addr, nonce) => {
					const key = Buffer.from(addr).toString("hex");
					nonces.set(key, nonce);
				},
				getTransientStorage: (addr, slot) => {
					const key = Buffer.from(addr).toString("hex");
					const addrStorage = transientStorage.get(key);
					if (!addrStorage) return 0n;
					return addrStorage.get(slot.toString(16)) ?? 0n;
				},
				setTransientStorage: (addr, slot, value) => {
					const key = Buffer.from(addr).toString("hex");
					let addrStorage = transientStorage.get(key);
					if (!addrStorage) {
						addrStorage = new Map();
						transientStorage.set(key, addrStorage);
					}
					addrStorage.set(slot.toString(16), value);
				},
			});

			expect(host.__tag).toBe("Host");
			expect(typeof host.getBalance).toBe("function");
			expect(typeof host.setBalance).toBe("function");
			expect(typeof host.getCode).toBe("function");
			expect(typeof host.setCode).toBe("function");
			expect(typeof host.getStorage).toBe("function");
			expect(typeof host.setStorage).toBe("function");
			expect(typeof host.getNonce).toBe("function");
			expect(typeof host.setNonce).toBe("function");
			expect(typeof host.getTransientStorage).toBe("function");
			expect(typeof host.setTransientStorage).toBe("function");
		});

		it("creates host with custom logging behavior", () => {
			const logs: string[] = [];

			const host = Host.from({
				getBalance: (addr) => {
					logs.push(`getBalance: ${Buffer.from(addr).toString("hex")}`);
					return 0n;
				},
				setBalance: (addr, balance) => {
					logs.push(
						`setBalance: ${Buffer.from(addr).toString("hex")} = ${balance}`,
					);
				},
				getCode: (addr) => {
					logs.push(`getCode: ${Buffer.from(addr).toString("hex")}`);
					return new Uint8Array(0);
				},
				setCode: (addr, code) => {
					logs.push(
						`setCode: ${Buffer.from(addr).toString("hex")} (${code.length} bytes)`,
					);
				},
				getStorage: (addr, slot) => {
					logs.push(
						`getStorage: ${Buffer.from(addr).toString("hex")} [${slot}]`,
					);
					return 0n;
				},
				setStorage: (addr, slot, value) => {
					logs.push(
						`setStorage: ${Buffer.from(addr).toString("hex")} [${slot}] = ${value}`,
					);
				},
				getNonce: (addr) => {
					logs.push(`getNonce: ${Buffer.from(addr).toString("hex")}`);
					return 0n;
				},
				setNonce: (addr, nonce) => {
					logs.push(
						`setNonce: ${Buffer.from(addr).toString("hex")} = ${nonce}`,
					);
				},
				getTransientStorage: (addr, slot) => {
					logs.push(
						`getTransientStorage: ${Buffer.from(addr).toString("hex")} [${slot}]`,
					);
					return 0n;
				},
				setTransientStorage: (addr, slot, value) => {
					logs.push(
						`setTransientStorage: ${Buffer.from(addr).toString("hex")} [${slot}] = ${value}`,
					);
				},
			});

			const addr = addressFrom("0x1234567890123456789012345678901234567890");

			host.getBalance(addr);
			host.setBalance(addr, 100n);
			host.getCode(addr);
			host.setCode(addr, new Uint8Array([0x60, 0x00]));
			host.getStorage(addr, 0x42n);
			host.setStorage(addr, 0x42n, 0x1337n);
			host.getNonce(addr);
			host.setNonce(addr, 5n);
			host.getTransientStorage(addr, 0x99n);
			host.setTransientStorage(addr, 0x99n, 0xabcdn);

			expect(logs).toEqual([
				"getBalance: 1234567890123456789012345678901234567890",
				"setBalance: 1234567890123456789012345678901234567890 = 100",
				"getCode: 1234567890123456789012345678901234567890",
				"setCode: 1234567890123456789012345678901234567890 (2 bytes)",
				"getStorage: 1234567890123456789012345678901234567890 [66]",
				"setStorage: 1234567890123456789012345678901234567890 [66] = 4919",
				"getNonce: 1234567890123456789012345678901234567890",
				"setNonce: 1234567890123456789012345678901234567890 = 5",
				"getTransientStorage: 1234567890123456789012345678901234567890 [153]",
				"setTransientStorage: 1234567890123456789012345678901234567890 [153] = 43981",
			]);
		});
	});

	describe("createMemoryHost() - in-memory host", () => {
		describe("getBalance / setBalance", () => {
			it("gets zero balance by default", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const balance = host.getBalance(addr);

				expect(balance).toBe(0n);
			});

			it("sets and gets balance", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setBalance(addr, 1000000000000000000n); // 1 ETH in wei

				const balance = host.getBalance(addr);
				expect(balance).toBe(1000000000000000000n);
			});

			it("updates existing balance", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setBalance(addr, 100n);
				host.setBalance(addr, 200n);

				const balance = host.getBalance(addr);
				expect(balance).toBe(200n);
			});

			it("isolates balances by address", () => {
				const host = Host.createMemoryHost();
				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

				host.setBalance(addr1, 100n);
				host.setBalance(addr2, 200n);

				expect(host.getBalance(addr1)).toBe(100n);
				expect(host.getBalance(addr2)).toBe(200n);
			});

			it("handles zero balance", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setBalance(addr, 100n);
				host.setBalance(addr, 0n);

				expect(host.getBalance(addr)).toBe(0n);
			});

			it("handles max uint256 balance", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const maxUint256 = (1n << 256n) - 1n;
				host.setBalance(addr, maxUint256);

				expect(host.getBalance(addr)).toBe(maxUint256);
			});
		});

		describe("getCode / setCode", () => {
			it("gets empty code by default", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const code = host.getCode(addr);

				expect(code).toEqual(new Uint8Array(0));
				expect(code.length).toBe(0);
			});

			it("sets and gets code", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const code = new Uint8Array([0x60, 0x80, 0x60, 0x40, 0x52]); // PUSH1 0x80 PUSH1 0x40 MSTORE
				host.setCode(addr, code);

				const retrievedCode = host.getCode(addr);
				expect(retrievedCode).toEqual(code);
			});

			it("updates existing code", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setCode(addr, new Uint8Array([0x60, 0x00]));
				host.setCode(addr, new Uint8Array([0x60, 0x01]));

				const code = host.getCode(addr);
				expect(code).toEqual(new Uint8Array([0x60, 0x01]));
			});

			it("isolates code by address", () => {
				const host = Host.createMemoryHost();
				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

				const code1 = new Uint8Array([0x60, 0x00]);
				const code2 = new Uint8Array([0x60, 0x01]);

				host.setCode(addr1, code1);
				host.setCode(addr2, code2);

				expect(host.getCode(addr1)).toEqual(code1);
				expect(host.getCode(addr2)).toEqual(code2);
			});

			it("handles empty code", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setCode(addr, new Uint8Array([0x60, 0x00]));
				host.setCode(addr, new Uint8Array(0));

				expect(host.getCode(addr)).toEqual(new Uint8Array(0));
			});

			it("handles large code (24KB limit)", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const largeCode = new Uint8Array(24576); // EIP-170: 24KB max
				for (let i = 0; i < largeCode.length; i++) {
					largeCode[i] = i % 256;
				}

				host.setCode(addr, largeCode);

				const retrievedCode = host.getCode(addr);
				expect(retrievedCode).toEqual(largeCode);
				expect(retrievedCode.length).toBe(24576);
			});
		});

		describe("getStorage / setStorage", () => {
			it("gets zero for unset storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const value = host.getStorage(addr, 0x42n);

				expect(value).toBe(0n);
			});

			it("sets and gets storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setStorage(addr, 0x42n, 0x1337n);

				const value = host.getStorage(addr, 0x42n);
				expect(value).toBe(0x1337n);
			});

			it("updates existing storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setStorage(addr, 0x42n, 0x100n);
				host.setStorage(addr, 0x42n, 0x200n);

				const value = host.getStorage(addr, 0x42n);
				expect(value).toBe(0x200n);
			});

			it("isolates storage by address", () => {
				const host = Host.createMemoryHost();
				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

				host.setStorage(addr1, 0x42n, 0xaabbn);
				host.setStorage(addr2, 0x42n, 0xccddn);

				expect(host.getStorage(addr1, 0x42n)).toBe(0xaabbn);
				expect(host.getStorage(addr2, 0x42n)).toBe(0xccddn);
			});

			it("isolates storage by slot", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setStorage(addr, 0x0n, 0x111n);
				host.setStorage(addr, 0x1n, 0x222n);
				host.setStorage(addr, 0xffffffffn, 0x333n);

				expect(host.getStorage(addr, 0x0n)).toBe(0x111n);
				expect(host.getStorage(addr, 0x1n)).toBe(0x222n);
				expect(host.getStorage(addr, 0xffffffffn)).toBe(0x333n);
			});

			it("handles zero value (clearing storage)", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setStorage(addr, 0x42n, 0x1337n);
				host.setStorage(addr, 0x42n, 0n);

				expect(host.getStorage(addr, 0x42n)).toBe(0n);
			});

			it("handles max uint256 value", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const maxUint256 = (1n << 256n) - 1n;
				host.setStorage(addr, 0x42n, maxUint256);

				expect(host.getStorage(addr, 0x42n)).toBe(maxUint256);
			});

			it("handles max uint256 slot", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const maxUint256 = (1n << 256n) - 1n;
				host.setStorage(addr, maxUint256, 0x1337n);

				expect(host.getStorage(addr, maxUint256)).toBe(0x1337n);
			});
		});

		describe("getNonce / setNonce", () => {
			it("gets zero nonce by default", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const nonce = host.getNonce(addr);

				expect(nonce).toBe(0n);
			});

			it("sets and gets nonce", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setNonce(addr, 5n);

				const nonce = host.getNonce(addr);
				expect(nonce).toBe(5n);
			});

			it("updates existing nonce", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setNonce(addr, 1n);
				host.setNonce(addr, 2n);
				host.setNonce(addr, 3n);

				const nonce = host.getNonce(addr);
				expect(nonce).toBe(3n);
			});

			it("isolates nonces by address", () => {
				const host = Host.createMemoryHost();
				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

				host.setNonce(addr1, 10n);
				host.setNonce(addr2, 20n);

				expect(host.getNonce(addr1)).toBe(10n);
				expect(host.getNonce(addr2)).toBe(20n);
			});

			it("handles zero nonce", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setNonce(addr, 5n);
				host.setNonce(addr, 0n);

				expect(host.getNonce(addr)).toBe(0n);
			});

			it("handles large nonce values", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const largeNonce = 2n ** 64n - 1n; // Max uint64
				host.setNonce(addr, largeNonce);

				expect(host.getNonce(addr)).toBe(largeNonce);
			});
		});

		describe("getTransientStorage / setTransientStorage", () => {
			it("gets zero for unset transient storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const value = host.getTransientStorage(addr, 0x42n);

				expect(value).toBe(0n);
			});

			it("sets and gets transient storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setTransientStorage(addr, 0x42n, 0x9999n);

				const value = host.getTransientStorage(addr, 0x42n);
				expect(value).toBe(0x9999n);
			});

			it("updates existing transient storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setTransientStorage(addr, 0x42n, 0x100n);
				host.setTransientStorage(addr, 0x42n, 0x200n);

				const value = host.getTransientStorage(addr, 0x42n);
				expect(value).toBe(0x200n);
			});

			it("isolates transient storage by address", () => {
				const host = Host.createMemoryHost();
				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");

				host.setTransientStorage(addr1, 0x42n, 0xaabbn);
				host.setTransientStorage(addr2, 0x42n, 0xccddn);

				expect(host.getTransientStorage(addr1, 0x42n)).toBe(0xaabbn);
				expect(host.getTransientStorage(addr2, 0x42n)).toBe(0xccddn);
			});

			it("isolates transient storage by slot", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setTransientStorage(addr, 0x0n, 0x111n);
				host.setTransientStorage(addr, 0x1n, 0x222n);
				host.setTransientStorage(addr, 0xffffffffn, 0x333n);

				expect(host.getTransientStorage(addr, 0x0n)).toBe(0x111n);
				expect(host.getTransientStorage(addr, 0x1n)).toBe(0x222n);
				expect(host.getTransientStorage(addr, 0xffffffffn)).toBe(0x333n);
			});

			it("does not persist to permanent storage", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setTransientStorage(addr, 0x42n, 0x9999n);
				host.setStorage(addr, 0x42n, 0x1111n);

				expect(host.getTransientStorage(addr, 0x42n)).toBe(0x9999n);
				expect(host.getStorage(addr, 0x42n)).toBe(0x1111n);
			});

			it("handles zero value", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				host.setTransientStorage(addr, 0x42n, 0x9999n);
				host.setTransientStorage(addr, 0x42n, 0n);

				expect(host.getTransientStorage(addr, 0x42n)).toBe(0n);
			});

			it("handles max uint256 value", () => {
				const host = Host.createMemoryHost();
				const addr = addressFrom("0x1234567890123456789012345678901234567890");

				const maxUint256 = (1n << 256n) - 1n;
				host.setTransientStorage(addr, 0x42n, maxUint256);

				expect(host.getTransientStorage(addr, 0x42n)).toBe(maxUint256);
			});
		});

		describe("multiple accounts", () => {
			it("manages multiple accounts independently", () => {
				const host = Host.createMemoryHost();

				const addr1 = addressFrom("0x1111111111111111111111111111111111111111");
				const addr2 = addressFrom("0x2222222222222222222222222222222222222222");
				const addr3 = addressFrom("0x3333333333333333333333333333333333333333");

				// Set different state for each account
				host.setBalance(addr1, 100n);
				host.setBalance(addr2, 200n);
				host.setBalance(addr3, 300n);

				host.setNonce(addr1, 1n);
				host.setNonce(addr2, 2n);
				host.setNonce(addr3, 3n);

				host.setCode(addr1, new Uint8Array([0x60, 0x00]));
				host.setCode(addr2, new Uint8Array([0x60, 0x01]));
				host.setCode(addr3, new Uint8Array([0x60, 0x02]));

				host.setStorage(addr1, 0n, 111n);
				host.setStorage(addr2, 0n, 222n);
				host.setStorage(addr3, 0n, 333n);

				// Verify isolation
				expect(host.getBalance(addr1)).toBe(100n);
				expect(host.getBalance(addr2)).toBe(200n);
				expect(host.getBalance(addr3)).toBe(300n);

				expect(host.getNonce(addr1)).toBe(1n);
				expect(host.getNonce(addr2)).toBe(2n);
				expect(host.getNonce(addr3)).toBe(3n);

				expect(host.getCode(addr1)).toEqual(new Uint8Array([0x60, 0x00]));
				expect(host.getCode(addr2)).toEqual(new Uint8Array([0x60, 0x01]));
				expect(host.getCode(addr3)).toEqual(new Uint8Array([0x60, 0x02]));

				expect(host.getStorage(addr1, 0n)).toBe(111n);
				expect(host.getStorage(addr2, 0n)).toBe(222n);
				expect(host.getStorage(addr3, 0n)).toBe(333n);
			});
		});
	});

	describe("interface completeness", () => {
		it("Host.from creates branded Host type", () => {
			const host = Host.from({
				getBalance: () => 0n,
				setBalance: () => {},
				getCode: () => new Uint8Array(0),
				setCode: () => {},
				getStorage: () => 0n,
				setStorage: () => {},
				getNonce: () => 0n,
				setNonce: () => {},
				getTransientStorage: () => 0n,
				setTransientStorage: () => {},
			});

			expect(host.__tag).toBe("Host");
		});

		it("Host.createMemoryHost creates branded Host type", () => {
			const host = Host.createMemoryHost();

			expect(host.__tag).toBe("Host");
		});

		it("Host interface has all required methods for handlers", () => {
			const host = Host.createMemoryHost();

			// Used by BALANCE (0x31)
			expect(typeof host.getBalance).toBe("function");

			// Used by EXTCODESIZE (0x3b), EXTCODECOPY (0x3c), EXTCODEHASH (0x3f)
			expect(typeof host.getCode).toBe("function");

			// Used by SLOAD (0x54)
			expect(typeof host.getStorage).toBe("function");

			// Used by SSTORE (0x55)
			expect(typeof host.setStorage).toBe("function");

			// Used by TLOAD (0x5c) - EIP-1153
			expect(typeof host.getTransientStorage).toBe("function");

			// Used by TSTORE (0x5d) - EIP-1153
			expect(typeof host.setTransientStorage).toBe("function");

			// Used by transaction processing
			expect(typeof host.getNonce).toBe("function");
			expect(typeof host.setNonce).toBe("function");
			expect(typeof host.setBalance).toBe("function");
			expect(typeof host.setCode).toBe("function");
		});
	});
});
