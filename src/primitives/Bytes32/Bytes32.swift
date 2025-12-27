import Foundation
import CVoltaire

/// Fixed-size 32-byte value (generic, not necessarily a hash)
public struct Bytes32: Equatable, Hashable, CustomStringConvertible, Sendable {
    internal var raw: PrimitivesHash

    public static let zero = Bytes32()

    public init() {
        self.raw = PrimitivesHash()
    }

    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        var v = PrimitivesHash()
        let rc = hex.withCString { ptr in
            primitives_hash_from_hex(ptr, &v)
        }
        try checkResult(rc)
        self.raw = v
    }

    /// Create from raw bytes (32 bytes)
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 32 else {
            throw VoltaireError.invalidLength
        }
        var v = PrimitivesHash()
        withUnsafeMutableBytes(of: &v.bytes) { dest in
            bytes.withUnsafeBytes { src in
                dest.copyMemory(from: src)
            }
        }
        self.raw = v
    }

    /// Convert to hex string (0x + 64 hex chars)
    public var hex: String {
        var v = raw
        var buf = [CChar](repeating: 0, count: 67)
        _ = primitives_hash_to_hex(&v, &buf)
        return String(cString: buf)
    }

    /// Raw bytes
    public var bytes: [UInt8] {
        withUnsafeBytes(of: raw.bytes) { Array($0) }
    }

    public var description: String { hex }

    public static func == (lhs: Bytes32, rhs: Bytes32) -> Bool {
        var a = lhs.raw
        var b = rhs.raw
        return primitives_hash_equals(&a, &b)
    }

    public func hash(into hasher: inout Hasher) {
        withUnsafeBytes(of: raw.bytes) { hasher.combine(bytes: $0) }
    }
}

