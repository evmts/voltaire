import Foundation
import CVoltaire

/// 256-bit unsigned integer (big-endian)
public struct U256: Equatable, Hashable, CustomStringConvertible, Sendable {
    internal var raw: PrimitivesU256

    /// Zero value
    public static let zero = U256()

    /// Create zero
    public init() {
        self.raw = PrimitivesU256()
    }

    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        var v = PrimitivesU256()
        let rc = hex.withCString { ptr in
            primitives_u256_from_hex(ptr, &v)
        }
        try checkResult(rc)
        self.raw = v
    }

    /// Create from 32 raw bytes (big-endian)
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 32 else {
            throw VoltaireError.invalidLength
        }
        var v = PrimitivesU256()
        withUnsafeMutableBytes(of: &v.bytes) { dest in
            bytes.withUnsafeBytes { src in
                dest.copyMemory(from: src)
            }
        }
        self.raw = v
    }

    /// Convert to hex string (0x-prefixed, 64 hex chars)
    public var hex: String {
        var v = raw
        var buf = [CChar](repeating: 0, count: 67)
        _ = primitives_u256_to_hex(&v, &buf, buf.count)
        return String(cString: buf)
    }

    /// Raw bytes (big-endian)
    public var bytes: [UInt8] {
        withUnsafeBytes(of: raw.bytes) { Array($0) }
    }

    public var description: String { hex }

    public static func == (lhs: U256, rhs: U256) -> Bool {
        lhs.bytes == rhs.bytes
    }

    public func hash(into hasher: inout Hasher) {
        withUnsafeBytes(of: raw.bytes) { hasher.combine(bytes: $0) }
    }
}

