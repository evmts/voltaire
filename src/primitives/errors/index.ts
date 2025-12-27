// Abstract base error (foundation)
export { AbstractError } from "./AbstractError.js";

// Base error
export { PrimitiveError } from "./PrimitiveError.js";

// Validation errors
export {
	ValidationError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
	InvalidChecksumError,
} from "./ValidationError.js";

// Overflow/underflow errors
export {
	IntegerOverflowError,
	IntegerUnderflowError,
	InvalidSizeError,
} from "./OverflowError.js";

// Serialization errors
export {
	SerializationError,
	EncodingError,
	DecodingError,
} from "./SerializationError.js";

// Crypto errors
export {
	CryptoError,
	InvalidSignatureError,
	InvalidPublicKeyError,
	InvalidPrivateKeyError,
} from "./CryptoError.js";

// Transaction errors
export {
	TransactionError,
	InvalidTransactionTypeError,
	InvalidSignerError,
} from "./TransactionError.js";
