import { describe, it, expectTypeOf } from "vitest";
import type { SecretKey } from "./SecretKey.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("X25519 SecretKey Type", () => {
	describe("type structure", () => {
		it("SecretKey is Uint8Array", () => {
			expectTypeOf<SecretKey>().toEqualTypeOf<Uint8Array>();
		});

		it("SecretKey matches Uint8Array exactly", () => {
			type Test = Equals<SecretKey, Uint8Array>;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array instances", () => {
			const arr = new Uint8Array(32);
			expectTypeOf(arr).toMatchTypeOf<SecretKey>();
		});

		it("is assignable to Uint8Array", () => {
			type Test = SecretKey extends Uint8Array ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("usage patterns", () => {
		it("SecretKey for function parameters", () => {
			function acceptsSecretKey(_key: SecretKey): void {}
			expectTypeOf(acceptsSecretKey).parameter(0).toEqualTypeOf<SecretKey>();
		});

		it("SecretKey for function returns", () => {
			function returnsSecretKey(): SecretKey {
				return new Uint8Array(32);
			}
			expectTypeOf(returnsSecretKey).returns.toEqualTypeOf<SecretKey>();
		});

		it("SecretKey in scalar multiplication", () => {
			type ScalarMult = (
				secretKey: SecretKey,
				publicKey: Uint8Array,
			) => Uint8Array;
			expectTypeOf<ScalarMult>().parameter(0).toEqualTypeOf<SecretKey>();
		});

		it("SecretKey in keypair", () => {
			type Keypair = { secretKey: SecretKey; publicKey: Uint8Array };
			expectTypeOf<Keypair>().toEqualTypeOf<{
				secretKey: SecretKey;
				publicKey: Uint8Array;
			}>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const key: SecretKey = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<SecretKey>();
		});

		it("compatible with crypto.getRandomValues", () => {
			const key: SecretKey = crypto.getRandomValues(new Uint8Array(32));
			expectTypeOf(key).toEqualTypeOf<SecretKey>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not SecretKey
			const key: SecretKey = "secret";
			expectTypeOf(key).not.toEqualTypeOf<string>();
		});

		it("not compatible with number", () => {
			// @ts-expect-error - number is not SecretKey
			const key: SecretKey = 123;
			expectTypeOf(key).not.toEqualTypeOf<number>();
		});
	});

	describe("curve25519 clamping", () => {
		it("represents clamped scalar value", () => {
			const secretKey: SecretKey = new Uint8Array(32);
			expectTypeOf(secretKey).toEqualTypeOf<SecretKey>();
		});

		it("supports clamping operation", () => {
			function clampSecretKey(key: SecretKey): SecretKey {
				const clamped = new Uint8Array(key);
				clamped[0] &= 248;
				clamped[31] &= 127;
				clamped[31] |= 64;
				return clamped;
			}
			expectTypeOf(clampSecretKey).returns.toEqualTypeOf<SecretKey>();
		});
	});

	describe("security considerations", () => {
		it("can be zeroed after use", () => {
			const key: SecretKey = new Uint8Array(32);
			key.fill(0);
			expectTypeOf(key).toEqualTypeOf<SecretKey>();
		});

		it("supports secure memory patterns", () => {
			function zeroize(key: SecretKey): void {
				key.fill(0);
			}
			expectTypeOf(zeroize).parameter(0).toEqualTypeOf<SecretKey>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to SecretKey", () => {
			function isSecretKey(value: Uint8Array): value is SecretKey {
				return value.length === 32;
			}
			expectTypeOf(isSecretKey).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = SecretKey | null;
			function isKey(value: Result): value is SecretKey {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isKey).returns.toEqualTypeOf<boolean>();
		});
	});
});
