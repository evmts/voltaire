/**
 * Keccak-256 hashing (Ethereum's primary hash function)
 *
 * IMPORTANT: This is Keccak-256, NOT SHA3-256
 * They differ in padding - Ethereum uses the original Keccak.
 */

import Foundation
import CPrimitives

/// Errors that can occur during hashing operations
public enum HashError: Error, CustomStringConvertible {
    case invalidInput
    case hashFailed
    case invalidHexFormat

    public var description: String {
        switch self {
        case .invalidInput:
            return "Invalid input data"
        case .hashFailed:
            return "Hash operation failed"
        case .invalidHexFormat:
            return "Invalid hex format for hash"
        }
    }
}

/// Keccak-256 hash implementation (Ethereum's primary hash function)
///
/// This is the original Keccak algorithm, not the NIST SHA3-256 standard.
/// Ethereum uses Keccak-256 for all hash operations.
public enum Keccak256 {

    // MARK: - Hashing

    /// Compute Keccak-256 hash of input data
    /// - Parameter data: Input data to hash
    /// - Returns: 32-byte hash digest
    /// - Throws: HashError if hashing fails
    public static func hash(_ data: Data) throws -> Data {
        var cHash = PrimitivesHash()

        let result = data.withUnsafeBytes { bufferPtr -> Int32 in
            guard let baseAddress = bufferPtr.baseAddress else {
                return PRIMITIVES_ERROR_INVALID_INPUT
            }
            let uint8Ptr = baseAddress.assumingMemoryBound(to: UInt8.self)
            return primitives_keccak256(uint8Ptr, data.count, &cHash)
        }

        guard result == PRIMITIVES_SUCCESS else {
            throw HashError.hashFailed
        }

        // Copy bytes from C struct
        return Data(bytes: &cHash.bytes, count: 32)
    }

    /// Compute Keccak-256 hash of byte array
    /// - Parameter bytes: Input bytes to hash
    /// - Returns: 32-byte hash digest
    /// - Throws: HashError if hashing fails
    public static func hash(_ bytes: [UInt8]) throws -> Data {
        return try hash(Data(bytes))
    }

    /// Compute Keccak-256 hash of string (UTF-8 encoded)
    /// - Parameter string: Input string to hash
    /// - Returns: 32-byte hash digest
    /// - Throws: HashError if hashing fails
    public static func hash(_ string: String) throws -> Data {
        guard let data = string.data(using: .utf8) else {
            throw HashError.invalidInput
        }
        return try hash(data)
    }

    /// Compute Keccak-256 hash and return as hex string
    /// - Parameter data: Input data to hash
    /// - Returns: Hex string (66 characters: "0x" + 64 hex chars)
    /// - Throws: HashError if hashing fails
    public static func hashToHex(_ data: Data) throws -> String {
        let hashData = try hash(data)
        return "0x" + hashData.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - Data Extension

extension Data {
    /// Compute Keccak-256 hash of this data
    public var keccak256: Data {
        try! Keccak256.hash(self)
    }
}

// MARK: - String Extension

extension String {
    /// Compute Keccak-256 hash of this string (UTF-8 encoded)
    public var keccak256: Data {
        try! Keccak256.hash(self)
    }
}
