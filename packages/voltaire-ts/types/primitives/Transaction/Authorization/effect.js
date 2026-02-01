import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import { getAuthorizer as _getAuthorizer } from "./getAuthorizer.js";
import { getSigningHash as _getSigningHash } from "./getSigningHash.js";
import { verifySignature as _verifySignature } from "./verifySignature.js";
const isAddr20 = (b) => b instanceof Uint8Array && b.length === 20;
const isHash32 = (b) => b instanceof Uint8Array && b.length === 32;
export const AuthorizationBrand = Brand.refined((_) => true, // structure validated by schema below
() => Brand.error("Invalid Authorization"));
export class AuthorizationSchema extends Schema.Class("Authorization")({
    chainId: Schema.BigIntFromSelf,
    address: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isAddr20, { message: () => "address must be 20 bytes" })),
    nonce: Schema.BigIntFromSelf,
    yParity: Schema.Number.pipe(Schema.filter((n) => n === 0 || n === 1, {
        message: () => "yParity must be 0 or 1",
    })),
    r: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => "r must be 32 bytes" })),
    s: Schema.Uint8ArrayFromSelf.pipe(Schema.filter(isHash32, { message: () => "s must be 32 bytes" })),
}) {
    get authorization() {
        return this;
    }
    get branded() {
        return this.authorization;
    }
    static fromBranded(brand) {
        // biome-ignore lint/suspicious/noExplicitAny: branded type property access
        const { chainId, address, nonce, yParity, r, s } = brand;
        return new AuthorizationSchema({ chainId, address, nonce, yParity, r, s });
    }
    static from(value) {
        return new AuthorizationSchema(value);
    }
    getSigningHash() {
        return _getSigningHash(this.authorization);
    }
    verifySignature() {
        return _verifySignature(this.authorization);
    }
    getAuthorizer() {
        return _getAuthorizer(this.authorization);
    }
}
