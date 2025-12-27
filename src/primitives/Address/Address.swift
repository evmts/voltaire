import Foundation
import CVoltaire

/// Ethereum address (20 bytes)
public struct Address: Equatable, Hashable, CustomStringConvertible, Sendable {
    /// Raw 20-byte address data
    private var raw: PrimitivesAddress

    /// Zero address (0x0000...0000)
    public static let zero = Address()

    /// Create zero address
    public init() {
        self.raw = PrimitivesAddress()
    }

    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        var addr = PrimitivesAddress()
        let result = hex.withCString { ptr in
            primitives_address_from_hex(ptr, &addr)
        }
        try checkResult(result)
        self.raw = addr
    }

    /// Create from raw bytes
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 20 else {
            throw VoltaireError.invalidLength
        }
        var addr = PrimitivesAddress()
        withUnsafeMutableBytes(of: &addr.bytes) { dest in
            bytes.withUnsafeBytes { src in
                dest.copyMemory(from: src)
            }
        }
        self.raw = addr
    }

    /// Convert to hex string (lowercase, with 0x prefix)
    public var hex: String {
        var addr = raw
        var buf = [CChar](repeating: 0, count: 43)
        primitives_address_to_hex(&addr, &buf)
        return String(cString: buf)
    }

    /// Convert to checksummed hex string (EIP-55)
    public var checksumHex: String {
        var addr = raw
        var buf = [CChar](repeating: 0, count: 43)
        primitives_address_to_checksum_hex(&addr, &buf)
        return String(cString: buf)
    }

    /// Check if this is the zero address
    public var isZero: Bool {
        var addr = raw
        return primitives_address_is_zero(&addr)
    }

    /// Validate EIP-55 checksum of a hex string
    public static func isValidChecksum(_ hex: String) -> Bool {
        return hex.withCString { ptr in
            primitives_address_validate_checksum(ptr)
        }
    }

    /// Convert to byte array
    public var bytes: [UInt8] {
        withUnsafeBytes(of: raw.bytes) { Array($0) }
    }

    // MARK: - CustomStringConvertible

    public var description: String {
        checksumHex
    }

    // MARK: - Equatable

    public static func == (lhs: Address, rhs: Address) -> Bool {
        var lhsRaw = lhs.raw
        var rhsRaw = rhs.raw
        return primitives_address_equals(&lhsRaw, &rhsRaw)
    }

    // MARK: - Hashable

    public func hash(into hasher: inout Hasher) {
        withUnsafeBytes(of: raw.bytes) { hasher.combine(bytes: $0) }
    }
}
