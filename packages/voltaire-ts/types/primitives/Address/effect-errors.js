import * as Data from "effect/Data";
/**
 * Base error class for all Address-related errors
 */
export class AddressError extends Data.TaggedError("AddressError") {
}
/**
 * Error thrown when hex format validation fails
 */
export class InvalidHexFormatError extends Data.TaggedError("InvalidHexFormat") {
}
/**
 * Error thrown when hex string contains invalid characters
 */
export class InvalidHexStringError extends Data.TaggedError("InvalidHexString") {
}
/**
 * Error thrown when address length is incorrect
 */
export class InvalidAddressLengthError extends Data.TaggedError("InvalidAddressLength") {
}
/**
 * Error thrown when value validation fails
 */
export class InvalidValueError extends Data.TaggedError("InvalidValue") {
}
/**
 * Error thrown when private key is invalid
 */
export class InvalidPrivateKeyError extends Data.TaggedError("InvalidPrivateKey") {
}
/**
 * Error thrown when checksum validation fails
 */
export class InvalidChecksumError extends Data.TaggedError("InvalidChecksum") {
}
/**
 * Error thrown when crypto operation fails
 */
export class CryptoOperationError extends Data.TaggedError("CryptoOperationError") {
}
/**
 * Error thrown when RLP encoding fails
 */
export class RlpEncodingError extends Data.TaggedError("RlpEncodingError") {
}
