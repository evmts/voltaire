import { describe, it } from "vitest";
import type { PublicKeyType } from "./PublicKeyType.js";

// Type-level testing utilities
type Equals<T, U> = (<V>() => V extends T ? 1 : 2) extends <V>() => V extends U
	? 1
	: 2
	? true
	: false;

describe("PublicKeyType", () => {
	describe("type structure", () => {
		it("is a Uint8Array", () => {
			type Test = Equals<PublicKeyType extends Uint8Array ? true : false, true>;
			const assertion: Test = true;
			assertion;
		});

		it("has length 64", () => {
			type Test = Equals<PublicKeyType["length"], 64>;
			const assertion: Test = true;
			assertion;
		});

		it("is branded", () => {
			type HasBrand = "__tag" extends keyof PublicKeyType ? true : false;
			type Test = Equals<HasBrand, true>;
			const assertion: Test = true;
			assertion;
		});

		it("is not assignable to plain Uint8Array", () => {
			const _test = (_pk: PublicKeyType) => {
				// @ts-expect-error - PublicKeyType is not assignable to Uint8Array
				const _bytes: Uint8Array = _pk;
			};
		});

		it("plain Uint8Array is not assignable to PublicKeyType", () => {
			const _test = (_bytes: Uint8Array) => {
				// @ts-expect-error - Uint8Array is not assignable to PublicKeyType
				const _pk: PublicKeyType = _bytes;
			};
		});
	});

	describe("readonly properties", () => {
		it("length is readonly", () => {
			const _test = (pk: PublicKeyType) => {
				// @ts-expect-error - length is readonly
				pk.length = 32;
			};
		});

		it("brand tag is readonly", () => {
			const _test = (pk: PublicKeyType) => {
				// @ts-expect-error - brand is readonly
				pk["__tag"] = "Something";
			};
		});
	});

	describe("type compatibility", () => {
		it("is not compatible with 32-byte array", () => {
			type PrivateKeyLike = Uint8Array & { readonly length: 32 };
			type Test = Equals<PublicKeyType, PrivateKeyLike>;
			const assertion: Test = false;
			assertion;
		});

		it("is not compatible with 20-byte array", () => {
			type AddressLike = Uint8Array & { readonly length: 20 };
			type Test = Equals<PublicKeyType, AddressLike>;
			const assertion: Test = false;
			assertion;
		});

		it("is not compatible with plain 64-byte array", () => {
			type GenericArray = Uint8Array & { readonly length: 64 };
			type Test = Equals<PublicKeyType, GenericArray>;
			const assertion: Test = false;
			assertion;
		});

		it("two PublicKeyType are the same type", () => {
			type Test = Equals<PublicKeyType, PublicKeyType>;
			const assertion: Test = true;
			assertion;
		});
	});

	describe("length constraints", () => {
		it("rejects 32 bytes", () => {
			type ShortArray = Uint8Array & { readonly length: 32 };
			const _test = (_short: ShortArray) => {
				// @ts-expect-error - 32 bytes is not valid
				const _pk: PublicKeyType = _short;
			};
		});

		it("rejects 63 bytes", () => {
			type AlmostArray = Uint8Array & { readonly length: 63 };
			const _test = (_almost: AlmostArray) => {
				// @ts-expect-error - 63 bytes is not valid
				const _pk: PublicKeyType = _almost;
			};
		});

		it("rejects 65 bytes", () => {
			type LongArray = Uint8Array & { readonly length: 65 };
			const _test = (_long: LongArray) => {
				// @ts-expect-error - 65 bytes is not valid
				const _pk: PublicKeyType = _long;
			};
		});

		it("rejects 0 bytes", () => {
			type EmptyArray = Uint8Array & { readonly length: 0 };
			const _test = (_empty: EmptyArray) => {
				// @ts-expect-error - 0 bytes is not valid
				const _pk: PublicKeyType = _empty;
			};
		});

		it("rejects 20 bytes", () => {
			type AddressArray = Uint8Array & { readonly length: 20 };
			const _test = (_addr: AddressArray) => {
				// @ts-expect-error - 20 bytes is not valid
				const _pk: PublicKeyType = _addr;
			};
		});

		it("rejects 128 bytes", () => {
			type DoubleArray = Uint8Array & { readonly length: 128 };
			const _test = (_double: DoubleArray) => {
				// @ts-expect-error - 128 bytes is not valid
				const _pk: PublicKeyType = _double;
			};
		});
	});

	describe("brand uniqueness", () => {
		it("has unique PublicKey brand", () => {
			type Brand = PublicKeyType["__tag"];
			type Test = Equals<Brand, "PublicKey">;
			const assertion: Test = true;
			assertion;
		});

		it("is not compatible with other brands", () => {
			type OtherBrand = Uint8Array & {
				readonly __tag: "SomethingElse";
				readonly length: 64;
			};
			type Test = Equals<PublicKeyType, OtherBrand>;
			const assertion: Test = false;
			assertion;
		});

		it("is not compatible with PrivateKey brand", () => {
			type PrivateKeyBrand = Uint8Array & {
				readonly __tag: "PrivateKey";
				readonly length: 64;
			};
			type Test = Equals<PublicKeyType, PrivateKeyBrand>;
			const assertion: Test = false;
			assertion;
		});
	});

	describe("immutability", () => {
		it("brand property is readonly", () => {
			const _test = (pk: PublicKeyType) => {
				// @ts-expect-error - cannot reassign readonly property
				pk["__tag"] = "Modified" as any;
			};
		});

		it("length property is readonly", () => {
			const _test = (pk: PublicKeyType) => {
				// @ts-expect-error - cannot reassign readonly length
				pk.length = 32 as any;
			};
		});
	});

	describe("utility type compatibility", () => {
		it("can be used with Array.from", () => {
			const _test = (pk: PublicKeyType): number[] => {
				return Array.from(pk);
			};
		});

		it("can be used with spread operator", () => {
			const _test = (pk: PublicKeyType): number[] => {
				return [...pk];
			};
		});

		it("can be indexed", () => {
			const _test = (pk: PublicKeyType): number | undefined => {
				return pk[0];
			};
		});

		it("can be sliced", () => {
			const _test = (pk: PublicKeyType): Uint8Array => {
				return pk.slice(0, 32);
			};
		});

		it("slice returns plain Uint8Array not PublicKeyType", () => {
			const _test = (pk: PublicKeyType) => {
				const sliced = pk.slice(0, 32);
				// @ts-expect-error - slice returns plain Uint8Array
				const _pk: PublicKeyType = sliced;
			};
		});
	});

	describe("coordinate access", () => {
		it("can extract x coordinate", () => {
			const _test = (pk: PublicKeyType): Uint8Array => {
				return pk.slice(0, 32);
			};
		});

		it("can extract y coordinate", () => {
			const _test = (pk: PublicKeyType): Uint8Array => {
				return pk.slice(32, 64);
			};
		});

		it("x coordinate slice is not PublicKeyType", () => {
			const _test = (pk: PublicKeyType) => {
				const x = pk.slice(0, 32);
				// @ts-expect-error - x is Uint8Array not PublicKeyType
				const _pk: PublicKeyType = x;
			};
		});

		it("y coordinate slice is not PublicKeyType", () => {
			const _test = (pk: PublicKeyType) => {
				const y = pk.slice(32, 64);
				// @ts-expect-error - y is Uint8Array not PublicKeyType
				const _pk: PublicKeyType = y;
			};
		});
	});

	describe("assignability", () => {
		it("requires exact type", () => {
			const _test = () => {
				const bytes = new Uint8Array(64);
				// @ts-expect-error - plain Uint8Array is not PublicKeyType
				const _pk: PublicKeyType = bytes;
			};
		});

		it("can be assigned to wider type", () => {
			const _test = (pk: PublicKeyType) => {
				const bytes: Uint8Array = pk;
				bytes;
			};
		});

		it("cannot be assigned from narrower type", () => {
			const _test = () => {
				const bytes = new Uint8Array(64);
				// @ts-expect-error - missing brand
				const _pk: PublicKeyType = bytes as PublicKeyType & {
					readonly length: 64;
				};
			};
		});
	});

	describe("semantic meaning", () => {
		it("represents uncompressed secp256k1 public key", () => {
			type Test = Equals<PublicKeyType["length"], 64>;
			const assertion: Test = true;
			assertion;
		});

		it("is 64 bytes without 0x04 prefix", () => {
			type Test = Equals<PublicKeyType["length"], 64>;
			const assertion: Test = true;
			assertion;
		});

		it("contains x and y coordinates", () => {
			const _test = (pk: PublicKeyType) => {
				const x: Uint8Array = pk.slice(0, 32);
				const y: Uint8Array = pk.slice(32, 64);
				x;
				y;
			};
		});
	});

	describe("comparison with related types", () => {
		it("is different from PrivateKeyType", () => {
			type PrivateKeyLike = Uint8Array & {
				readonly __tag: "PrivateKey";
				readonly length: 32;
			};
			type Test = Equals<PublicKeyType, PrivateKeyLike>;
			const assertion: Test = false;
			assertion;
		});

		it("is different from AddressType", () => {
			type AddressLike = Uint8Array & {
				readonly __tag: "Address";
				readonly length: 20;
			};
			type Test = Equals<PublicKeyType, AddressLike>;
			const assertion: Test = false;
			assertion;
		});

		it("is different from HashType", () => {
			type HashLike = Uint8Array & {
				readonly __tag: "Hash";
				readonly length: 32;
			};
			type Test = Equals<PublicKeyType, HashLike>;
			const assertion: Test = false;
			assertion;
		});
	});
});
