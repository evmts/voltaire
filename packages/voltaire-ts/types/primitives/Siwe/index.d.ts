export { InvalidFieldError, InvalidNonceLengthError, InvalidSiweMessageError, MissingFieldError, SiweParseError, } from "./errors.js";
export type { BrandedMessage, Signature, SiweMessageType, ValidationError, ValidationResult, } from "./SiweMessageType.js";
import type { Secp256k1PublicKeyType } from "../../crypto/Secp256k1/Secp256k1PublicKeyType.js";
import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { Signature, SiweMessageType, ValidationResult } from "./SiweMessageType.js";
type GetMessageHashFn = (message: SiweMessageType) => Uint8Array;
type VerifyFn = (message: SiweMessageType, signature: Signature) => boolean;
type VerifyMessageFn = (message: SiweMessageType, signature: Signature, options?: {
    now?: Date;
}) => ValidationResult;
export declare const GetMessageHash: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
}) => GetMessageHashFn;
export declare const Verify: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    secp256k1RecoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, hash: HashType) => Secp256k1PublicKeyType;
    addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => VerifyFn;
export declare const VerifyMessage: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    secp256k1RecoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, hash: HashType) => Secp256k1PublicKeyType;
    addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => VerifyMessageFn;
import { create as _create } from "./create.js";
import { format as _format } from "./format.js";
import { generateNonce as _generateNonce } from "./generateNonce.js";
import { parse as _parse } from "./parse.js";
import { validate as _validate } from "./validate.js";
declare const getMessageHash: GetMessageHashFn;
declare const verify: VerifyFn;
declare const verifyMessage: VerifyMessageFn;
type CreateParams<TDomain extends string = string, TAddress extends AddressType = AddressType, TUri extends string = string, TChainId extends number = number> = {
    domain: TDomain;
    address: TAddress;
    uri: TUri;
    chainId: TChainId;
    statement?: string;
    expirationTime?: string;
    notBefore?: string;
    requestId?: string;
    resources?: string[];
    nonce?: string;
    issuedAt?: string;
};
export declare function create<TDomain extends string = string, TAddress extends AddressType = AddressType, TUri extends string = string, TChainId extends number = number>(params: CreateParams<TDomain, TAddress, TUri, TChainId>): SiweMessageType<TDomain, TAddress, TUri, "1", TChainId>;
export declare function format(message: SiweMessageType): string;
export declare function generateNonce(length?: number): string;
export declare function parse(text: string): SiweMessageType;
export declare function validate(message: SiweMessageType, options?: {
    now?: Date;
}): ValidationResult;
export { _create, _format, _generateNonce, getMessageHash as _getMessageHash, _parse, _validate, verify as _verify, verifyMessage as _verifyMessage, };
export { getMessageHash, verify, verifyMessage };
export declare const BrandedSiwe: {
    create: typeof create;
    format: typeof format;
    generateNonce: typeof generateNonce;
    getMessageHash: GetMessageHashFn;
    parse: typeof parse;
    validate: typeof validate;
    verify: VerifyFn;
    verifyMessage: VerifyMessageFn;
};
/**
 * Factory function for creating SIWE Message instances
 */
export declare function Siwe<TDomain extends string = string, TAddress extends AddressType = AddressType, TUri extends string = string, TChainId extends number = number>(params: CreateParams<TDomain, TAddress, TUri, TChainId>): SiweMessageType<TDomain, TAddress, TUri, "1", TChainId>;
export declare namespace Siwe {
    var create: <TDomain extends string = string, TAddress extends AddressType = AddressType, TUri extends string = string, TChainId extends number = number>(params: CreateParams<TDomain, TAddress, TUri, TChainId>) => SiweMessageType<TDomain, TAddress, TUri, "1", TChainId>;
    var parse: (message: string) => SiweMessageType;
    var format: typeof import("./index.js").format;
    var generateNonce: typeof import("./index.js").generateNonce;
    var getMessageHash: GetMessageHashFn;
    var validate: typeof import("./index.js").validate;
    var verify: VerifyFn;
    var verifyMessage: VerifyMessageFn;
}
//# sourceMappingURL=index.d.ts.map