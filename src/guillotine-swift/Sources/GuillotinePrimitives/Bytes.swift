import Foundation

/// Variable-length byte array
public struct Bytes: Sendable {
    private var data: Data
    
    /// Create from Data
    public init(_ data: Data) {
        self.data = data
    }
    
    /// Create from byte array
    public init(_ bytes: [UInt8]) {
        self.data = Data(bytes)
    }
    
    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        let cleanHex = hex.hasPrefix("0x") ? String(hex.dropFirst(2)) : hex
        
        // Ensure even number of characters
        let paddedHex = cleanHex.count % 2 == 0 ? cleanHex : "0" + cleanHex
        
        guard let data = Data(hexString: paddedHex) else {
            throw PrimitivesError.invalidHexString(paddedHex)
        }
        
        self.data = data
    }
    
    /// Empty bytes
    public static var empty: Bytes {
        Bytes(Data())
    }
    
    /// Get as Data
    public var asData: Data {
        data
    }
    
    /// Get as byte array
    public var bytes: [UInt8] {
        Array(data)
    }
    
    /// Get as hex string with 0x prefix
    public var hexString: String {
        if data.isEmpty {
            return "0x"
        }
        return "0x" + data.map { String(format: "%02x", $0) }.joined()
    }
    
    /// Number of bytes
    public var count: Int {
        data.count
    }
    
    /// Check if empty
    public var isEmpty: Bool {
        data.isEmpty
    }
    
    /// Get byte at index
    public subscript(index: Int) -> UInt8 {
        data[index]
    }
    
    /// Append bytes
    public mutating func append(_ other: Bytes) {
        data.append(other.data)
    }
    
    /// Append byte array
    public mutating func append(_ bytes: [UInt8]) {
        data.append(contentsOf: bytes)
    }
}

// MARK: - Equatable
extension Bytes: Equatable {
    public static func == (lhs: Bytes, rhs: Bytes) -> Bool {
        lhs.data == rhs.data
    }
}

// MARK: - Hashable
extension Bytes: Hashable {
    public func hash(into hasher: inout Hasher) {
        hasher.combine(data)
    }
}

// MARK: - Codable
extension Bytes: Codable {
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
extension Bytes: CustomStringConvertible {
    public var description: String {
        hexString
    }
}

// MARK: - ExpressibleByStringLiteral
extension Bytes: ExpressibleByStringLiteral {
    public init(stringLiteral value: String) {
        try! self.init(hex: value)
    }
}

// MARK: - ExpressibleByArrayLiteral
extension Bytes: ExpressibleByArrayLiteral {
    public init(arrayLiteral elements: UInt8...) {
        self.init(elements)
    }
}