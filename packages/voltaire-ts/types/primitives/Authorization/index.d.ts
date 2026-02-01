export type { AuthorizationType, BrandedAuthorization, } from "./AuthorizationType.js";
export * from "./constants.js";
export * from "./errors.js";
export * from "./types.js";
import type { AddressType } from "../Address/AddressType.js";
import type { HashType } from "../Hash/HashType.js";
import type { AuthorizationType } from "./AuthorizationType.js";
type HashFn = (unsigned: {
    chainId: bigint;
    address: AddressType;
    nonce: bigint;
}) => HashType;
type SignFn = (unsigned: {
    chainId: bigint;
    address: AddressType;
    nonce: bigint;
}, privateKey: Uint8Array) => AuthorizationType;
type VerifyFn = (auth: AuthorizationType) => AddressType;
export declare const Hash: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Uint8Array[]) => Uint8Array;
}) => HashFn;
export declare const Sign: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Uint8Array[]) => Uint8Array;
    sign: (messageHash: Uint8Array, privateKey: Uint8Array) => {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    };
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => SignFn;
export declare const Verify: (deps: {
    keccak256: (data: Uint8Array) => Uint8Array;
    rlpEncode: (data: Uint8Array[]) => Uint8Array;
    recoverPublicKey: (signature: {
        r: Uint8Array;
        s: Uint8Array;
        v: number;
    }, messageHash: Uint8Array) => Uint8Array;
    addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
}) => VerifyFn;
export declare const calculateGasCost: (authList: AuthorizationType[], emptyAccounts: number) => bigint;
export declare const equals: (a: AddressType, b: AddressType) => boolean;
export declare const equalsAuth: (auth1: AuthorizationType, auth2: AuthorizationType) => boolean;
export declare const format: (auth: AuthorizationType | {
    chainId: bigint;
    address: AddressType;
    nonce: bigint;
}) => string;
export declare const getGasCost: (auth: AuthorizationType, isEmpty: boolean) => bigint;
export declare const isItem: (value: unknown) => boolean;
export declare const isUnsigned: (value: unknown) => boolean;
export declare const process: (auth: AuthorizationType) => {
    authority: AddressType;
    delegatedAddress: AddressType;
};
export declare const processAll: (authList: AuthorizationType[]) => {
    authority: AddressType;
    delegatedAddress: AddressType;
}[];
export declare const validate: (auth: AuthorizationType) => void;
declare const hash: HashFn;
declare const verify: VerifyFn;
declare const sign: SignFn;
export { hash, sign, verify };
export declare const Authorization: {
    Hash: (deps: {
        keccak256: (data: Uint8Array) => Uint8Array;
        rlpEncode: (data: Uint8Array[]) => Uint8Array;
    }) => HashFn;
    Verify: (deps: {
        keccak256: (data: Uint8Array) => Uint8Array;
        rlpEncode: (data: Uint8Array[]) => Uint8Array;
        recoverPublicKey: (signature: {
            r: Uint8Array;
            s: Uint8Array;
            v: number;
        }, messageHash: Uint8Array) => Uint8Array;
        addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
    }) => VerifyFn;
    Sign: (deps: {
        keccak256: (data: Uint8Array) => Uint8Array;
        rlpEncode: (data: Uint8Array[]) => Uint8Array;
        sign: (messageHash: Uint8Array, privateKey: Uint8Array) => {
            r: Uint8Array;
            s: Uint8Array;
            v: number;
        };
        recoverPublicKey: (signature: {
            r: Uint8Array;
            s: Uint8Array;
            v: number;
        }, messageHash: Uint8Array) => Uint8Array;
        addressFromPublicKey: (x: bigint, y: bigint) => AddressType;
    }) => SignFn;
    isItem: (value: unknown) => boolean;
    isUnsigned: (value: unknown) => boolean;
    validate: (auth: AuthorizationType) => void;
    hash: HashFn;
    sign: SignFn;
    verify: VerifyFn;
    calculateGasCost: (authList: AuthorizationType[], emptyAccounts: number) => bigint;
    getGasCost: (auth: AuthorizationType, isEmpty: boolean) => bigint;
    process: (auth: AuthorizationType) => {
        authority: AddressType;
        delegatedAddress: AddressType;
    };
    processAll: (authList: AuthorizationType[]) => {
        authority: AddressType;
        delegatedAddress: AddressType;
    }[];
    format: (auth: AuthorizationType | {
        chainId: bigint;
        address: AddressType;
        nonce: bigint;
    }) => string;
    equals: (a: AddressType, b: AddressType) => boolean;
    equalsAuth: (auth1: AuthorizationType, auth2: AuthorizationType) => boolean;
    MAGIC_BYTE: number;
    PER_AUTH_BASE_COST: bigint;
    PER_EMPTY_ACCOUNT_COST: bigint;
    SECP256K1_N: bigint;
    SECP256K1_HALF_N: bigint;
};
export * from "./Authorization.wasm.js";
//# sourceMappingURL=index.d.ts.map