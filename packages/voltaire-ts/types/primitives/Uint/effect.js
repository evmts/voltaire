import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
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
export const UintBrand = Brand.refined((n) => _isValid(n), (n) => Brand.error(`Expected 0 <= n <= 2^256-1, got ${String(n)}`));
export class UintSchema extends Schema.Class("Uint")({
    value: Schema.BigIntFromSelf.pipe(Schema.filter((n) => _isValid(n), {
        message: () => "Invalid uint256: must be 0 <= n <= 2^256-1",
    })),
}) {
    get uint() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new UintSchema({ value: brand });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: union type coercion to from() overloads
        const u = _from(value);
        return new UintSchema({ value: u });
    }
    static fromHex(hex) {
        const u = _fromHex(hex);
        return new UintSchema({ value: u });
    }
    static fromBytes(bytes) {
        const u = _fromBytes(bytes);
        return new UintSchema({ value: u });
    }
    static fromNumber(n) {
        const u = _fromNumber(n);
        return new UintSchema({ value: u });
    }
    toHex(padded = true) {
        return _toHex(this.uint, padded);
    }
    toBigInt() {
        return _toBigInt(this.uint);
    }
    toNumber() {
        return _toNumber(this.uint);
    }
    toBytes() {
        return _toBytes(this.uint);
    }
    plus(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        const v = _plus(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    minus(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        const v = _minus(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    times(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        const v = _times(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    dividedBy(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        const v = _dividedBy(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    modulo(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        const v = _modulo(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    toPower(exp) {
        const rhs = exp instanceof UintSchema ? exp.uint : exp;
        const v = _toPower(this.uint, rhs);
        return new UintSchema({ value: v });
    }
    equals(other) {
        const rhs = other instanceof UintSchema ? other.uint : other;
        return _equals(this.uint, rhs);
    }
    bitLength() {
        return _bitLength(this.uint);
    }
    leadingZeros() {
        return _leadingZeros(this.uint);
    }
    popCount() {
        return _popCount(this.uint);
    }
}
export const UintFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Number, Schema.BigIntFromSelf), Schema.instanceOf(UintSchema), {
    // biome-ignore lint/suspicious/noExplicitAny: union type coercion to from() overloads
    decode: (v) => UintSchema.from(v),
    encode: (u) => u.uint,
});
