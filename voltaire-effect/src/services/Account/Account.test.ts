import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	TypedData,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "vitest";
import { CryptoTest } from "../../crypto/CryptoTest.js";
import { TransportError, TransportService } from "../Transport/index.js";
import {
	AccountError,
	AccountService,
	JsonRpcAccount,
	LocalAccount,
	type UnsignedTransaction,
} from "./index.js";

type AddressType = BrandedAddress.AddressType;
type HexType = BrandedHex.HexType;
type TypedDataType = TypedData.TypedDataType;

const TEST_PRIVATE_KEY =
	"0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80" as HexType;
const _TEST_ADDRESS = Address.fromHex(
	"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
);

describe("AccountService", () => {
	describe("LocalAccount", () => {
		it("derives address from private key", async () => {
			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return account.address;
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const address = await Effect.runPromise(program);
			expect(address).toBeDefined();
			expect(address.length).toBe(20);
		});

		it('has type "local"', async () => {
			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return account.type;
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const type = await Effect.runPromise(program);
			expect(type).toBe("local");
		});

		it("signs message with EIP-191 prefix", async () => {
			const message = "0x48656c6c6f" as HexType;

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signMessage(message);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});

		it("signs transaction", async () => {
			const tx: UnsignedTransaction = {
				to: Address.fromHex("0x0000000000000000000000000000000000000001"),
				value: 1000000000000000000n,
				nonce: 0n,
				gasPrice: 20000000000n,
				gasLimit: 21000n,
				chainId: 1n,
			};

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTransaction(tx);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});

		it("signs typed data (EIP-712)", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				domain: {
					name: "Test",
					version: "1",
					chainId: 1,
				},
				message: {
					name: "Alice",
					wallet: Address.fromHex("0x0000000000000000000000000000000000000001"),
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});

		it("signs typed data with nested struct types (Mail containing Person)", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
					Mail: [
						{ name: "from", type: "Person" },
						{ name: "to", type: "Person" },
						{ name: "contents", type: "string" },
					],
				},
				primaryType: "Mail",
				domain: {
					name: "Ether Mail",
					version: "1",
					chainId: 1,
				},
				message: {
					from: {
						name: "Alice",
						wallet: Address.fromHex(
							"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
						),
					},
					to: {
						name: "Bob",
						wallet: Address.fromHex(
							"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
						),
					},
					contents: "Hello, Bob!",
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
			expect(signature.length).toBe(65);
		});

		it("signs typed data with array of primitives (uint256[])", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Batch: [
						{ name: "amounts", type: "uint256[]" },
						{ name: "nonce", type: "uint256" },
					],
				},
				primaryType: "Batch",
				domain: {
					name: "BatchApp",
					version: "1",
					chainId: 1,
				},
				message: {
					amounts: [1000000000000000000n, 2000000000000000000n, 3000000000000000000n],
					nonce: 42n,
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
			expect(signature.length).toBe(65);
		});

		it("signs typed data with array of structs (Person[])", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
					Group: [
						{ name: "members", type: "Person[]" },
						{ name: "name", type: "string" },
					],
				},
				primaryType: "Group",
				domain: {
					name: "GroupApp",
					version: "1",
					chainId: 1,
				},
				message: {
					members: [
						{
							name: "Alice",
							wallet: Address.fromHex(
								"0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826",
							),
						},
						{
							name: "Bob",
							wallet: Address.fromHex(
								"0xbBbBBBBbbBBBbbbBbbBbbbbBBbBbbbbBbBbbBBbB",
							),
						},
					],
					name: "Team Alpha",
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
			expect(signature.length).toBe(65);
		});

		it("signs EIP-2612 Permit typed data", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
						{ name: "verifyingContract", type: "address" },
					],
					Permit: [
						{ name: "owner", type: "address" },
						{ name: "spender", type: "address" },
						{ name: "value", type: "uint256" },
						{ name: "nonce", type: "uint256" },
						{ name: "deadline", type: "uint256" },
					],
				},
				primaryType: "Permit",
				domain: {
					name: "USDC",
					version: "2",
					chainId: 1,
					verifyingContract: Address.fromHex(
						"0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
					),
				},
				message: {
					owner: Address.fromHex(
						"0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
					),
					spender: Address.fromHex(
						"0x0000000000000000000000000000000000000001",
					),
					value: 1000000n,
					nonce: 0n,
					deadline: 1893456000n,
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
			expect(signature.length).toBe(65);
		});
	});

	describe("JsonRpcAccount", () => {
		const mockAddress = Address.fromHex(
			"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
		);
		const mockSignature = ("0x" +
			"00".repeat(32) +
			"00".repeat(32) +
			"1b") as HexType;

		const mockTransport = {
			request: <T>(method: string, _params?: unknown[]) => {
				if (method === "personal_sign") {
					return Effect.succeed(mockSignature as unknown as T);
				}
				if (method === "eth_signTransaction") {
					return Effect.succeed(mockSignature as unknown as T);
				}
				if (method === "eth_signTypedData_v4") {
					return Effect.succeed(mockSignature as unknown as T);
				}
				return Effect.fail(
					new TransportError({
						code: -32601,
						message: `Unknown method: ${method}`,
					}),
				);
			},
		};

		const transportLayer = Layer.succeed(TransportService, mockTransport);

		it("has correct address", async () => {
			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return account.address;
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			);

			const address = await Effect.runPromise(program);
			expect(Address.equals(address, mockAddress)).toBe(true);
		});

		it('has type "json-rpc"', async () => {
			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return account.type;
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			);

			const type = await Effect.runPromise(program);
			expect(type).toBe("json-rpc");
		});

		it("delegates signMessage to transport", async () => {
			const message = "0x48656c6c6f" as HexType;

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signMessage(message);
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});

		it("delegates signTransaction to transport", async () => {
			const tx: UnsignedTransaction = {
				to: Address.fromHex("0x0000000000000000000000000000000000000001"),
				value: 1000000000000000000n,
				nonce: 0n,
				gasLimit: 21000n,
				chainId: 1n,
			};

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTransaction(tx);
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});

		it("delegates signTypedData to transport", async () => {
			const typedData = TypedData.from({
				types: {
					EIP712Domain: [
						{ name: "name", type: "string" },
						{ name: "version", type: "string" },
						{ name: "chainId", type: "uint256" },
					],
					Person: [
						{ name: "name", type: "string" },
						{ name: "wallet", type: "address" },
					],
				},
				primaryType: "Person",
				domain: {
					name: "Test",
					version: "1",
					chainId: 1,
				},
				message: {
					name: "Alice",
					wallet: Address.fromHex("0x0000000000000000000000000000000000000001"),
				},
			});

			const program = Effect.gen(function* () {
				const account = yield* AccountService;
				return yield* account.signTypedData(typedData);
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			);

			const signature = await Effect.runPromise(program);
			expect(signature).toBeDefined();
		});
	});

	describe("AccountError", () => {
		it("has correct tag", () => {
			const error = new AccountError({ action: "signMessage" }, "test message");
			expect(error._tag).toBe("AccountError");
			expect(error.name).toBe("AccountError");
			expect(error.message).toBe("test message");
			expect(error.input).toEqual({ action: "signMessage" });
		});

		it("chains cause", () => {
			const cause = new Error("original");
			const error = new AccountError({ action: "signTransaction" }, "wrapped", {
				cause,
			});
			expect(error.cause).toBe(cause);
		});
	});
});
