import Foundation
import CVoltaire

/// 32-byte hash value (Keccak-256, etc.)
public struct Hash: Equatable, Hashable, CustomStringConvertible, Sendable {
    /// Raw C struct
    internal var raw: PrimitivesHash

    /// Zero hash
    public static let zero = Hash()

    /// Create zero hash
    public init() {
        self.raw = PrimitivesHash()
    }

    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        var hash = PrimitivesHash()
        let result = hex.withCString { ptr in
            primitives_hash_from_hex(ptr, &hash)
        }
        try checkResult(result)
        self.raw = hash
    }

    /// Create from raw bytes
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 32 else {
            throw VoltaireError.invalidLength
        }
        var hash = PrimitivesHash()
        withUnsafeMutableBytes(of: &hash.bytes) { dest in
            bytes.withUnsafeBytes { src in
                dest.copyMemory(from: src)
            }
        }
        self.raw = hash
    }

    /// Create from C API type
    internal init(cHash: PrimitivesHash) {
        self.raw = cHash
    }

    /// Convert to hex string (lowercase, with 0x prefix)
    public var hex: String {
        var hash = raw
        var buf = [CChar](repeating: 0, count: 67)
        primitives_hash_to_hex(&hash, &buf)
        return String(cString: buf)
    }

    /// Convert to byte array
    public var bytes: [UInt8] {
        withUnsafeBytes(of: raw.bytes) { Array($0) }
    }

    // MARK: - CustomStringConvertible

    public var description: String {
        hex
    }

    // MARK: - Equatable (constant-time)

    public static func == (lhs: Hash, rhs: Hash) -> Bool {
        var lhsRaw = lhs.raw
        var rhsRaw = rhs.raw
        return primitives_hash_equals(&lhsRaw, &rhsRaw)
    }

    // MARK: - Hashable

    public func hash(into hasher: inout Hasher) {
        withUnsafeBytes(of: raw.bytes) { hasher.combine(bytes: $0) }
    }
}
