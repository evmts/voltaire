import { RlpDecodingError } from "./RlpError.js";
/**
 * Calculate the total length of an RLP-encoded item and validate canonical encoding
 * @internal
 * @param {Uint8Array} bytes
 * @returns {number}
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: RLP length calculation requires many conditions
export function getRlpItemLength(bytes) {
    if (bytes.length === 0) {
        throw new RlpDecodingError("Cannot decode empty input", {
            code: "RLP_INPUT_TOO_SHORT",
        });
    }
    const prefix = bytes[0];
    if (prefix === undefined) {
        throw new RlpDecodingError("Cannot decode empty input", {
            code: "RLP_INPUT_TOO_SHORT",
        });
    }
    // Single byte [0x00, 0x7f]
    if (prefix <= 0x7f) {
        return 1;
    }
    // Short string [0x80, 0xb7]
    if (prefix <= 0xb7) {
        const length = prefix - 0x80;
        // Check for non-canonical encoding: single byte < 0x80 should not be prefixed
        if (length === 1 && bytes.length > 1) {
            const nextByte = bytes[1];
            if (nextByte !== undefined && nextByte < 0x80) {
                throw new RlpDecodingError("Single byte < 0x80 should not be prefixed", {
                    code: "RLP_NON_CANONICAL_SIZE",
                    context: { prefix, nextByte },
                });
            }
        }
        if (bytes.length < 1 + length) {
            throw new RlpDecodingError(`Expected ${1 + length} bytes, got ${bytes.length}`, {
                code: "RLP_INPUT_TOO_SHORT",
                context: { expected: 1 + length, actual: bytes.length },
            });
        }
        return 1 + length;
    }
    // Long string [0xb8, 0xbf]
    if (prefix <= 0xbf) {
        const lengthOfLength = prefix - 0xb7;
        if (bytes.length < 1 + lengthOfLength) {
            throw new RlpDecodingError(`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`, {
                code: "RLP_INPUT_TOO_SHORT",
                context: { expected: 1 + lengthOfLength, actual: bytes.length },
            });
        }
        // Check for leading zeros
        if (bytes[1] === 0) {
            throw new RlpDecodingError("Length encoding has leading zeros", {
                code: "RLP_LEADING_ZEROS",
                context: { prefix },
            });
        }
        let length = 0;
        for (let i = 0; i < lengthOfLength; i++) {
            const byte = bytes[1 + i];
            if (byte === undefined) {
                throw new RlpDecodingError("Unexpected end of input", {
                    code: "RLP_INPUT_TOO_SHORT",
                });
            }
            length = length * 256 + byte;
        }
        // Check for non-canonical encoding: < 56 bytes should use short form
        if (length < 56) {
            throw new RlpDecodingError("String < 56 bytes should use short form", {
                code: "RLP_NON_CANONICAL_SIZE",
                context: { length, prefix },
            });
        }
        if (bytes.length < 1 + lengthOfLength + length) {
            throw new RlpDecodingError(`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`, {
                code: "RLP_INPUT_TOO_SHORT",
                context: {
                    expected: 1 + lengthOfLength + length,
                    actual: bytes.length,
                },
            });
        }
        return 1 + lengthOfLength + length;
    }
    // Short list [0xc0, 0xf7]
    if (prefix <= 0xf7) {
        const length = prefix - 0xc0;
        if (bytes.length < 1 + length) {
            throw new RlpDecodingError(`Expected ${1 + length} bytes, got ${bytes.length}`, {
                code: "RLP_INPUT_TOO_SHORT",
                context: { expected: 1 + length, actual: bytes.length },
            });
        }
        return 1 + length;
    }
    // Long list [0xf8, 0xff]
    const lengthOfLength = prefix - 0xf7;
    if (bytes.length < 1 + lengthOfLength) {
        throw new RlpDecodingError(`Expected ${1 + lengthOfLength} bytes for length, got ${bytes.length}`, {
            code: "RLP_INPUT_TOO_SHORT",
            context: { expected: 1 + lengthOfLength, actual: bytes.length },
        });
    }
    // Check for leading zeros
    if (bytes[1] === 0) {
        throw new RlpDecodingError("Length encoding has leading zeros", {
            code: "RLP_LEADING_ZEROS",
            context: { prefix },
        });
    }
    let length = 0;
    for (let i = 0; i < lengthOfLength; i++) {
        const byte = bytes[1 + i];
        if (byte === undefined) {
            throw new RlpDecodingError("Unexpected end of input", {
                code: "RLP_INPUT_TOO_SHORT",
            });
        }
        length = length * 256 + byte;
    }
    // Check for non-canonical encoding: < 56 bytes should use short form
    if (length < 56) {
        throw new RlpDecodingError("List < 56 bytes should use short form", {
            code: "RLP_NON_CANONICAL_SIZE",
            context: { length, prefix },
        });
    }
    if (bytes.length < 1 + lengthOfLength + length) {
        throw new RlpDecodingError(`Expected ${1 + lengthOfLength + length} bytes, got ${bytes.length}`, {
            code: "RLP_INPUT_TOO_SHORT",
            context: {
                expected: 1 + lengthOfLength + length,
                actual: bytes.length,
            },
        });
    }
    return 1 + lengthOfLength + length;
}
