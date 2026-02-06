declare const AddressError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "AddressError";
} & Readonly<A>;
/**
 * Base error class for all Address-related errors
 */
export declare class AddressError extends AddressError_base<{
    readonly message: string;
    readonly cause?: unknown;
}> {
}
declare const InvalidHexFormatError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidHexFormat";
} & Readonly<A>;
/**
 * Error thrown when hex format validation fails
 */
export declare class InvalidHexFormatError extends InvalidHexFormatError_base<{
    readonly value: unknown;
    readonly expected?: string;
}> {
}
declare const InvalidHexStringError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidHexString";
} & Readonly<A>;
/**
 * Error thrown when hex string contains invalid characters
 */
export declare class InvalidHexStringError extends InvalidHexStringError_base<{
    readonly value: string;
    readonly reason: string;
}> {
}
declare const InvalidAddressLengthError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidAddressLength";
} & Readonly<A>;
/**
 * Error thrown when address length is incorrect
 */
export declare class InvalidAddressLengthError extends InvalidAddressLengthError_base<{
    readonly value: unknown;
    readonly actualLength: number;
    readonly expectedLength: number;
}> {
}
declare const InvalidValueError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidValue";
} & Readonly<A>;
/**
 * Error thrown when value validation fails
 */
export declare class InvalidValueError extends InvalidValueError_base<{
    readonly value: unknown;
    readonly expected: string;
    readonly context?: Record<string, unknown>;
}> {
}
declare const InvalidPrivateKeyError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidPrivateKey";
} & Readonly<A>;
/**
 * Error thrown when private key is invalid
 */
export declare class InvalidPrivateKeyError extends InvalidPrivateKeyError_base<{
    readonly message: string;
    readonly cause?: unknown;
}> {
}
declare const InvalidChecksumError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "InvalidChecksum";
} & Readonly<A>;
/**
 * Error thrown when checksum validation fails
 */
export declare class InvalidChecksumError extends InvalidChecksumError_base<{
    readonly address: string;
    readonly expected: string;
    readonly actual: string;
}> {
}
declare const CryptoOperationError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "CryptoOperationError";
} & Readonly<A>;
/**
 * Error thrown when crypto operation fails
 */
export declare class CryptoOperationError extends CryptoOperationError_base<{
    readonly operation: "keccak256" | "secp256k1" | "rlp_encode";
    readonly message: string;
    readonly cause?: unknown;
}> {
}
declare const RlpEncodingError_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").Equals<A, {}> extends true ? void : { readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }) => import("effect/Cause").YieldableError & {
    readonly _tag: "RlpEncodingError";
} & Readonly<A>;
/**
 * Error thrown when RLP encoding fails
 */
export declare class RlpEncodingError extends RlpEncodingError_base<{
    readonly data: unknown;
    readonly message: string;
    readonly cause?: unknown;
}> {
}
/**
 * Errors that can be thrown by Address.from()
 */
export type FromErrors = InvalidValueError | InvalidHexFormatError | InvalidHexStringError | InvalidAddressLengthError;
/**
 * Errors that can be thrown by Address.fromHex()
 */
export type FromHexErrors = InvalidHexFormatError | InvalidHexStringError | InvalidAddressLengthError;
/**
 * Errors that can be thrown by Address.fromBytes()
 */
export type FromBytesErrors = InvalidAddressLengthError;
/**
 * Errors that can be thrown by Address.fromNumber()
 */
export type FromNumberErrors = InvalidValueError;
/**
 * Errors that can be thrown by Address.fromAbiEncoded()
 */
export type FromAbiEncodedErrors = InvalidAddressLengthError | InvalidValueError;
/**
 * Errors that can be thrown by Address.fromPublicKey()
 */
export type FromPublicKeyErrors = CryptoOperationError;
/**
 * Errors that can be thrown by Address.fromPrivateKey()
 */
export type FromPrivateKeyErrors = InvalidAddressLengthError | InvalidPrivateKeyError | CryptoOperationError;
/**
 * Errors that can be thrown by Address.calculateCreateAddress()
 */
export type CalculateCreateAddressErrors = InvalidValueError | CryptoOperationError | RlpEncodingError;
/**
 * Errors that can be thrown by Address.calculateCreate2Address()
 */
export type CalculateCreate2AddressErrors = InvalidValueError | CryptoOperationError;
/**
 * Errors that can be thrown by toChecksummed()
 */
export type ToChecksummedErrors = CryptoOperationError;
/**
 * Errors that can be thrown by ChecksumAddress.from()
 */
export type ChecksumAddressFromErrors = InvalidChecksumError | InvalidHexFormatError | InvalidHexStringError | InvalidAddressLengthError | InvalidValueError | CryptoOperationError;
export {};
//# sourceMappingURL=effect-errors.d.ts.map