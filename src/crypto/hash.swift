/**
 * Hash type (32 bytes)
 *
 * Represents a 32-byte hash digest, typically from Keccak256, SHA256, etc.
 */

import Foundation
import CPrimitives

/// 32-byte hash digest
public struct Hash: Equatable, Hashable {
    /// Raw 32 bytes of the hash
    public let bytes: Data

    // MARK: - Constants

    /// Zero hash (0x0000...0000)
    public static let zero = Hash(uncheckedBytes: Data(repeating: 0, count: 32))

    // MARK: - Initialization

    /// Create hash from raw bytes
    /// - Parameter bytes: 32-byte hash data
    /// - Throws: HashError if not exactly 32 bytes
    public init(bytes: Data) throws {
        guard bytes.count == 32 else {
            throw HashError.invalidInput
        }
        self.bytes = bytes
    }

    /// Internal initializer without validation (for known-valid data)
    private init(uncheckedBytes bytes: Data) {
        self.bytes = bytes
    }

    /// Create hash from hex string (with or without 0x prefix)
    /// - Parameter hex: Hex string (66 characters with 0x prefix, or 64 without)
    /// - Throws: HashError if invalid format
    public init(hex: String) throws {
        // Use FFI to parse and validate
        var cHash = PrimitivesHash()
        let cString = hex.cString(using: .utf8)!

        let result = primitives_hash_from_hex(cString, &cHash)

        guard result == PRIMITIVES_SUCCESS else {
            throw HashError.invalidHexFormat
        }

        // Copy bytes from C struct
        self.bytes = Data(bytes: &cHash.bytes, count: 32)
    }

    // MARK: - Conversion

    /// Convert hash to hex string (lowercase, with 0x prefix)
    /// - Returns: Hex string representation (e.g., "0xabcdef...")
    public func toHex() -> String {
        var cHash = toCHash()
        var buffer = [UInt8](repeating: 0, count: 66)

        let result = primitives_hash_to_hex(&cHash, &buffer)
        guard result == PRIMITIVES_SUCCESS else {
            // Fallback to manual conversion
            return "0x" + bytes.map { String(format: "%02x", $0) }.joined()
        }

        return String(bytes: buffer, encoding: .utf8)!
    }

    // MARK: - Validation

    /// Check if this is the zero hash
    /// - Returns: true if all bytes are zero
    public func isZero() -> Bool {
        return bytes.allSatisfy { $0 == 0 }
    }

    // MARK: - Equatable & Hashable

    public static func == (lhs: Hash, rhs: Hash) -> Bool {
        // Use constant-time comparison via FFI
        var cLeft = lhs.toCHash()
        var cRight = rhs.toCHash()
        return primitives_hash_equals(&cLeft, &cRight)
    }

    public func hash(into hasher: inout Hasher) {
        hasher.combine(bytes)
    }

    // MARK: - Private Helpers

    /// Convert to C-compatible hash structure
    private func toCHash() -> PrimitivesHash {
        var cHash = PrimitivesHash()
        bytes.withUnsafeBytes { bufferPtr in
            if let baseAddress = bufferPtr.baseAddress {
                let uint8Ptr = baseAddress.assumingMemoryBound(to: UInt8.self)
                withUnsafeMutablePointer(to: &cHash.bytes.0) { destPtr in
                    destPtr.update(from: uint8Ptr, count: 32)
                }
            }
        }
        return cHash
    }
}

// MARK: - CustomStringConvertible

extension Hash: CustomStringConvertible {
    public var description: String {
        toHex()
    }
}

// MARK: - Codable

extension Hash: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let hex = try container.decode(String.self)
        try self.init(hex: hex)
    }

    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(toHex())
    }
}

// MARK: - ExpressibleByStringLiteral

extension Hash: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) {
        try! self.init(hex: value)
    }
}
