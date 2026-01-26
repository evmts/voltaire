import { describe, expect, it } from "@effect/vitest";
import { Address, type BrandedHex, Signature, TypedData } from "@tevm/voltaire";
import * as Effect from "effect/Effect";
import {
	AccountService,
	toAccount,
	type UnsignedTransaction,
} from "./index.js";

type HexType = BrandedHex.HexType;

type TypedDataType = TypedData.TypedDataType;

const TEST_ADDRESS = "0x0000000000000000000000000000000000000001" as const;
const TEST_HASH =
	"0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8" as HexType;
const TEST_SIGNATURE_HEX = `0x${"11".repeat(64)}1b` as HexType;
const TEST_SIGNATURE_BYTES = new Uint8Array(65).fill(0x22);

const typedData: TypedDataType = TypedData.from({
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

describe("toAccount", () => {
	it.effect("exposes custom signers and normalizes signatures", () =>
		Effect.gen(function* () {
			const captured: {
				message?: HexType;
				tx?: UnsignedTransaction;
				typedData?: TypedDataType;
			} = {};

			const account = yield* AccountService;
			expect(account.type).toBe("hardware");
			expect(Address.toHex(account.address)).toBe(TEST_ADDRESS);

			const message = "0x48656c6c6f" as HexType;
			const tx: UnsignedTransaction = {
				to: Address.fromHex("0x0000000000000000000000000000000000000002"),
				value: 1000000000000000000n,
				nonce: 0n,
				gasLimit: 21000n,
				chainId: 1n,
			};

			const sigMessage = yield* account.signMessage(message);
			const sigTx = yield* account.signTransaction(tx);
			const sigTyped = yield* account.signTypedData(typedData);

			expect(Signature.toHex(sigMessage)).toBe(TEST_SIGNATURE_HEX);
			expect(Signature.toHex(sigTx)).toBe(
				Signature.toHex(Signature.fromBytes(TEST_SIGNATURE_BYTES)),
			);
			expect(Signature.toHex(sigTyped)).toBe(TEST_SIGNATURE_HEX);
			expect(captured.message).toBe(message);
			expect(captured.tx).toEqual(tx);
			expect(captured.typedData).toEqual(typedData);
		}).pipe(
			Effect.provide(
				toAccount({
					address: TEST_ADDRESS,
					signMessage: (message) => {
						return Effect.sync(() => {
							captured.message = message;
							return TEST_SIGNATURE_HEX;
						});
					},
					signTransaction: (tx) => {
						return Effect.sync(() => {
							captured.tx = tx;
							return TEST_SIGNATURE_BYTES;
						});
					},
					signTypedData: (data) => {
						return Effect.sync(() => {
							captured.typedData = data;
							return TEST_SIGNATURE_HEX;
						});
					},
				}),
			),
		),
	);

	it.effect("fails for unsupported sign/signAuthorization by default", () =>
		Effect.gen(function* () {
			const account = yield* AccountService;

			const signResult = yield* Effect.either(
				account.sign({ hash: TEST_HASH }),
			);
			expect(signResult._tag).toBe("Left");
			if (signResult._tag === "Left") {
				expect(signResult.left._tag).toBe("AccountError");
			}

			const authResult = yield* Effect.either(
				account.signAuthorization({
					contractAddress: TEST_ADDRESS,
					chainId: 1n,
					nonce: 0n,
				}),
			);
			expect(authResult._tag).toBe("Left");
			if (authResult._tag === "Left") {
				expect(authResult.left._tag).toBe("AccountError");
			}
		}).pipe(
			Effect.provide(
				toAccount({
					address: TEST_ADDRESS,
					signMessage: () => Effect.succeed(TEST_SIGNATURE_HEX),
					signTransaction: () => Effect.succeed(TEST_SIGNATURE_HEX),
					signTypedData: () => Effect.succeed(TEST_SIGNATURE_HEX),
				}),
			),
		),
	);
});
