import * as Schema from "effect/Schema";
import * as Brand from "effect/Brand";

import type { SignatureType, SignatureAlgorithm } from "./SignatureType.js";
import { is as _is } from "./is.js";
import { from as _from } from "./from.js";
import { fromHex as _fromHex } from "./fromHex.js";
import { fromBytes as _fromBytes } from "./fromBytes.js";
import { toBytes as _toBytes } from "./toBytes.js";
import { toHex as _toHex } from "./toHex.js";
import { equals as _equals } from "./equals.js";
import { getR as _getR } from "./getR.js";
import { getS as _getS } from "./getS.js";
import { getV as _getV } from "./getV.js";
import { getAlgorithm as _getAlgorithm } from "./getAlgorithm.js";

export type SignatureBrand = Uint8Array & Brand.Brand<"Signature">;

export const SignatureBrand = Brand.refined<SignatureBrand>(
  (bytes): bytes is Uint8Array & Brand.Brand<"Signature"> => _is(bytes),
  () => Brand.error("Invalid Signature: expected SignatureType"),
);

export class SignatureSchema extends Schema.Class<SignatureSchema>("Signature")({
  value: Schema.Uint8ArrayFromSelf.pipe(
    Schema.filter((bytes): bytes is Uint8Array => _is(bytes), {
      message: () => "Invalid signature: not a SignatureType",
    }),
  ),
}) {
  get signature(): SignatureType {
    return this.value as SignatureType;
  }

  get branded(): SignatureBrand {
    return this.value as SignatureBrand;
  }

  static fromBranded(brand: SignatureBrand): SignatureSchema {
    return new SignatureSchema({ value: brand });
  }

  static from(value: Parameters<typeof _from>[0]): SignatureSchema {
    const s = _from(value as any);
    return new SignatureSchema({ value: s });
  }

  static fromHex(hex: string): SignatureSchema {
    const s = _fromHex(hex);
    return new SignatureSchema({ value: s });
  }

  static fromBytes(bytes: Uint8Array): SignatureSchema {
    const s = _fromBytes(bytes);
    return new SignatureSchema({ value: s });
  }

  toBytes(): Uint8Array { return _toBytes(this.signature); }
  toHex(): string { return _toHex(this.signature); }
  equals(other: SignatureSchema | SignatureType): boolean {
    const rhs = other instanceof SignatureSchema ? other.signature : other;
    return _equals(this.signature, rhs as SignatureType);
  }

  getR(): Uint8Array { return _getR(this.signature); }
  getS(): Uint8Array { return _getS(this.signature); }
  getV(): number | undefined { return _getV(this.signature); }
  getAlgorithm(): SignatureAlgorithm { return _getAlgorithm(this.signature); }
}

export const SignatureFromUnknown = Schema.transform(
  Schema.Union(Schema.String, Schema.Uint8ArrayFromSelf),
  Schema.instanceOf(SignatureSchema),
  {
    decode: (v) => (typeof v === "string" ? SignatureSchema.fromHex(v) : SignatureSchema.fromBytes(v)),
    encode: (s) => s.signature,
  },
);

