import Foundation
import GuillotineC

/// Ethereum address (20 bytes)
public struct Address: Sendable {
    private let bytes: [UInt8]
    
    /// Create an address from 20 bytes
    public init(_ bytes: [UInt8]) throws {
        guard bytes.count == 20 else {
            throw PrimitivesError.invalidLength(expected: 20, actual: bytes.count)
        }
        self.bytes = bytes
    }
    
    /// Create an address from a hex string (with or without 0x prefix)
    public init(hex: String) throws {
        let cleanHex = hex.hasPrefix("0x") ? String(hex.dropFirst(2)) : hex
        guard cleanHex.count == 40 else {
            throw PrimitivesError.invalidHexLength(expected: 40, actual: cleanHex.count)
        }
        
        guard let data = Data(hexString: cleanHex) else {
            throw PrimitivesError.invalidHexString(cleanHex)
        }
        
        self.bytes = Array(data)
    }
    
    /// Create zero address (0x0000...0000)
    public static var zero: Address {
        // Safe to use try! because we know the length is correct
        try! Address(Array(repeating: 0, count: 20))
    }
    
    /// Get the address as bytes
    public var rawBytes: [UInt8] {
        bytes
    }
    
    /// Get the address as hex string with 0x prefix
    public var hexString: String {
        "0x" + bytes.map { String(format: "%02x", $0) }.joined()
    }
    
    /// Convert to C representation
    internal func toCAddress() -> GuillotineAddress {
        var cAddress = GuillotineAddress()
        withUnsafeBytes(of: &cAddress.bytes) { ptr in
            let buffer = ptr.bindMemory(to: UInt8.self)
            for i in 0..<20 {
                buffer[i] = bytes[i]
            }
        }
        return cAddress
    }
    
    /// Create from C representation
    internal init(from cAddress: GuillotineAddress) {
        self.bytes = withUnsafeBytes(of: cAddress.bytes) { ptr in
            Array(ptr.bindMemory(to: UInt8.self))
        }
    }
}

// MARK: - Equatable
extension Address: Equatable {
    public static func == (lhs: Address, rhs: Address) -> Bool {
        lhs.bytes == rhs.bytes
    }
}

// MARK: - Hashable
extension Address: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(bytes)
    }
}

// MARK: - Codable
extension Address: Codable {
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
extension Address: CustomStringConvertible {
    public var description: String {
        hexString
    }
}

// MARK: - ExpressibleByStringLiteral
extension Address: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) {
        try! self.init(hex: value)
    }
}