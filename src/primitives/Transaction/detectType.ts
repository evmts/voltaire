import {
	InvalidFormatError,
	InvalidTransactionTypeError,
} from "../errors/index.js";
import { Type } from "./types.js";

/**
 * Detect transaction type from serialized data
 *
 * @throws {InvalidFormatError} If transaction data is empty
 * @throws {InvalidTransactionTypeError} If transaction type byte is unknown
 */
export function detectType(data: Uint8Array): Type {
	if (data.length === 0) {
		throw new InvalidFormatError("Empty transaction data", {
			code: "EMPTY_TRANSACTION_DATA",
			value: data,
			expected: "Non-empty transaction data",
			docsPath: "/primitives/transaction/detect-type#error-handling",
		});
	}

	const firstByte = data[0]!;

	// Legacy transactions start with RLP list prefix (0xc0-0xff)
	if (firstByte >= 0xc0) {
		return Type.Legacy;
	}

	// Typed transactions start with type byte
	switch (firstByte) {
		case Type.EIP2930:
			return Type.EIP2930;
		case Type.EIP1559:
			return Type.EIP1559;
		case Type.EIP4844:
			return Type.EIP4844;
		case Type.EIP7702:
			return Type.EIP7702;
		default:
			throw new InvalidTransactionTypeError(
				`Unknown transaction type: 0x${firstByte.toString(16)}`,
				{
					code: "UNKNOWN_TRANSACTION_TYPE",
					context: { typeByte: `0x${firstByte.toString(16)}` },
					docsPath: "/primitives/transaction/detect-type#error-handling",
				},
			);
	}
}
