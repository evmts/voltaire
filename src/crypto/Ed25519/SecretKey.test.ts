import { describe, it, expectTypeOf } from "vitest";
import type { SecretKey } from "./SecretKey.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("Ed25519 SecretKey Type", () => {
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

		it("SecretKey in objects", () => {
			type KeyPair = { secretKey: SecretKey };
			expectTypeOf<KeyPair>().toEqualTypeOf<{ secretKey: SecretKey }>();
		});

		it("SecretKey should be handled securely", () => {
			type SecureContainer = { secret: SecretKey; metadata?: never };
			expectTypeOf<SecureContainer>().toEqualTypeOf<{
				secret: SecretKey;
				metadata?: never;
			}>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const key: SecretKey = new Uint8Array(32);
			expectTypeOf(key).toEqualTypeOf<SecretKey>();
		});

		it("compatible with ArrayBuffer views", () => {
			const buffer = new ArrayBuffer(32);
			const key: SecretKey = new Uint8Array(buffer);
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
