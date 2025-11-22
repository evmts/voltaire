import { describe, it, expectTypeOf } from "vitest";
import type { SharedSecret } from "./SharedSecret.js";

type Equals<T, U> = (<G>() => G extends T ? 1 : 2) extends <G>() => G extends U
	? 1
	: 2
	? true
	: false;

describe("X25519 SharedSecret Type", () => {
	describe("type structure", () => {
		it("SharedSecret is Uint8Array", () => {
			expectTypeOf<SharedSecret>().toEqualTypeOf<Uint8Array>();
		});

		it("SharedSecret matches Uint8Array exactly", () => {
			type Test = Equals<SharedSecret, Uint8Array>;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});

		it("accepts Uint8Array instances", () => {
			const arr = new Uint8Array(32);
			expectTypeOf(arr).toMatchTypeOf<SharedSecret>();
		});

		it("is assignable to Uint8Array", () => {
			type Test = SharedSecret extends Uint8Array ? true : false;
			const result: Test = true;
			expectTypeOf(result).toEqualTypeOf<true>();
		});
	});

	describe("usage patterns", () => {
		it("SharedSecret for function returns", () => {
			function computeSharedSecret(): SharedSecret {
				return new Uint8Array(32);
			}
			expectTypeOf(computeSharedSecret).returns.toEqualTypeOf<SharedSecret>();
		});

		it("SharedSecret in ECDH result", () => {
			type ECDH = (
				secretKey: Uint8Array,
				publicKey: Uint8Array,
			) => SharedSecret;
			expectTypeOf<ECDH>().returns.toEqualTypeOf<SharedSecret>();
		});

		it("SharedSecret for key derivation", () => {
			type DeriveKey = (shared: SharedSecret) => Uint8Array;
			expectTypeOf<DeriveKey>().parameter(0).toEqualTypeOf<SharedSecret>();
		});

		it("SharedSecret in encryption context", () => {
			type EncryptionKey = {
				shared: SharedSecret;
				salt: Uint8Array;
				info: string;
			};
			expectTypeOf<EncryptionKey>().toEqualTypeOf<{
				shared: SharedSecret;
				salt: Uint8Array;
				info: string;
			}>();
		});
	});

	describe("type compatibility", () => {
		it("compatible with typed arrays", () => {
			const secret: SharedSecret = new Uint8Array(32);
			expectTypeOf(secret).toEqualTypeOf<SharedSecret>();
		});

		it("compatible with ArrayBuffer views", () => {
			const buffer = new ArrayBuffer(32);
			const secret: SharedSecret = new Uint8Array(buffer);
			expectTypeOf(secret).toEqualTypeOf<SharedSecret>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not SharedSecret
			const secret: SharedSecret = "shared secret";
			expectTypeOf(secret).not.toEqualTypeOf<string>();
		});

		it("not compatible with bigint", () => {
			// @ts-expect-error - bigint is not SharedSecret
			const secret: SharedSecret = 123n;
			expectTypeOf(secret).not.toEqualTypeOf<bigint>();
		});

		it("not compatible with number", () => {
			// @ts-expect-error - number is not SharedSecret
			const secret: SharedSecret = 42;
			expectTypeOf(secret).not.toEqualTypeOf<number>();
		});
	});

	describe("ECDH properties", () => {
		it("represents result of scalar multiplication", () => {
			const shared: SharedSecret = new Uint8Array(32);
			expectTypeOf(shared).toEqualTypeOf<SharedSecret>();
		});

		it("symmetric property - same for both parties", () => {
			type ComputeShared = (sk: Uint8Array, pk: Uint8Array) => SharedSecret;
			const compute: ComputeShared = () => new Uint8Array(32);
			expectTypeOf(compute).returns.toEqualTypeOf<SharedSecret>();
		});

		it("supports KDF input", () => {
			type KDF = (
				secret: SharedSecret,
				salt: Uint8Array,
				info: string,
			) => Uint8Array;
			expectTypeOf<KDF>().parameter(0).toEqualTypeOf<SharedSecret>();
		});
	});

	describe("security considerations", () => {
		it("can be zeroed after use", () => {
			const secret: SharedSecret = new Uint8Array(32);
			secret.fill(0);
			expectTypeOf(secret).toEqualTypeOf<SharedSecret>();
		});

		it("supports secure memory patterns", () => {
			function zeroize(secret: SharedSecret): void {
				secret.fill(0);
			}
			expectTypeOf(zeroize).parameter(0).toEqualTypeOf<SharedSecret>();
		});

		it("supports constant-time comparison", () => {
			function constantTimeCompare(a: SharedSecret, b: SharedSecret): boolean {
				let result = 0;
				for (let i = 0; i < a.length; i++) {
					result |= (a[i] ?? 0) ^ (b[i] ?? 0);
				}
				return result === 0;
			}
			expectTypeOf(constantTimeCompare).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from Uint8Array to SharedSecret", () => {
			function isSharedSecret(value: Uint8Array): value is SharedSecret {
				return value.length === 32;
			}
			expectTypeOf(isSharedSecret).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = SharedSecret | Error;
			function isSecret(value: Result): value is SharedSecret {
				return value instanceof Uint8Array;
			}
			expectTypeOf(isSecret).returns.toEqualTypeOf<boolean>();
		});

		it("handles optional shared secrets", () => {
			type MaybeShared = SharedSecret | undefined;
			function hasShared(value: MaybeShared): value is SharedSecret {
				return value !== undefined;
			}
			expectTypeOf(hasShared).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly and mutability", () => {
		it("mutable by default", () => {
			const secret: SharedSecret = new Uint8Array(32);
			secret[0] = 1;
			expectTypeOf(secret).toEqualTypeOf<SharedSecret>();
		});

		it("can be made readonly", () => {
			const secret: Readonly<SharedSecret> = new Uint8Array(32);
			expectTypeOf(secret).toEqualTypeOf<Readonly<SharedSecret>>();
		});

		it("readonly prevents modification", () => {
			const secret: Readonly<SharedSecret> = new Uint8Array(32);
			// @ts-expect-error - readonly prevents assignment
			secret[0] = 1;
			expectTypeOf(secret).toMatchTypeOf<Readonly<Uint8Array>>();
		});
	});
});
