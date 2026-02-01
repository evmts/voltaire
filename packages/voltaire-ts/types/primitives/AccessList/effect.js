import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { assertValid as _assertValid } from "./assertValid.js";
import { create as _create } from "./create.js";
import { deduplicate as _deduplicate } from "./deduplicate.js";
import { from as _from } from "./from.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { gasCost as _gasCost } from "./gasCost.js";
import { gasSavings as _gasSavings } from "./gasSavings.js";
import { hasSavings as _hasSavings } from "./hasSavings.js";
import { includesAddress as _includesAddress } from "./includesAddress.js";
import { includesStorageKey as _includesStorageKey } from "./includesStorageKey.js";
import { is as _is } from "./is.js";
import { keysFor as _keysFor } from "./keysFor.js";
import { merge as _merge } from "./merge.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { withAddress as _withAddress } from "./withAddress.js";
import { withStorageKey as _withStorageKey } from "./withStorageKey.js";
const isAddr20 = (b) => b instanceof Uint8Array && b.length === 20;
const isHash32 = (b) => b instanceof Uint8Array && b.length === 32;
export const AccessListBrand = Brand.refined((list) => _is(list), () => Brand.error("Invalid AccessList: structure validation failed"));
const ItemSchema = Schema.Struct({
    address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => "address must be 20 bytes" })),
    storageKeys: Schema.Array(Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, {
        message: () => "storage key must be 32 bytes",
    }))),
});
export class AccessListSchema extends Schema.Class("AccessList")({
    value: Schema.Array(ItemSchema),
}) {
    get accessList() {
        // value is validated structurally; coerce to branded type
        return this.value;
    }
    get branded() {
        return this.accessList;
    }
    static fromBranded(list) {
        return new AccessListSchema({
            value: list,
        });
    }
    static from(value) {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        const list = _from(value);
        return AccessListSchema.fromBranded(list);
    }
    static fromBytes(bytes) {
        const list = _fromBytes(bytes);
        return AccessListSchema.fromBranded(list);
    }
    static create() {
        const list = _create();
        return AccessListSchema.fromBranded(list);
    }
    toBytes() {
        return _toBytes(this.accessList);
    }
    gasCost() {
        return _gasCost(this.accessList);
    }
    gasSavings() {
        return _gasSavings(this.accessList);
    }
    hasSavings() {
        return _hasSavings(this.accessList);
    }
    includesAddress(address) {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return _includesAddress(this.accessList, address);
    }
    includesStorageKey(address, storageKey) {
        return _includesStorageKey(this.accessList, 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        address, 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        storageKey);
    }
    keysFor(address) {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return _keysFor(this.accessList, address);
    }
    deduplicate() {
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        return AccessListSchema.fromBranded(_deduplicate(this.accessList));
    }
    withAddress(address) {
        return AccessListSchema.fromBranded(
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        _withAddress(this.accessList, address));
    }
    withStorageKey(address, storageKey) {
        return AccessListSchema.fromBranded(_withStorageKey(this.accessList, 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        address, 
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        storageKey));
    }
    merge(...others) {
        const lists = others.map((o) => o instanceof AccessListSchema ? o.accessList : o);
        return AccessListSchema.fromBranded(
        // biome-ignore lint/suspicious/noExplicitAny: type coercion required
        _merge(this.accessList, ...lists));
    }
    assertValid() {
        _assertValid(this.accessList);
    }
}
