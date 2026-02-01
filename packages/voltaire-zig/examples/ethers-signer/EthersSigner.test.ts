import { beforeEach, describe, expect, it, vi } from "vitest";
import { EthersSigner } from "./EthersSigner.js";
import type {
	FeeData,
	Network,
	SignerProvider,
	TransactionRequest,
} from "./EthersSignerTypes.js";
import {
	AddressMismatchError,
	ChainIdMismatchError,
	InvalidPrivateKeyError,
	InvalidTransactionError,
	MissingProviderError,
} from "./errors.js";

// Test private key (Anvil default account 0)
const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
const TEST_ADDRESS = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

// Another address for testing
const OTHER_ADDRESS = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8";

describe("EthersSigner", () => {
	describe("fromPrivateKey", () => {
		it("creates signer from hex string with 0x prefix", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			expect(signer.address).toBe(TEST_ADDRESS);
		});

		it("creates signer from hex string without 0x prefix", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY.slice(2),
			});
			expect(signer.address).toBe(TEST_ADDRESS);
		});

		it("creates signer from Uint8Array", () => {
			const bytes = new Uint8Array(32);
			bytes[31] = 1; // Simple non-zero key
			const signer = EthersSigner.fromPrivateKey({ privateKey: bytes });
			expect(signer.address).toMatch(/^0x[0-9a-fA-F]{40}$/);
		});

		it("throws on invalid key length (string)", () => {
			expect(() =>
				EthersSigner.fromPrivateKey({ privateKey: "0x1234" }),
			).toThrow(InvalidPrivateKeyError);
		});

		it("throws on invalid key length (bytes)", () => {
			expect(() =>
				EthersSigner.fromPrivateKey({ privateKey: new Uint8Array(16) }),
			).toThrow(InvalidPrivateKeyError);
		});

		it("throws on zero key", () => {
			expect(() =>
				EthersSigner.fromPrivateKey({ privateKey: new Uint8Array(32) }),
			).toThrow(InvalidPrivateKeyError);
		});
	});

	describe("properties", () => {
		it("exposes address", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			expect(signer.address).toBe(TEST_ADDRESS);
		});

		it("exposes privateKey as hex", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			expect(signer.privateKey.toLowerCase()).toBe(
				TEST_PRIVATE_KEY.toLowerCase(),
			);
		});

		it("provider is null without connection", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			expect(signer.provider).toBeNull();
		});
	});

	describe("getAddress", () => {
		it("returns checksummed address", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const address = await signer.getAddress();
			expect(address).toBe(TEST_ADDRESS);
		});
	});

	describe("connect", () => {
		it("returns new signer with provider", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const mockProvider = createMockProvider();

			const connected = signer.connect(mockProvider);

			expect(connected.provider).toBe(mockProvider);
			expect(connected.address).toBe(signer.address);
			expect(signer.provider).toBeNull(); // Original unchanged
		});
	});

	describe("signMessage", () => {
		it("signs string message", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const signature = await signer.signMessage("Hello, Ethereum!");

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		it("signs Uint8Array message", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const message = new TextEncoder().encode("Hello, Ethereum!");
			const signature = await signer.signMessage(message);

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		it("signMessageSync produces same result", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const syncSig = signer.signMessageSync("Hello");

			expect(syncSig).toMatch(/^0x[0-9a-f]{130}$/);
		});

		it("produces deterministic signatures", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const sig1 = await signer.signMessage("Test");
			const sig2 = await signer.signMessage("Test");

			expect(sig1).toBe(sig2);
		});
	});

	describe("signTypedData", () => {
		const domain = {
			name: "Test App",
			version: "1",
			chainId: 1n,
			verifyingContract: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		};

		const types = {
			Person: [
				{ name: "name", type: "string" },
				{ name: "wallet", type: "address" },
			],
		};

		const value = {
			name: "Alice",
			wallet: "0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC",
		};

		it("signs typed data", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const signature = await signer.signTypedData(domain, types, value);

			expect(signature).toMatch(/^0x[0-9a-f]{130}$/);
		});

		it("produces deterministic signatures", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const sig1 = await signer.signTypedData(domain, types, value);
			const sig2 = await signer.signTypedData(domain, types, value);

			expect(sig1).toBe(sig2);
		});
	});

	describe("provider operations", () => {
		let signer: InstanceType<typeof EthersSigner>;
		let mockProvider: SignerProvider;

		beforeEach(() => {
			mockProvider = createMockProvider();
			signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
				provider: mockProvider,
			});
		});

		describe("getNonce", () => {
			it("returns nonce from provider", async () => {
				const nonce = await signer.getNonce();
				expect(nonce).toBe(5);
				expect(mockProvider.getTransactionCount).toHaveBeenCalledWith(
					TEST_ADDRESS,
					undefined,
				);
			});

			it("throws without provider", async () => {
				const disconnected = EthersSigner.fromPrivateKey({
					privateKey: TEST_PRIVATE_KEY,
				});
				await expect(disconnected.getNonce()).rejects.toThrow(
					MissingProviderError,
				);
			});
		});

		describe("estimateGas", () => {
			it("estimates gas via provider", async () => {
				const tx: TransactionRequest = {
					to: OTHER_ADDRESS,
					value: 1000000000000000000n,
				};
				const gas = await signer.estimateGas(tx);
				expect(gas).toBe(21000n);
			});
		});

		describe("call", () => {
			it("executes call via provider", async () => {
				const tx: TransactionRequest = {
					to: OTHER_ADDRESS,
					data: "0x12345678",
				};
				const result = await signer.call(tx);
				expect(result).toBe("0x");
			});
		});

		describe("resolveName", () => {
			it("resolves ENS name via provider", async () => {
				const address = await signer.resolveName("vitalik.eth");
				expect(address).toBe("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045");
			});

			it("returns null for unknown name", async () => {
				mockProvider.resolveName = vi.fn().mockResolvedValue(null);
				const address = await signer.resolveName("unknown.eth");
				expect(address).toBeNull();
			});
		});
	});

	describe("populateCall", () => {
		it("populates basic call", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000n,
			};

			const pop = await signer.populateCall(tx);

			expect(pop.from).toBe(TEST_ADDRESS);
			expect(pop.value).toBe(1000n);
		});

		it("throws on from address mismatch", async () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				from: OTHER_ADDRESS,
			};

			await expect(signer.populateCall(tx)).rejects.toThrow(
				AddressMismatchError,
			);
		});
	});

	describe("populateTransaction", () => {
		let signer: InstanceType<typeof EthersSigner>;
		let mockProvider: SignerProvider;

		beforeEach(() => {
			mockProvider = createMockProvider();
			signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
				provider: mockProvider,
			});
		});

		it("populates EIP-1559 transaction", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000000000000000000n,
			};

			const pop = await signer.populateTransaction(tx);

			expect(pop.from).toBe(TEST_ADDRESS);
			expect(pop.chainId).toBe(1n);
			expect(pop.nonce).toBe(5n);
			expect(pop.gasLimit).toBe(21000n);
			expect(pop.type).toBe(2);
			expect(pop.maxFeePerGas).toBe(20000000000n);
			expect(pop.maxPriorityFeePerGas).toBe(1000000000n);
		});

		it("populates legacy transaction", async () => {
			// Mock provider that doesn't support EIP-1559
			mockProvider.getFeeData = vi.fn().mockResolvedValue({
				maxFeePerGas: null,
				maxPriorityFeePerGas: null,
				gasPrice: 10000000000n,
			});

			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000000000000000000n,
			};

			const pop = await signer.populateTransaction(tx);

			expect(pop.type).toBe(0);
			expect(pop.gasPrice).toBe(10000000000n);
			expect(pop.maxFeePerGas).toBeUndefined();
		});

		it("throws on chain ID mismatch", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				chainId: 5n, // Wrong chain
			};

			await expect(signer.populateTransaction(tx)).rejects.toThrow(
				ChainIdMismatchError,
			);
		});

		it("throws when mixing legacy and EIP-1559 fees", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				type: 2,
				gasPrice: 10000000000n,
			};

			await expect(signer.populateTransaction(tx)).rejects.toThrow(
				InvalidTransactionError,
			);
		});
	});

	describe("signTransaction", () => {
		let signer: InstanceType<typeof EthersSigner>;
		let mockProvider: SignerProvider;

		beforeEach(() => {
			mockProvider = createMockProvider();
			signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
				provider: mockProvider,
			});
		});

		it("signs EIP-1559 transaction", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000000000000000000n,
			};

			const signedTx = await signer.signTransaction(tx);

			expect(signedTx).toMatch(/^0x02/); // EIP-1559 prefix
			expect(signedTx.length).toBeGreaterThan(100);
		});

		it("produces deterministic signatures", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000000000000000000n,
				nonce: 0n,
				gasLimit: 21000n,
				maxFeePerGas: 20000000000n,
				maxPriorityFeePerGas: 1000000000n,
			};

			const sig1 = await signer.signTransaction(tx);
			const sig2 = await signer.signTransaction(tx);

			expect(sig1).toBe(sig2);
		});
	});

	describe("sendTransaction", () => {
		let signer: InstanceType<typeof EthersSigner>;
		let mockProvider: SignerProvider;

		beforeEach(() => {
			mockProvider = createMockProvider();
			signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
				provider: mockProvider,
			});
		});

		it("signs and broadcasts transaction", async () => {
			const tx: TransactionRequest = {
				to: OTHER_ADDRESS,
				value: 1000000000000000000n,
			};

			const response = await signer.sendTransaction(tx);

			expect(response.hash).toMatch(/^0x[0-9a-f]{64}$/);
			expect(mockProvider.broadcastTransaction).toHaveBeenCalled();
		});

		it("throws without provider", async () => {
			const disconnected = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			await expect(
				disconnected.sendTransaction({ to: OTHER_ADDRESS }),
			).rejects.toThrow(MissingProviderError);
		});
	});

	describe("authorize (EIP-7702)", () => {
		it("signs authorization synchronously", () => {
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
			});

			const auth = signer.authorizeSync({
				address: OTHER_ADDRESS,
				chainId: 1n,
				nonce: 0n,
			});

			expect(auth.address).toBe(OTHER_ADDRESS);
			expect(auth.chainId).toBe(1n);
			expect(auth.nonce).toBe(0n);
			expect(auth.signature.r.length).toBe(32);
			expect(auth.signature.s.length).toBe(32);
			expect([27, 28]).toContain(auth.signature.v);
		});

		it("signs authorization asynchronously", async () => {
			const mockProvider = createMockProvider();
			const signer = EthersSigner.fromPrivateKey({
				privateKey: TEST_PRIVATE_KEY,
				provider: mockProvider,
			});

			const auth = await signer.authorize({
				address: OTHER_ADDRESS,
			});

			expect(auth.chainId).toBe(1n);
			expect(auth.nonce).toBe(5n); // From mock provider
		});
	});
});

// Helper: Create mock provider
function createMockProvider(): SignerProvider {
	return {
		getTransactionCount: vi.fn().mockResolvedValue(5),
		estimateGas: vi.fn().mockResolvedValue(21000n),
		call: vi.fn().mockResolvedValue("0x"),
		getNetwork: vi.fn().mockResolvedValue({ chainId: 1n, name: "mainnet" }),
		getFeeData: vi.fn().mockResolvedValue({
			maxFeePerGas: 20000000000n,
			maxPriorityFeePerGas: 1000000000n,
			gasPrice: 15000000000n,
		} as FeeData),
		broadcastTransaction: vi.fn().mockImplementation((signedTx: string) =>
			Promise.resolve({
				hash: `0x${"a".repeat(64)}`,
				from: TEST_ADDRESS,
				to: OTHER_ADDRESS,
				nonce: 5,
				gasLimit: 21000n,
				maxFeePerGas: 20000000000n,
				maxPriorityFeePerGas: 1000000000n,
				data: "0x",
				value: 0n,
				chainId: 1n,
				type: 2,
				wait: vi.fn().mockResolvedValue({
					status: 1,
					blockNumber: 1000,
					blockHash: `0x${"b".repeat(64)}`,
					transactionIndex: 0,
					from: TEST_ADDRESS,
					gasUsed: 21000n,
					logs: [],
				}),
			}),
		),
		resolveName: vi
			.fn()
			.mockResolvedValue("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"),
	};
}
