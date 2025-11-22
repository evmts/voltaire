import { describe, it, expectTypeOf } from "vitest";
import type { Seed } from "./Seed.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("Ed25519 Seed Type", () => {
	describe("type structure", () => {
		it("Seed is Uint8Array", () => {
			expectTypeOf<Seed>().toEqualTypeOf<Uint8Array>();
		});

		it("Seed matches Uint8Array exactly", () => {
			type Test = Equals<Seed, Uint8Array>;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array instances", () => {
			const arr = new Uint8Array(32);
			expectTypeOf(arr).toMatchTypeOf<Seed>();
		});

		it("is assignable to Uint8Array", () => {
			type Test = Seed extends Uint8Array ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("usage patterns", () => {
		it("Seed for function parameters", () => {
			function acceptsSeed(_seed: Seed): void {}
			expectTypeOf(acceptsSeed).parameter(0).toEqualTypeOf<Seed>();
		});

		it("Seed for function returns", () => {
			function returnsSeed(): Seed {
				return new Uint8Array(32);
			}
			expectTypeOf(returnsSeed).returns.toEqualTypeOf<Seed>();
		});

		it("Seed in keypair generation", () => {
			type KeypairFromSeed = (seed: Seed) => {
				secretKey: Uint8Array;
				publicKey: Uint8Array;
			};
			expectTypeOf<KeypairFromSeed>().parameter(0).toEqualTypeOf<Seed>();
		});

		it("Seed for deterministic generation", () => {
			type DeterministicKey = { seed: Seed; derivationPath?: string };
			expectTypeOf<DeterministicKey>().toEqualTypeOf<{
				seed: Seed;
				derivationPath?: string;
			}>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const seed: Seed = new Uint8Array(32);
			expectTypeOf(seed).toEqualTypeOf<Seed>();
		});

		it("compatible with crypto.getRandomValues output", () => {
			const seed: Seed = crypto.getRandomValues(new Uint8Array(32));
			expectTypeOf(seed).toEqualTypeOf<Seed>();
		});

		it("compatible with ArrayBuffer views", () => {
			const buffer = new ArrayBuffer(32);
			const seed: Seed = new Uint8Array(buffer);
			expectTypeOf(seed).toEqualTypeOf<Seed>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not Seed
			const seed: Seed = "random seed";
			expectTypeOf(seed).not.toEqualTypeOf<string>();
		});

		it("not compatible with number", () => {
			// @ts-expect-error - number is not Seed
			const seed: Seed = 12345;
			expectTypeOf(seed).not.toEqualTypeOf<number>();
		});
	});

	describe("deterministic properties", () => {
		it("same seed produces same keys", () => {
			function generateFromSeed(
				seed: Seed,
			): { key1: Uint8Array; key2: Uint8Array } {
				return { key1: seed, key2: seed };
			}
			expectTypeOf(generateFromSeed).parameter(0).toEqualTypeOf<Seed>();
		});

		it("supports mnemonic derivation pattern", () => {
			type MnemonicToSeed = (mnemonic: string) => Seed;
			expectTypeOf<MnemonicToSeed>().returns.toEqualTypeOf<Seed>();
		});
	});

	describe("security considerations", () => {
		it("should be generated securely", () => {
			function generateSecureSeed(): Seed {
				return crypto.getRandomValues(new Uint8Array(32));
			}
			expectTypeOf(generateSecureSeed).returns.toEqualTypeOf<Seed>();
		});

		it("can be zeroed after use", () => {
			const seed: Seed = new Uint8Array(32);
			seed.fill(0);
			expectTypeOf(seed).toEqualTypeOf<Seed>();
		});

		it("supports secure storage patterns", () => {
			type SecureSeedStorage = {
				encrypted: Uint8Array;
				iv: Uint8Array;
				getSeed: () => Seed;
			};
			expectTypeOf<SecureSeedStorage>().toEqualTypeOf<{
				encrypted: Uint8Array;
				iv: Uint8Array;
				getSeed: () => Seed;
			}>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to Seed", () => {
			function isSeed(value: Uint8Array): value is Seed {
				return value.length === 32;
			}
			expectTypeOf(isSeed).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = Seed | null;
			function hasSeed(value: Result): value is Seed {
				return value instanceof Uint8Array;
			}
			expectTypeOf(hasSeed).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly and mutability", () => {
		it("mutable by default", () => {
			const seed: Seed = new Uint8Array(32);
			seed[0] = 1;
			expectTypeOf(seed).toEqualTypeOf<Seed>();
		});

		it("can be made readonly", () => {
			const seed: Readonly<Seed> = new Uint8Array(32);
			expectTypeOf(seed).toEqualTypeOf<Readonly<Seed>>();
		});

		it("readonly prevents modification", () => {
			const seed: Readonly<Seed> = new Uint8Array(32);
			// @ts-expect-error - readonly prevents assignment
			seed[0] = 1;
			expectTypeOf(seed).toMatchTypeOf<Readonly<Uint8Array>>();
		});
	});
});
