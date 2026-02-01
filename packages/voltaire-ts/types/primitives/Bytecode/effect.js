import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { equals as _equals } from "./equals.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { size as _size } from "./size.js";
import { toHex as _toHex } from "./toHex.js";
import { validate as _validate } from "./validate.js";
export const BytecodeBrand = Brand.refined((bytes) => 
// biome-ignore lint/suspicious/noExplicitAny: type coercion required
bytes instanceof Uint8Array && _validate(bytes), () => Brand.error("Invalid Bytecode: validation failed"));
export class BytecodeSchema extends Schema.Class("Bytecode")({
    value: Schema.Uint8ArrayFromSelf.pipe(Schema.filter((bytes) => 
    // biome-ignore lint/suspicious/noExplicitAny: type coercion required
    bytes instanceof Uint8Array && _validate(bytes), {
        message: () => "Invalid bytecode: validation failed",
    })),
}) {
    get bytecode() {
        return this.value;
    }
    get branded() {
        return this.value;
    }
    static fromBranded(brand) {
        return new BytecodeSchema({ value: brand });
    }
    static from(value) {
        return new BytecodeSchema({ value: _from(value) });
    }
    static fromHex(hex) {
        return new BytecodeSchema({ value: _fromHex(hex) });
    }
    toHex(prefix = true) {
        return _toHex(this.bytecode, prefix);
    }
    equals(other) {
        const rhs = other instanceof BytecodeSchema ? other.bytecode : other;
        return _equals(this.bytecode, rhs);
    }
    size() {
        return _size(this.bytecode);
    }
}
export const BytecodeFromUnknown = Schema.transform(Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf), Schema.instanceOf(BytecodeSchema), {
    decode: (v) => typeof v === "string"
        ? BytecodeSchema.fromHex(v)
        : BytecodeSchema.from(v),
    encode: (b) => b.bytecode,
});
