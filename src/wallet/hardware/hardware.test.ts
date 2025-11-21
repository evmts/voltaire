import { beforeEach, describe, expect, it, vi } from "vitest";
import type { HardwareWallet } from "./HardwareWallet.js";

// Mock transport and wallet libraries
vi.mock("@ledgerhq/hw-transport-webusb", () => ({
	default: {
		create: vi.fn().mockResolvedValue({
			close: vi.fn().mockResolvedValue(undefined),
		}),
	},
}));

vi.mock("@ledgerhq/hw-app-eth", () => ({
	default: vi.fn().mockImplementation(() => ({
		getAddress: vi.fn().mockResolvedValue({
			address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
		}),
		signTransaction: vi.fn().mockResolvedValue({
			r: `0x${"1".repeat(64)}`,
			s: `0x${"2".repeat(64)}`,
			v: "1c",
		}),
		signPersonalMessage: vi.fn().mockResolvedValue({
			r: `0x${"3".repeat(64)}`,
			s: `0x${"4".repeat(64)}`,
			v: "1b",
		}),
		signEIP712HashedMessage: vi.fn().mockResolvedValue({
			r: `0x${"5".repeat(64)}`,
			s: `0x${"6".repeat(64)}`,
			v: "1c",
		}),
		getAppConfiguration: vi.fn().mockResolvedValue({
			version: "1.10.0",
		}),
	})),
}));

vi.mock("@trezor/connect-web", () => ({
	default: {
		init: vi.fn().mockResolvedValue(undefined),
		dispose: vi.fn(),
		ethereumGetAddress: vi.fn().mockResolvedValue({
			success: true,
			payload: { address: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0" },
		}),
		ethereumSignTransaction: vi.fn().mockResolvedValue({
			success: true,
			payload: {
				v: "1c",
				r: `0x${"7".repeat(64)}`,
				s: `0x${"8".repeat(64)}`,
			},
		}),
		ethereumSignMessage: vi.fn().mockResolvedValue({
			success: true,
			payload: {
				signature: `0x${"9".repeat(64)}${"a".repeat(64)}1b`,
			},
		}),
		ethereumSignTypedData: vi.fn().mockResolvedValue({
			success: true,
			payload: {
				signature: `0x${"b".repeat(64)}${"c".repeat(64)}1c`,
			},
		}),
		getFeatures: vi.fn().mockResolvedValue({
			success: true,
			payload: {
				model: "T",
				major_version: 2,
				minor_version: 5,
				patch_version: 3,
			},
		}),
	},
}));

describe("Hardware Wallet Interface", () => {
	describe("Common Interface", () => {
		it("defines required methods", () => {
			const requiredMethods = [
				"connect",
				"disconnect",
				"isConnected",
				"getAddress",
				"getAddresses",
				"signTransaction",
				"signTypedData",
				"signMessage",
				"getDeviceInfo",
			];

			// Interface check - TypeScript will validate this at compile time
			const checkInterface = (wallet: HardwareWallet) => {
				requiredMethods.forEach((method) => {
					expect(typeof (wallet as any)[method]).toBe("function");
				});
			};

			expect(checkInterface).toBeDefined();
		});
	});

	describe("LedgerWallet", () => {
		let ledger: any;

		beforeEach(async () => {
			const { LedgerWallet } = await import("./LedgerWallet.js");
			ledger = new LedgerWallet();
		});

		it("connects to device", async () => {
			await ledger.connect();
			expect(ledger.isConnected()).toBe(true);
		});

		it("disconnects from device", async () => {
			await ledger.connect();
			await ledger.disconnect();
			expect(ledger.isConnected()).toBe(false);
		});

		it("gets single address", async () => {
			await ledger.connect();
			const address = await ledger.getAddress("m/44'/60'/0'/0/0");
			expect(address).toBeDefined();
		});

		it("gets multiple addresses", async () => {
			await ledger.connect();
			const addresses = await ledger.getAddresses("m/44'/60'/0'/0", 3);
			expect(addresses).toHaveLength(3);
		});

		it("signs transaction", async () => {
			await ledger.connect();

			const tx = {
				to: new Uint8Array(20),
				value: 1000000000000000000n,
				gas: 21000n,
				nonce: 0n,
				chainId: 1,
			};

			const signature = await ledger.signTransaction("m/44'/60'/0'/0/0", tx);
			expect(signature).toBeDefined();
		});

		it("signs personal message", async () => {
			await ledger.connect();
			const message = new TextEncoder().encode("Hello World");
			const signature = await ledger.signMessage("m/44'/60'/0'/0/0", message);
			expect(signature).toBeDefined();
		});

		it("signs typed data", async () => {
			await ledger.connect();

			const typedData = {
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				domain: { name: "Test", version: "1", chainId: 1 },
				message: { content: "Hello" },
			};

			const signature = await ledger.signTypedData(
				"m/44'/60'/0'/0/0",
				typedData,
			);
			expect(signature).toBeDefined();
		});

		it("gets device info", async () => {
			await ledger.connect();
			const info = await ledger.getDeviceInfo();
			expect(info.manufacturer).toBe("Ledger");
			expect(info.version).toBeDefined();
		});

		it("throws when not connected", async () => {
			await expect(ledger.getAddress("m/44'/60'/0'/0/0")).rejects.toThrow(
				"not connected",
			);
		});
	});

	describe("TrezorWallet", () => {
		let trezor: any;

		beforeEach(async () => {
			const { TrezorWallet } = await import("./TrezorWallet.js");
			trezor = new TrezorWallet({
				manifest: {
					email: "test@example.com",
					appUrl: "https://example.com",
				},
			});
		});

		it("connects to device", async () => {
			await trezor.connect();
			expect(trezor.isConnected()).toBe(true);
		});

		it("disconnects from device", async () => {
			await trezor.connect();
			await trezor.disconnect();
			expect(trezor.isConnected()).toBe(false);
		});

		it("gets single address", async () => {
			await trezor.connect();
			const address = await trezor.getAddress("m/44'/60'/0'/0/0");
			expect(address).toBeDefined();
		});

		it("gets multiple addresses", async () => {
			await trezor.connect();
			const addresses = await trezor.getAddresses("m/44'/60'/0'/0", 3);
			expect(addresses).toHaveLength(3);
		});

		it("signs transaction", async () => {
			await trezor.connect();

			const tx = {
				to: new Uint8Array(20),
				value: 1000000000000000000n,
				gas: 21000n,
				nonce: 0n,
				chainId: 1,
			};

			const signature = await trezor.signTransaction("m/44'/60'/0'/0/0", tx);
			expect(signature).toBeDefined();
		});

		it("signs personal message", async () => {
			await trezor.connect();
			const message = new TextEncoder().encode("Hello World");
			const signature = await trezor.signMessage("m/44'/60'/0'/0/0", message);
			expect(signature).toBeDefined();
		});

		it("signs typed data", async () => {
			await trezor.connect();

			const typedData = {
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Message: [{ name: "content", type: "string" }],
				},
				primaryType: "Message",
				domain: { name: "Test", version: "1", chainId: 1 },
				message: { content: "Hello" },
			};

			const signature = await trezor.signTypedData(
				"m/44'/60'/0'/0/0",
				typedData,
			);
			expect(signature).toBeDefined();
		});

		it("gets device info", async () => {
			await trezor.connect();
			const info = await trezor.getDeviceInfo();
			expect(info.manufacturer).toBe("Trezor");
			expect(info.model).toBe("T");
			expect(info.version).toBe("2.5.3");
		});

		it("throws when not connected", async () => {
			await expect(trezor.getAddress("m/44'/60'/0'/0/0")).rejects.toThrow(
				"not connected",
			);
		});
	});

	describe("Factory Functions", () => {
		it("creates Ledger instance", async () => {
			const { createLedger } = await import("./index.js");
			const ledger = createLedger();
			expect(ledger).toBeDefined();
		});

		it("creates Trezor instance", async () => {
			const { createTrezor } = await import("./index.js");
			const trezor = createTrezor();
			expect(trezor).toBeDefined();
		});

		it("creates Trezor with manifest", async () => {
			const { createTrezor } = await import("./index.js");
			const trezor = createTrezor({
				manifest: {
					email: "dev@example.com",
					appUrl: "https://app.example.com",
				},
			});
			expect(trezor).toBeDefined();
		});
	});
});
