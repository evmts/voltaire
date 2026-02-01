import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { create as _create, equals as _equals, from as _from, hashCode as _hashCode, toString as _toString, } from "./index.js";
const isAddr20 = (b) => b instanceof Uint8Array && b.length === 20;
export const StorageKeyBrand = Brand.refined((_) => true, () => Brand.error("Invalid storage key"));
export class StorageKeySchema extends Schema.Class("StorageKey")({
    address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => "address must be 20 bytes" })),
    slot: Schema.BigIntFromSelf,
}) {
    get key() {
        // biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion to branded type
        return _create(this.address, this.slot);
    }
    get branded() {
        return this.key;
    }
    static fromBranded(brand) {
        return new StorageKeySchema({
            // biome-ignore lint/suspicious/noExplicitAny: branded type property access
            address: brand.address,
            // biome-ignore lint/suspicious/noExplicitAny: branded type property access
            slot: brand.slot,
            // biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion
        });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: branded type property access
        if (value && value.address && value.slot !== undefined)
            // biome-ignore lint/suspicious/noExplicitAny: branded type coercion
            return new StorageKeySchema(value);
        // biome-ignore lint/suspicious/noExplicitAny: branded type coercion
        const k = _from(value);
        return new StorageKeySchema({
            // biome-ignore lint/suspicious/noExplicitAny: branded type property access
            address: k.address,
            // biome-ignore lint/suspicious/noExplicitAny: branded type property access
            slot: k.slot,
            // biome-ignore lint/suspicious/noExplicitAny: Effect Schema type coercion
        });
    }
    toString() {
        return _toString(this.key);
    }
    equals(other) {
        const rhs = other instanceof StorageKeySchema ? other.key : other;
        return _equals(this.key, rhs);
    }
    hashCode() {
        return _hashCode(this.key);
    }
}
