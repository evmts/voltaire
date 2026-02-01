import * as Brand from "effect/Brand";
import * as Schema from "effect/Schema";
import type { EnsType } from "./EnsType.js";
export type EnsBrand = string & Brand.Brand<"Ens">;
export declare const EnsBrand: Brand.Brand.Constructor<EnsBrand>;
declare const EnsSchema_base: Schema.Class<EnsSchema, {
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}, Schema.Struct.Encoded<{
    value: Schema.refine<string, Schema.Schema<string, string, never>>;
}>, never, {
    readonly value: string;
}, {}, {}>;
export declare class EnsSchema extends EnsSchema_base {
    get ens(): EnsType;
    get branded(): EnsBrand;
    static fromBranded(brand: EnsBrand): EnsSchema;
    static from(value: string): EnsSchema;
    toString(): string;
    normalize(): EnsSchema;
    beautify(): EnsSchema;
    namehash(): Uint8Array;
    labelhash(): Uint8Array;
}
export declare const EnsFromUnknown: Schema.transform<typeof Schema.String, Schema.instanceOf<EnsSchema>>;
export {};
//# sourceMappingURL=effect.d.ts.map