import { describe, expect, it } from "vitest";
import {
	PrimitiveError,
	ValidationError,
	InvalidFormatError,
	InvalidLengthError,
	InvalidRangeError,
	InvalidChecksumError,
	SerializationError,
	EncodingError,
	DecodingError,
	CryptoError,
	InvalidSignatureError,
	InvalidPublicKeyError,
	InvalidPrivateKeyError,
	TransactionError,
	InvalidTransactionTypeError,
	InvalidSignerError,
} from "./index.js";

describe("PrimitiveError", () => {
	it("creates base error with default code", () => {
		const err = new PrimitiveError("test message");
		expect(err).toBeInstanceOf(Error);
		expect(err).toBeInstanceOf(PrimitiveError);
		expect(err.message).toBe("test message");
		expect(err.name).toBe("PrimitiveError");
		expect(err.code).toBe("PRIMITIVE_ERROR");
		expect(err.context).toBeUndefined();
	});

	it("creates error with custom code and context", () => {
		const err = new PrimitiveError("test", {
			code: "CUSTOM_CODE",
			context: { foo: "bar", num: 42 },
		});
		expect(err.code).toBe("CUSTOM_CODE");
		expect(err.context).toEqual({ foo: "bar", num: 42 });
	});

	it("maintains proper stack trace", () => {
		const err = new PrimitiveError("test");
		expect(err.stack).toBeDefined();
		expect(err.stack).toContain("PrimitiveError");
	});
});

describe("ValidationError", () => {
	it("creates validation error with value and expected", () => {
		const err = new ValidationError("Invalid value", {
			value: "0xBAD",
			expected: "20 bytes",
		});
		expect(err).toBeInstanceOf(PrimitiveError);
		expect(err).toBeInstanceOf(ValidationError);
		expect(err.name).toBe("ValidationError");
		expect(err.code).toBe("VALIDATION_ERROR");
		expect(err.value).toBe("0xBAD");
		expect(err.expected).toBe("20 bytes");
	});

	it("accepts custom code", () => {
		const err = new ValidationError("test", {
			code: "CUSTOM_VALIDATION",
			value: 123,
			expected: "string",
		});
		expect(err.code).toBe("CUSTOM_VALIDATION");
	});
});

describe("InvalidFormatError", () => {
	it("creates format error", () => {
		const err = new InvalidFormatError("Invalid hex format", {
			value: "notHex",
			expected: "0x-prefixed hex string",
		});
		expect(err).toBeInstanceOf(ValidationError);
		expect(err).toBeInstanceOf(InvalidFormatError);
		expect(err.name).toBe("InvalidFormatError");
		expect(err.code).toBe("INVALID_FORMAT");
	});

	it("includes context data", () => {
		const err = new InvalidFormatError("Invalid address", {
			value: "0x123",
			expected: "20 bytes",
			context: { length: 3 },
		});
		expect(err.context).toEqual({ length: 3 });
	});
});

describe("InvalidLengthError", () => {
	it("creates length error", () => {
		const err = new InvalidLengthError("Wrong length", {
			value: new Uint8Array(10),
			expected: "32 bytes",
		});
		expect(err).toBeInstanceOf(ValidationError);
		expect(err).toBeInstanceOf(InvalidLengthError);
		expect(err.name).toBe("InvalidLengthError");
		expect(err.code).toBe("INVALID_LENGTH");
	});
});

describe("InvalidRangeError", () => {
	it("creates range error", () => {
		const err = new InvalidRangeError("Value out of range", {
			value: 256,
			expected: "0-255",
		});
		expect(err).toBeInstanceOf(ValidationError);
		expect(err).toBeInstanceOf(InvalidRangeError);
		expect(err.name).toBe("InvalidRangeError");
		expect(err.code).toBe("INVALID_RANGE");
	});
});

describe("InvalidChecksumError", () => {
	it("creates checksum error", () => {
		const err = new InvalidChecksumError("Checksum mismatch", {
			value: "0xdeadbeef",
			expected: "EIP-55 checksum",
		});
		expect(err).toBeInstanceOf(ValidationError);
		expect(err).toBeInstanceOf(InvalidChecksumError);
		expect(err.name).toBe("InvalidChecksumError");
		expect(err.code).toBe("INVALID_CHECKSUM");
	});
});

describe("SerializationError", () => {
	it("creates serialization error", () => {
		const err = new SerializationError("Serialization failed");
		expect(err).toBeInstanceOf(PrimitiveError);
		expect(err).toBeInstanceOf(SerializationError);
		expect(err.name).toBe("SerializationError");
		expect(err.code).toBe("SERIALIZATION_ERROR");
	});
});

describe("EncodingError", () => {
	it("creates encoding error", () => {
		const err = new EncodingError("RLP encoding failed", {
			context: { input: [1, 2, 3] },
		});
		expect(err).toBeInstanceOf(SerializationError);
		expect(err).toBeInstanceOf(EncodingError);
		expect(err.name).toBe("EncodingError");
		expect(err.code).toBe("ENCODING_ERROR");
		expect(err.context).toEqual({ input: [1, 2, 3] });
	});
});

describe("DecodingError", () => {
	it("creates decoding error", () => {
		const err = new DecodingError("RLP decoding failed");
		expect(err).toBeInstanceOf(SerializationError);
		expect(err).toBeInstanceOf(DecodingError);
		expect(err.name).toBe("DecodingError");
		expect(err.code).toBe("DECODING_ERROR");
	});
});

describe("CryptoError", () => {
	it("creates crypto error", () => {
		const err = new CryptoError("Crypto operation failed");
		expect(err).toBeInstanceOf(PrimitiveError);
		expect(err).toBeInstanceOf(CryptoError);
		expect(err.name).toBe("CryptoError");
		expect(err.code).toBe("CRYPTO_ERROR");
	});
});

describe("InvalidSignatureError", () => {
	it("creates signature error", () => {
		const err = new InvalidSignatureError("Signature verification failed", {
			context: { r: "0x...", s: "0x...", v: 27 },
		});
		expect(err).toBeInstanceOf(CryptoError);
		expect(err).toBeInstanceOf(InvalidSignatureError);
		expect(err.name).toBe("InvalidSignatureError");
		expect(err.code).toBe("INVALID_SIGNATURE");
	});
});

describe("InvalidPublicKeyError", () => {
	it("creates public key error", () => {
		const err = new InvalidPublicKeyError("Malformed public key");
		expect(err).toBeInstanceOf(CryptoError);
		expect(err).toBeInstanceOf(InvalidPublicKeyError);
		expect(err.name).toBe("InvalidPublicKeyError");
		expect(err.code).toBe("INVALID_PUBLIC_KEY");
	});
});

describe("InvalidPrivateKeyError", () => {
	it("creates private key error", () => {
		const err = new InvalidPrivateKeyError("Private key out of range");
		expect(err).toBeInstanceOf(CryptoError);
		expect(err).toBeInstanceOf(InvalidPrivateKeyError);
		expect(err.name).toBe("InvalidPrivateKeyError");
		expect(err.code).toBe("INVALID_PRIVATE_KEY");
	});
});

describe("TransactionError", () => {
	it("creates transaction error", () => {
		const err = new TransactionError("Transaction failed");
		expect(err).toBeInstanceOf(PrimitiveError);
		expect(err).toBeInstanceOf(TransactionError);
		expect(err.name).toBe("TransactionError");
		expect(err.code).toBe("TRANSACTION_ERROR");
	});
});

describe("InvalidTransactionTypeError", () => {
	it("creates transaction type error", () => {
		const err = new InvalidTransactionTypeError("Unsupported transaction type", {
			context: { type: 99 },
		});
		expect(err).toBeInstanceOf(TransactionError);
		expect(err).toBeInstanceOf(InvalidTransactionTypeError);
		expect(err.name).toBe("InvalidTransactionTypeError");
		expect(err.code).toBe("INVALID_TRANSACTION_TYPE");
		expect(err.context).toEqual({ type: 99 });
	});
});

describe("InvalidSignerError", () => {
	it("creates signer error", () => {
		const err = new InvalidSignerError("Signer mismatch", {
			context: { expected: "0xAAA", actual: "0xBBB" },
		});
		expect(err).toBeInstanceOf(TransactionError);
		expect(err).toBeInstanceOf(InvalidSignerError);
		expect(err.name).toBe("InvalidSignerError");
		expect(err.code).toBe("INVALID_SIGNER");
	});
});

describe("Error hierarchy", () => {
	it("maintains instanceof chain", () => {
		const err = new InvalidFormatError("test", {
			value: "bad",
			expected: "good",
		});

		expect(err instanceof Error).toBe(true);
		expect(err instanceof PrimitiveError).toBe(true);
		expect(err instanceof ValidationError).toBe(true);
		expect(err instanceof InvalidFormatError).toBe(true);
	});

	it("differentiates between error types", () => {
		const validationErr = new ValidationError("test", { value: 1, expected: "2" });
		const cryptoErr = new CryptoError("test");

		expect(validationErr instanceof ValidationError).toBe(true);
		expect(validationErr instanceof CryptoError).toBe(false);

		expect(cryptoErr instanceof CryptoError).toBe(true);
		expect(cryptoErr instanceof ValidationError).toBe(false);

		expect(validationErr instanceof PrimitiveError).toBe(true);
		expect(cryptoErr instanceof PrimitiveError).toBe(true);
	});
});

describe("Usage examples", () => {
	it("demonstrates typical usage pattern", () => {
		const throwAddressError = () => {
			throw new InvalidFormatError("Invalid address format", {
				code: "INVALID_ADDRESS",
				value: "0x123",
				expected: "0x-prefixed 20 bytes",
				context: { length: 3 },
			});
		};

		expect(throwAddressError).toThrow(InvalidFormatError);
		expect(throwAddressError).toThrow("Invalid address format");

		try {
			throwAddressError();
		} catch (e) {
			if (e instanceof InvalidFormatError) {
				expect(e.code).toBe("INVALID_ADDRESS");
				expect(e.value).toBe("0x123");
				expect(e.expected).toBe("0x-prefixed 20 bytes");
				expect(e.context?.length).toBe(3);
			}
		}
	});

	it("allows programmatic error handling", () => {
		const handleError = (err: Error) => {
			if (err instanceof InvalidFormatError) {
				return "FORMAT";
			}
			if (err instanceof InvalidLengthError) {
				return "LENGTH";
			}
			if (err instanceof CryptoError) {
				return "CRYPTO";
			}
			return "UNKNOWN";
		};

		expect(
			handleError(new InvalidFormatError("test", { value: 1, expected: "2" }))
		).toBe("FORMAT");
		expect(
			handleError(new InvalidLengthError("test", { value: 1, expected: "2" }))
		).toBe("LENGTH");
		expect(handleError(new CryptoError("test"))).toBe("CRYPTO");
		expect(handleError(new Error("test"))).toBe("UNKNOWN");
	});
});
