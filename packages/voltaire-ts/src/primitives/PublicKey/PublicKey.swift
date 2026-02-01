import Foundation
@_implementationOnly import CVoltaire

/// Secp256k1 uncompressed public key (x || y, 64 bytes)
public struct PublicKey: Sendable, Equatable, CustomStringConvertible {
    private var bytes_: [UInt8] // 64 bytes

    public init(uncompressed: [UInt8]) throws {
        guard uncompressed.count == 64 else { throw VoltaireError.invalidLength }
        self.bytes_ = uncompressed
    }

    /// Raw uncompressed bytes (64 bytes)
    public var uncompressed: [UInt8] { bytes_ }

    /// Compressed SEC1 representation (33 bytes)
    public func compressed() throws -> [UInt8] {
        var out = [UInt8](repeating: 0, count: 33)
        let rc = bytes_.withUnsafeBufferPointer { ptr in
            primitives_compress_public_key(ptr.baseAddress, &out)
        }
        try checkResult(rc)
        return out
    }

    /// Ethereum address derived from this public key
    public func address() throws -> Address {
        // Ethereum uses Keccak256 of the uncompressed public key (no prefix), last 20 bytes
        let hash = Keccak256.hash(bytes_)
        let last20 = Array(hash.bytes.suffix(20))
        return try Address(bytes: last20)
    }

    public var description: String { "PublicKey(64 bytes)" }

    public static func == (lhs: PublicKey, rhs: PublicKey) -> Bool { lhs.bytes_ == rhs.bytes_ }
}
