import {
	Address,
	type BrandedAddress,
	type BrandedHex,
	TypedData,
} from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { describe, expect, it } from "@effect/vitest";
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
		it.effect("derives address from private key", () =>
			Effect.gen(function* () {
				const account = yield* AccountService;
				const address = account.address;
				expect(address).toBeDefined();
				expect(address.length).toBe(20);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect('has type "local"', () =>
			Effect.gen(function* () {
				const account = yield* AccountService;
				expect(account.type).toBe("local");
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs message with EIP-191 prefix", () =>
			Effect.gen(function* () {
				const message = "0x48656c6c6f" as HexType;
				const account = yield* AccountService;
				const signature = yield* account.signMessage(message);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs transaction", () =>
			Effect.gen(function* () {
				const tx: UnsignedTransaction = {
					to: Address.fromHex("0x0000000000000000000000000000000000000001"),
					value: 1000000000000000000n,
					nonce: 0n,
					gasPrice: 20000000000n,
					gasLimit: 21000n,
					chainId: 1n,
				};

				const account = yield* AccountService;
				const signature = yield* account.signTransaction(tx);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data (EIP-712)", () =>
			Effect.gen(function* () {
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

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data with nested struct types (Mail containing Person)", () =>
			Effect.gen(function* () {
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

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data with array of primitives (uint256[])", () =>
			Effect.gen(function* () {
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
						amounts: [
							1000000000000000000n,
							2000000000000000000n,
							3000000000000000000n,
						],
						nonce: 42n,
					},
				});

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data with fixed-size array (uint256[3])", () =>
			Effect.gen(function* () {
				const typedData = TypedData.from({
					types: {
						EIP712Domain: [
							{ name: "name", type: "string" },
							{ name: "version", type: "string" },
							{ name: "chainId", type: "uint256" },
						],
						Vector: [
							{ name: "components", type: "uint256[3]" },
							{ name: "magnitude", type: "uint256" },
						],
					},
					primaryType: "Vector",
					domain: {
						name: "Math",
						version: "1",
						chainId: 1,
					},
					message: {
						components: [10n, 20n, 30n],
						magnitude: 37n,
					},
				});

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data with array of structs (Person[])", () =>
			Effect.gen(function* () {
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

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs typed data with deeply nested types", () =>
			Effect.gen(function* () {
				const typedData = TypedData.from({
					types: {
						EIP712Domain: [
							{ name: "name", type: "string" },
							{ name: "version", type: "string" },
							{ name: "chainId", type: "uint256" },
						],
						Coordinate: [
							{ name: "x", type: "int256" },
							{ name: "y", type: "int256" },
						],
						Location: [
							{ name: "name", type: "string" },
							{ name: "position", type: "Coordinate" },
						],
						Route: [
							{ name: "start", type: "Location" },
							{ name: "end", type: "Location" },
							{ name: "distance", type: "uint256" },
						],
					},
					primaryType: "Route",
					domain: {
						name: "Navigation",
						version: "1",
						chainId: 1,
					},
					message: {
						start: {
							name: "Home",
							position: { x: 100n, y: 200n },
						},
						end: {
							name: "Work",
							position: { x: 500n, y: 600n },
						},
						distance: 1000n,
					},
				});

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);

		it.effect("signs EIP-2612 Permit typed data", () =>
			Effect.gen(function* () {
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
						owner: Address.fromHex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"),
						spender: Address.fromHex(
							"0x0000000000000000000000000000000000000001",
						),
						value: 1000000n,
						nonce: 0n,
						deadline: 1893456000n,
					},
				});

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
				expect(signature.length).toBe(65);
			}).pipe(
				Effect.provide(LocalAccount(TEST_PRIVATE_KEY)),
				Effect.provide(CryptoTest),
			)
		);
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

		it.effect("has correct address", () =>
			Effect.gen(function* () {
				const account = yield* AccountService;
				expect(Address.equals(account.address, mockAddress)).toBe(true);
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			)
		);

		it.effect('has type "json-rpc"', () =>
			Effect.gen(function* () {
				const account = yield* AccountService;
				expect(account.type).toBe("json-rpc");
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			)
		);

		it.effect("delegates signMessage to transport", () =>
			Effect.gen(function* () {
				const message = "0x48656c6c6f" as HexType;
				const account = yield* AccountService;
				const signature = yield* account.signMessage(message);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			)
		);

		it.effect("delegates signTransaction to transport", () =>
			Effect.gen(function* () {
				const tx: UnsignedTransaction = {
					to: Address.fromHex("0x0000000000000000000000000000000000000001"),
					value: 1000000000000000000n,
					nonce: 0n,
					gasLimit: 21000n,
					chainId: 1n,
				};

				const account = yield* AccountService;
				const signature = yield* account.signTransaction(tx);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			)
		);

		it.effect("delegates signTypedData to transport", () =>
			Effect.gen(function* () {
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

				const account = yield* AccountService;
				const signature = yield* account.signTypedData(typedData);
				expect(signature).toBeDefined();
			}).pipe(
				Effect.provide(JsonRpcAccount(mockAddress)),
				Effect.provide(transportLayer),
			)
		);
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
