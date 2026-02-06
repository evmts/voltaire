export type { EnsType as Ens } from "./EnsType.js";
export * from "./errors.js";
import type { EnsType } from "./EnsType.js";
declare const _beautify: (name: EnsType) => EnsType;
declare const from: (name: string) => EnsType;
declare const is: (value: unknown) => value is EnsType;
declare const isValid: (name: string) => boolean;
declare const Labelhash: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
}) => (label: EnsType) => Uint8Array;
declare const Namehash: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
}) => (name: EnsType) => Uint8Array;
declare const _normalize: (name: EnsType) => EnsType;
declare const toString: (name: EnsType) => string;
declare const validate: (name: string) => void;
export { Labelhash, Namehash };
declare const _namehash: (name: EnsType) => Uint8Array;
declare const _labelhash: (label: EnsType) => Uint8Array;
export { from, _normalize, _beautify, _namehash, _labelhash, is, toString, isValid, validate, };
export declare function normalize(name: string | EnsType): EnsType;
export declare function beautify(name: string | EnsType): EnsType;
export declare function namehash(name: string | EnsType): Uint8Array;
export declare function labelhash(label: string | EnsType): Uint8Array;
//# sourceMappingURL=index.d.ts.map