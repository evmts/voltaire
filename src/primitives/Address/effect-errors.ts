import * as Data from "effect/Data";

/**
 * Base error class for all Address-related errors
 */
export class AddressError extends Data.TaggedError("AddressError")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when hex format validation fails
 */
export class InvalidHexFormatError extends Data.TaggedError("InvalidHexFormat")<{
	readonly value: unknown;
	readonly expected?: string;
}> {}

/**
 * Error thrown when hex string contains invalid characters
 */
export class InvalidHexStringError extends Data.TaggedError("InvalidHexString")<{
	readonly value: string;
	readonly reason: string;
}> {}

/**
 * Error thrown when address length is incorrect
 */
export class InvalidAddressLengthError extends Data.TaggedError("InvalidAddressLength")<{
	readonly value: unknown;
	readonly actualLength: number;
	readonly expectedLength: number;
}> {}

/**
 * Error thrown when value validation fails
 */
export class InvalidValueError extends Data.TaggedError("InvalidValue")<{
	readonly value: unknown;
	readonly expected: string;
	readonly context?: Record<string, unknown>;
}> {}

/**
 * Error thrown when private key is invalid
 */
export class InvalidPrivateKeyError extends Data.TaggedError("InvalidPrivateKey")<{
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when checksum validation fails
 */
export class InvalidChecksumError extends Data.TaggedError("InvalidChecksum")<{
	readonly address: string;
	readonly expected: string;
	readonly actual: string;
}> {}

/**
 * Error thrown when crypto operation fails
 */
export class CryptoOperationError extends Data.TaggedError("CryptoOperationError")<{
	readonly operation: "keccak256" | "secp256k1" | "rlp_encode";
	readonly message: string;
	readonly cause?: unknown;
}> {}

/**
 * Error thrown when RLP encoding fails
 */
export class RlpEncodingError extends Data.TaggedError("RlpEncodingError")<{
	readonly data: unknown;
	readonly message: string;
	readonly cause?: unknown;
}> {}

// Union types for specific method errors

/**
 * Errors that can be thrown by Address.from()
 */
export type FromErrors =
	| InvalidValueError
	| InvalidHexFormatError
	| InvalidHexStringError
	| InvalidAddressLengthError;

/**
 * Errors that can be thrown by Address.fromHex()
 */
export type FromHexErrors =
	| InvalidHexFormatError
	| InvalidHexStringError
	| InvalidAddressLengthError;

/**
 * Errors that can be thrown by Address.fromBytes()
 */
export type FromBytesErrors =
	| InvalidAddressLengthError;

/**
 * Errors that can be thrown by Address.fromNumber()
 */
export type FromNumberErrors =
	| InvalidValueError;

/**
 * Errors that can be thrown by Address.fromAbiEncoded()
 */
export type FromAbiEncodedErrors =
	| InvalidAddressLengthError
	| InvalidValueError;

/**
 * Errors that can be thrown by Address.fromPublicKey()
 */
export type FromPublicKeyErrors =
	| CryptoOperationError;

/**
 * Errors that can be thrown by Address.fromPrivateKey()
 */
export type FromPrivateKeyErrors =
	| InvalidAddressLengthError
	| InvalidPrivateKeyError
	| CryptoOperationError;

/**
 * Errors that can be thrown by Address.calculateCreateAddress()
 */
export type CalculateCreateAddressErrors =
	| InvalidValueError
	| CryptoOperationError
	| RlpEncodingError;

/**
 * Errors that can be thrown by Address.calculateCreate2Address()
 */
export type CalculateCreate2AddressErrors =
	| InvalidValueError
	| CryptoOperationError;

/**
 * Errors that can be thrown by toChecksummed()
 */
export type ToChecksummedErrors =
	| CryptoOperationError;

/**
 * Errors that can be thrown by ChecksumAddress.from()
 */
export type ChecksumAddressFromErrors =
	| InvalidChecksumError
	| InvalidHexFormatError
	| InvalidHexStringError
	| InvalidAddressLengthError
	| InvalidValueError
	| CryptoOperationError;