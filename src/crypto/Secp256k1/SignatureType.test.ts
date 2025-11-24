import { describe, it } from "vitest";
import type { HashType } from "../../primitives/Hash/index.js";
import type { Secp256k1SignatureType } from "./SignatureType.js";

type Equals<X, Y> = (<T>() => T extends X ? 1 : 2) extends <T>() => T extends Y
	? 1
	: 2
	? true
	: false;

describe("Secp256k1SignatureType", () => {
	describe("type structure", () => {
		it("should have r property of type HashType", () => {
			const test: Equals<Secp256k1SignatureType["r"], HashType> = true;
			test;
		});

		it("should have s property of type HashType", () => {
			const test: Equals<Secp256k1SignatureType["s"], HashType> = true;
			test;
		});

		it("should have v property of type number", () => {
			const test: Equals<Secp256k1SignatureType["v"], number> = true;
			test;
		});

		it("should have exactly three properties", () => {
			const sig = {} as Secp256k1SignatureType;
			const test: Equals<keyof typeof sig, "r" | "s" | "v"> = true;
			test;
		});
	});

	describe("type compatibility", () => {
		it("should not be assignable from plain object", () => {
			const plainObject = {
				r: new Uint8Array(32),
				s: new Uint8Array(32),
				v: 27,
			};

			// @ts-expect-error - plain object is not Secp256k1SignatureType
			const _sig: Secp256k1SignatureType = plainObject;
		});

		it("should not be assignable without r", () => {
			const noR = {
				// @ts-expect-error - missing r property
				s: {} as HashType,
				v: 27,
			};

			const _sig: Secp256k1SignatureType = noR;
		});

		it("should not be assignable without s", () => {
			const noS = {
				r: {} as HashType,
				// @ts-expect-error - missing s property
				v: 27,
			};

			const _sig: Secp256k1SignatureType = noS;
		});

		it("should not be assignable without v", () => {
			const noV = {
				r: {} as HashType,
				s: {} as HashType,
				// @ts-expect-error - missing v property
			};

			const _sig: Secp256k1SignatureType = noV;
		});

		it("should not accept wrong type for r", () => {
			const wrongR = {
				// @ts-expect-error - r must be HashType
				r: new Uint8Array(32),
				s: {} as HashType,
				v: 27,
			};

			const _sig: Secp256k1SignatureType = wrongR;
		});

		it("should not accept wrong type for s", () => {
			const wrongS = {
				r: {} as HashType,
				// @ts-expect-error - s must be HashType
				s: new Uint8Array(32),
				v: 27,
			};

			const _sig: Secp256k1SignatureType = wrongS;
		});

		it("should not accept wrong type for v", () => {
			const wrongV = {
				r: {} as HashType,
				s: {} as HashType,
				// @ts-expect-error - v must be number
				v: "27",
			};

			const _sig: Secp256k1SignatureType = wrongV;
		});
	});

	describe("v value types", () => {
		it("should accept v=27", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 27,
			};
			sig;
		});

		it("should accept v=28", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 28,
			};
			sig;
		});

		it("should accept v=0", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 0,
			};
			sig;
		});

		it("should accept v=1", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 1,
			};
			sig;
		});

		it("should accept EIP-155 v values", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 37, // Chain ID 1
			};
			sig;
		});

		it("should accept large v values", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 309, // Chain ID 137
			};
			sig;
		});
	});

	describe("HashType compatibility", () => {
		it("should require HashType for r component", () => {
			const sig = {
				r: {} as HashType,
				s: {} as HashType,
				v: 27,
			} satisfies Secp256k1SignatureType;
			sig;
		});

		it("should require HashType for s component", () => {
			const sig = {
				r: {} as HashType,
				s: {} as HashType,
				v: 27,
			} satisfies Secp256k1SignatureType;
			sig;
		});

		it("should not accept Uint8Array for r", () => {
			const sig = {
				// @ts-expect-error - r must be HashType, not Uint8Array
				r: new Uint8Array(32),
				s: {} as HashType,
				v: 27,
			};

			const _typed: Secp256k1SignatureType = sig;
		});

		it("should not accept Uint8Array for s", () => {
			const sig = {
				r: {} as HashType,
				// @ts-expect-error - s must be HashType, not Uint8Array
				s: new Uint8Array(32),
				v: 27,
			};

			const _typed: Secp256k1SignatureType = sig;
		});
	});

	describe("object shape", () => {
		it("should be an interface", () => {
			const sig: Secp256k1SignatureType = {
				r: {} as HashType,
				s: {} as HashType,
				v: 27,
			};
			sig;
		});

		it("should not accept additional properties", () => {
			const sig = {
				r: {} as HashType,
				s: {} as HashType,
				v: 27,
				// @ts-expect-error - extra property not allowed
				extra: "value",
			};

			const _typed: Secp256k1SignatureType = sig;
		});
	});

	describe("deprecated alias", () => {
		it("should have BrandedSignature alias", () => {
			const test: Equals<
				import("./SignatureType.js").BrandedSignature,
				Secp256k1SignatureType
			> = true;
			test;
		});
	});
});
