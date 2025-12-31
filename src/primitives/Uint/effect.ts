import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";

import type { Uint256Type } from "./Uint256Type.js";
import { bitLength as _bitLength } from "./bitLength.js";
import { dividedBy as _dividedBy } from "./dividedBy.js";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromNumber as _fromNumber } from "./fromNumber.js";
import { isValid as _isValid } from "./isValid.js";
import { leadingZeros as _leadingZeros } from "./leadingZeros.js";
import { minus as _minus } from "./minus.js";
import { modulo as _modulo } from "./modulo.js";
import { plus as _plus } from "./plus.js";
import { popCount as _popCount } from "./popCount.js";
import { times as _times } from "./times.js";
import { toBigInt as _toBigInt } from "./toBigInt.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
import { toNumber as _toNumber } from "./toNumber.js";
import { toPower as _toPower } from "./toPower.js";

export type UintBrand = bigint & Brand.Brand<"Uint256">;

export const UintBrand = Brand.refined<UintBrand>(
	(n): n is bigint & Brand.Brand<"Uint256"> => _isValid(n),
	(n) => Brand.error(`Expected 0 <= n <= 2^256-1, got ${String(n)}`),
);

export class UintSchema extends Schema.Class<UintSchema>("Uint")({
	value: Schema.BigIntFromSelf.pipe(
		Schema.filter((n): n is bigint => _isValid(n), {
			message: () => "Invalid uint256: must be 0 <= n <= 2^256-1",
		}),
	),
}) {
	get uint(): Uint256Type {
		return this.value as Uint256Type;
	}

	get branded(): UintBrand {
		return this.value as UintBrand;
	}

	static fromBranded(brand: UintBrand): UintSchema {
		return new UintSchema({ value: brand });
	}

	static from(value: string | number | bigint): UintSchema {
		// biome-ignore lint/suspicious/noExplicitAny: union type coercion to from() overloads
		const u = _from(value as any);
		return new UintSchema({ value: u });
	}

	static fromHex(hex: string): UintSchema {
		const u = _fromHex(hex);
		return new UintSchema({ value: u });
	}

	static fromBytes(bytes: Uint8Array): UintSchema {
		const u = _fromBytes(bytes);
		return new UintSchema({ value: u });
	}

	static fromNumber(n: number): UintSchema {
		const u = _fromNumber(n);
		return new UintSchema({ value: u });
	}

	toHex(padded = true): string {
		return _toHex(this.uint, padded);
	}

	toBigInt(): bigint {
		return _toBigInt(this.uint);
	}

	toNumber(): number {
		return _toNumber(this.uint);
	}

	toBytes(): Uint8Array {
		return _toBytes(this.uint);
	}

	plus(other: UintSchema | Uint256Type): UintSchema {
		const rhs = other instanceof UintSchema ? other.uint : other;
		const v = _plus(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	minus(other: UintSchema | Uint256Type): UintSchema {
		const rhs = other instanceof UintSchema ? other.uint : other;
		const v = _minus(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	times(other: UintSchema | Uint256Type): UintSchema {
		const rhs = other instanceof UintSchema ? other.uint : other;
		const v = _times(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	dividedBy(other: UintSchema | Uint256Type): UintSchema {
		const rhs = other instanceof UintSchema ? other.uint : other;
		const v = _dividedBy(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	modulo(other: UintSchema | Uint256Type): UintSchema {
		const rhs = other instanceof UintSchema ? other.uint : other;
		const v = _modulo(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	toPower(exp: UintSchema | Uint256Type): UintSchema {
		const rhs = exp instanceof UintSchema ? exp.uint : exp;
		const v = _toPower(this.uint, rhs as Uint256Type);
		return new UintSchema({ value: v });
	}

	equals(other: UintSchema | Uint256Type): boolean {
		const rhs = other instanceof UintSchema ? other.uint : other;
		return _equals(this.uint, rhs as Uint256Type);
	}

	bitLength(): number {
		return _bitLength(this.uint);
	}
	leadingZeros(): number {
		return _leadingZeros(this.uint);
	}
	popCount(): number {
		return _popCount(this.uint);
	}
}

export const UintFromUnknown = Schema.transform(
	Schema.Union(Schema.String, Schema.Number, Schema.BigIntFromSelf),
	Schema.instanceOf(UintSchema),
	{
		// biome-ignore lint/suspicious/noExplicitAny: union type coercion to from() overloads
		decode: (v) => UintSchema.from(v as any),
		encode: (u) => u.uint,
	},
);
