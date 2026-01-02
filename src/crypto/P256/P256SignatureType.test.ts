import { describe, expectTypeOf, it } from "vitest";
import type { HashType } from "../../primitives/Hash/index.js";
import type { P256SignatureType } from "./P256SignatureType.js";

type Equals<T, U> =
	(<G>() => G extends T ? 1 : 2) extends <G>() => G extends U ? 1 : 2
		? true
		: false;

describe("P256SignatureType", () => {
	describe("type structure", () => {
		it("P256SignatureType is object with r and s", () => {
			expectTypeOf<P256SignatureType>().toEqualTypeOf<{
				r: HashType;
				s: HashType;
			}>();
		});

		it("has r component of type HashType", () => {
			type RType = P256SignatureType["r"];
			expectTypeOf<RType>().toEqualTypeOf<HashType>();
		});

		it("has s component of type HashType", () => {
			type SType = P256SignatureType["s"];
			expectTypeOf<SType>().toEqualTypeOf<HashType>();
		});

		it("requires both r and s components", () => {
			type Test = keyof P256SignatureType;
			expectTypeOf<Test>().toEqualTypeOf<"r" | "s">();
		});

		it("not assignable to Uint8Array", () => {
			type Test = P256SignatureType extends Uint8Array ? true : false;
			const result: Test = false;
			expectTypeOf(result).toEqualTypeOf<false>();
		});
	});

	describe("usage patterns", () => {
		it("P256SignatureType for function parameters", () => {
			function acceptsSignature(_sig: P256SignatureType): void {}
			expectTypeOf(acceptsSignature)
				.parameter(0)
				.toEqualTypeOf<P256SignatureType>();
		});

		it("P256SignatureType for function returns", () => {
			function returnsSignature(): P256SignatureType {
				return {
					r: new Uint8Array(32) as HashType,
					s: new Uint8Array(32) as HashType,
				};
			}
			expectTypeOf(returnsSignature).returns.toEqualTypeOf<P256SignatureType>();
		});

		it("P256SignatureType in verification", () => {
			type Verify = (
				sig: P256SignatureType,
				msg: Uint8Array,
				pk: Uint8Array,
			) => boolean;
			expectTypeOf<Verify>().parameter(0).toEqualTypeOf<P256SignatureType>();
		});

		it("P256SignatureType with metadata", () => {
			type SignatureWithMeta = P256SignatureType & { timestamp: number };
			expectTypeOf<SignatureWithMeta>().toMatchTypeOf<P256SignatureType>();
		});
	});

	describe("type compatibility", () => {
		it("requires exact structure", () => {
			const sig: P256SignatureType = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig).toEqualTypeOf<P256SignatureType>();
		});

		it("not compatible with missing r", () => {
			// @ts-expect-error - missing r component
			const sig: P256SignatureType = {
				s: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig).not.toEqualTypeOf<P256SignatureType>();
		});

		it("not compatible with missing s", () => {
			// @ts-expect-error - missing s component
			const sig: P256SignatureType = {
				r: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig).not.toEqualTypeOf<P256SignatureType>();
		});

		it("not compatible with wrong types", () => {
			// @ts-expect-error - wrong types for r and s
			const sig: P256SignatureType = {
				r: "0x123",
				s: "0x456",
			};
			expectTypeOf(sig).not.toEqualTypeOf<P256SignatureType>();
		});

		it("not compatible with Uint8Array", () => {
			const arr = new Uint8Array(64);
			// @ts-expect-error - Uint8Array is not P256SignatureType
			const sig: P256SignatureType = arr;
			expectTypeOf(sig).not.toEqualTypeOf<Uint8Array>();
		});

		it("not compatible with string", () => {
			// @ts-expect-error - string is not P256SignatureType
			const sig: P256SignatureType = "signature";
			expectTypeOf(sig).not.toEqualTypeOf<string>();
		});
	});

	describe("ECDSA components", () => {
		it("r represents x-coordinate of ephemeral public key", () => {
			const sig: P256SignatureType = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig.r).toEqualTypeOf<HashType>();
		});

		it("s represents signature proof value", () => {
			const sig: P256SignatureType = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig.s).toEqualTypeOf<HashType>();
		});

		it("supports component extraction", () => {
			function extractR(sig: P256SignatureType): HashType {
				return sig.r;
			}
			expectTypeOf(extractR).returns.toEqualTypeOf<HashType>();
		});

		it("supports component extraction for s", () => {
			function extractS(sig: P256SignatureType): HashType {
				return sig.s;
			}
			expectTypeOf(extractS).returns.toEqualTypeOf<HashType>();
		});
	});

	describe("DER encoding compatibility", () => {
		it("can be converted to DER format", () => {
			function toDER(_sig: P256SignatureType): Uint8Array {
				return new Uint8Array(0);
			}
			expectTypeOf(toDER).parameter(0).toEqualTypeOf<P256SignatureType>();
		});

		it("can be parsed from DER format", () => {
			function fromDER(_der: Uint8Array): P256SignatureType {
				return {
					r: new Uint8Array(32) as HashType,
					s: new Uint8Array(32) as HashType,
				};
			}
			expectTypeOf(fromDER).returns.toEqualTypeOf<P256SignatureType>();
		});
	});

	describe("compact format compatibility", () => {
		it("can be converted to compact 64-byte format", () => {
			function toCompact(sig: P256SignatureType): Uint8Array {
				const compact = new Uint8Array(64);
				compact.set(sig.r, 0);
				compact.set(sig.s, 32);
				return compact;
			}
			expectTypeOf(toCompact).parameter(0).toEqualTypeOf<P256SignatureType>();
		});

		it("can be parsed from compact format", () => {
			function fromCompact(compact: Uint8Array): P256SignatureType {
				return {
					r: compact.slice(0, 32) as HashType,
					s: compact.slice(32, 64) as HashType,
				};
			}
			expectTypeOf(fromCompact).returns.toEqualTypeOf<P256SignatureType>();
		});
	});

	describe("type narrowing", () => {
		it("narrows from unknown to P256SignatureType", () => {
			function isP256Signature(value: unknown): value is P256SignatureType {
				return (
					typeof value === "object" &&
					value !== null &&
					"r" in value &&
					"s" in value
				);
			}
			expectTypeOf(isP256Signature).returns.toEqualTypeOf<boolean>();
		});

		it("discriminates union types", () => {
			type Result = P256SignatureType | Error;
			function isSig(value: Result): value is P256SignatureType {
				return "r" in value && "s" in value;
			}
			expectTypeOf(isSig).returns.toEqualTypeOf<boolean>();
		});

		it("handles optional signatures", () => {
			type MaybeSignature = P256SignatureType | undefined;
			function hasSig(value: MaybeSignature): value is P256SignatureType {
				return value !== undefined;
			}
			expectTypeOf(hasSig).returns.toEqualTypeOf<boolean>();
		});
	});

	describe("readonly and mutability", () => {
		it("components mutable by default", () => {
			const sig: P256SignatureType = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			sig.r[0] = 1;
			expectTypeOf(sig).toEqualTypeOf<P256SignatureType>();
		});

		it("can be made readonly", () => {
			const sig: Readonly<P256SignatureType> = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			expectTypeOf(sig).toEqualTypeOf<Readonly<P256SignatureType>>();
		});

		it("readonly prevents property reassignment", () => {
			const sig: Readonly<P256SignatureType> = {
				r: new Uint8Array(32) as HashType,
				s: new Uint8Array(32) as HashType,
			};
			// @ts-expect-error - readonly prevents reassignment
			sig.r = new Uint8Array(32) as HashType;
			expectTypeOf(sig).toMatchTypeOf<Readonly<P256SignatureType>>();
		});

		it("deeply readonly prevents component mutation", () => {
			type DeepReadonly<T> = {
				readonly [K in keyof T]: Readonly<T[K]>;
			};
			const sig: DeepReadonly<P256SignatureType> = {
				r: new Uint8Array(32) as Readonly<HashType>,
				s: new Uint8Array(32) as Readonly<HashType>,
			};
			// @ts-expect-error - readonly prevents mutation
			sig.r[0] = 1;
			expectTypeOf(sig).toMatchTypeOf<DeepReadonly<P256SignatureType>>();
		});
	});
});
