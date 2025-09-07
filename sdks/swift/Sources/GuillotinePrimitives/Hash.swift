import Foundation

/// 32-byte hash value
public struct Hash: Sendable {
    private let bytes: [UInt8]
    
    /// Create hash from 32 bytes
    public init(_ bytes: [UInt8]) throws {
        guard bytes.count == 32 else {
            throw PrimitivesError.invalidLength(expected: 32, actual: bytes.count)
        }
        self.bytes = bytes
    }
    
    /// Create hash from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        let cleanHex = hex.hasPrefix("0x") ? String(hex.dropFirst(2)) : hex
        guard cleanHex.count == 64 else {
            throw PrimitivesError.invalidHexLength(expected: 64, actual: cleanHex.count)
        }
        
        guard let data = Data(hexString: cleanHex) else {
            throw PrimitivesError.invalidHexString(cleanHex)
        }
        
        self.bytes = Array(data)
    }
    
    /// Create zero hash (0x0000...0000)
    public static var zero: Hash {
        try! Hash(Array(repeating: 0, count: 32))
    }
    
    /// Get the hash as bytes
    public var rawBytes: [UInt8] {
        bytes
    }
    
    /// Get the hash as hex string with 0x prefix
    public var hexString: String {
        "0x" + bytes.map { String(format: "%02x", $0) }.joined()
    }
}

// MARK: - Equatable
extension Hash: Equatable {
    public static func == (lhs: Hash, rhs: Hash) -> Bool {
        lhs.bytes == rhs.bytes
    }
}

// MARK: - Hashable
extension Hash: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(bytes)
    }
}

// MARK: - Codable
extension Hash: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        let hexString = try container.decode(String.self)
        try self.init(hex: hexString)
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        try container.encode(hexString)
    }
}

// MARK: - CustomStringConvertible
extension Hash: CustomStringConvertible {
    public var description: String {
        hexString
    }
}

// MARK: - ExpressibleByStringLiteral
extension Hash: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) {
        try! self.init(hex: value)
    }
}