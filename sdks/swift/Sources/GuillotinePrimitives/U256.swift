import Foundation
import GuillotineC

/// 256-bit unsigned integer
public struct U256: Sendable {
    internal let bytes: [UInt8] // Little-endian representation
    
    /// Create U256 from UInt64
    public init(_ value: UInt64) {
        var bytes = Array(repeating: UInt8(0), count: 32)
        var val = value
        for i in 0..<8 {
            bytes[i] = UInt8(val & 0xFF)
            val >>= 8
        }
        self.bytes = bytes
    }
    
    /// Create U256 from bytes (little-endian)
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 32 else {
            throw PrimitivesError.invalidLength(expected: 32, actual: bytes.count)
        }
        self.bytes = bytes
    }
    
    /// Create U256 from hex string
    public init(hex: String) throws {
        let cleanHex = hex.hasPrefix("0x") ? String(hex.dropFirst(2)) : hex
        guard cleanHex.count <= 64 else {
            throw PrimitivesError.invalidHexLength(expected: 64, actual: cleanHex.count)
        }
        
        // Pad with leading zeros if needed
        let paddedHex = cleanHex.count < 64 ? String(repeating: "0", count: 64 - cleanHex.count) + cleanHex : cleanHex
        
        guard let data = Data(hexString: paddedHex) else {
            throw PrimitivesError.invalidHexString(paddedHex)
        }
        
        // Convert from big-endian (hex) to little-endian (internal)
        self.bytes = Array(data.reversed())
    }
    
    /// Zero value
    public static var zero: U256 {
        U256(0)
    }
    
    /// Maximum value (2^256 - 1)
    public static var max: U256 {
        try! U256(bytes: Array(repeating: 0xFF, count: 32))
    }
    
    /// Get as little-endian bytes
    public var rawBytes: [UInt8] {
        bytes
    }
    
    /// Get as hex string (big-endian representation)
    public var hexString: String {
        let bigEndianBytes = bytes.reversed()
        let hexString = bigEndianBytes.map { String(format: "%02x", $0) }.joined()
        return "0x" + hexString
    }
    
    /// Get as UInt64 (only if value fits)
    public var uint64Value: UInt64? {
        // Check if high bytes are zero
        for i in 8..<32 {
            if bytes[i] != 0 {
                return nil
            }
        }
        
        var result: UInt64 = 0
        for i in 0..<8 {
            result |= UInt64(bytes[i]) << (i * 8)
        }
        return result
    }
    
    /// Convert to C representation
    public func toCU256() -> GuillotineU256 {
        var cU256 = GuillotineU256()
        withUnsafeMutableBytes(of: &cU256.bytes) { ptr in
            let buffer = ptr.bindMemory(to: UInt8.self)
            for i in 0..<32 {
                buffer[i] = bytes[i]
            }
        }
        return cU256
    }
    
    /// Create from C representation
    internal init(from cU256: GuillotineU256) {
        self.bytes = withUnsafeBytes(of: cU256.bytes) { ptr in
            Array(ptr.bindMemory(to: UInt8.self))
        }
    }
}

// MARK: - Arithmetic Operations
extension U256 {
    /// Addition (with overflow checking)
    public func adding(_ other: U256) throws -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        var carry: UInt16 = 0
        
        for i in 0..<32 {
            let sum = UInt16(bytes[i]) + UInt16(other.bytes[i]) + carry
            result[i] = UInt8(sum & 0xFF)
            carry = sum >> 8
        }
        
        if carry != 0 {
            throw PrimitivesError.overflow
        }
        
        return try U256(bytes: result)
    }
    
    /// Subtraction (with underflow checking)
    public func subtracting(_ other: U256) throws -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        var borrow: Int16 = 0
        
        for i in 0..<32 {
            let diff = Int16(bytes[i]) - Int16(other.bytes[i]) - borrow
            if diff < 0 {
                result[i] = UInt8(diff + 256)
                borrow = 1
            } else {
                result[i] = UInt8(diff)
                borrow = 0
            }
        }
        
        if borrow != 0 {
            throw PrimitivesError.underflow
        }
        
        return try U256(bytes: result)
    }
}

// MARK: - Equatable
extension U256: Equatable {
    public static func == (lhs: U256, rhs: U256) -> Bool {
        lhs.bytes == rhs.bytes
    }
}

// MARK: - Comparable
extension U256: Comparable {
    public static func < (lhs: U256, rhs: U256) -> Bool {
        // Compare from most significant byte to least significant
        for i in stride(from: 31, through: 0, by: -1) {
            if lhs.bytes[i] < rhs.bytes[i] {
                return true
            } else if lhs.bytes[i] > rhs.bytes[i] {
                return false
            }
        }
        return false // Equal
    }
}

// MARK: - Hashable
extension U256: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(bytes)
    }
}

// MARK: - Codable
extension U256: Codable {
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        if let intValue = try? container.decode(UInt64.self) {
            self.init(intValue)
        } else {
            let hexString = try container.decode(String.self)
            try self.init(hex: hexString)
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        if let uint64Value = uint64Value {
            try container.encode(uint64Value)
        } else {
            try container.encode(hexString)
        }
    }
}

// MARK: - CustomStringConvertible
extension U256: CustomStringConvertible {
    public var description: String {
        hexString
    }
}

// MARK: - ExpressibleByIntegerLiteral
extension U256: ExpressibleByIntegerLiteral {
    public init(integerLiteral value: UInt64) {
        self.init(value)
    }
}