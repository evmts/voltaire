import { Address } from "@tevm/voltaire";
import { HDWallet } from "@tevm/voltaire/HDWallet";
import * as Effect from "effect/Effect";
import { describe, expect, it } from "@effect/vitest";
import { KeccakLive } from "../../crypto/Keccak256/index.js";
import { Secp256k1Live } from "../../crypto/Secp256k1/index.js";
import { AccountService, MnemonicAccount } from "./index.js";

const TEST_MNEMONIC =
	"abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
const EXPECTED_ADDRESS = "0x9858effd232b4033e47d90003d41ec34ecaeda94";

const makeAccount = (options?: Parameters<typeof MnemonicAccount>[1]) =>
	Effect.gen(function* () {
		return yield* AccountService;
	}).pipe(
		Effect.provide(MnemonicAccount(TEST_MNEMONIC, options)),
		Effect.provide(Secp256k1Live),
		Effect.provide(KeccakLive),
	);

describe("MnemonicAccount", () => {
	it.effect("derives default address from BIP-39 test vector", () =>
		Effect.gen(function* () {
			const account = yield* makeAccount();
			expect(Address.toHex(account.address)).toBe(EXPECTED_ADDRESS);
			expect(account.hdKey).toBeDefined();
			expect(account.hdKey?.startsWith("xpub")).toBe(true);
		}),
	);

	it.effect("supports custom paths", () =>
		Effect.gen(function* () {
			const defaultAccount = yield* makeAccount();
			const customAccount = yield* makeAccount({
				path: "m/44'/60'/0'/0/0",
			});
			expect(Address.toHex(customAccount.address)).toBe(
				Address.toHex(defaultAccount.address),
			);
		}),
	);

	it.effect("deriveChild matches addressIndex derivation", () =>
		Effect.gen(function* () {
			const base = yield* makeAccount();
			expect(base.deriveChild).toBeDefined();

			const child = yield* base.deriveChild!(1);
			const direct = yield* makeAccount({ addressIndex: 1 });

			expect(Address.toHex(child.address)).toBe(Address.toHex(direct.address));
		}),
	);

	it.effect("supports hardened child derivation", () =>
		Effect.gen(function* () {
			const base = yield* makeAccount();
			const hardened = yield* base.deriveChild!(HDWallet.HARDENED_OFFSET);
			expect(hardened.hdKey).toBeDefined();
			expect(hardened.hdKey?.startsWith("xpub")).toBe(true);
		}),
	);
});
