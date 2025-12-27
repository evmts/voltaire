import Foundation
import CVoltaire

/// Secp256k1 private key (32 bytes)
public struct PrivateKey: Sendable, Equatable, CustomStringConvertible {
    private var bytes_: [UInt8] // 32 bytes

    public init(bytes: [UInt8]) throws {
        guard bytes.count == 32 else { throw VoltaireError.invalidLength }
        self.bytes_ = bytes
    }

    /// Generate a new random private key
    public static func generate() throws -> PrivateKey {
        var out = [UInt8](repeating: 0, count: 32)
        let rc = out.withUnsafeMutableBufferPointer { ptr in
            primitives_generate_private_key(ptr.baseAddress)
        }
        try checkResult(rc)
        return try PrivateKey(bytes: out)
    }

    /// Derive uncompressed public key (64 bytes)
    public func publicKey() throws -> PublicKey {
        var out = [UInt8](repeating: 0, count: 64)
        let rc = bytes_.withUnsafeBufferPointer { ptr in
            primitives_secp256k1_pubkey_from_private(ptr.baseAddress, &out)
        }
        try checkResult(rc)
        return try PublicKey(uncompressed: out)
    }

    /// Raw bytes
    public var bytes: [UInt8] { bytes_ }

    public var description: String { "PrivateKey(0x…\(Hex.encode(Array(bytes_.suffix(4)))))" }

    // Equatable
    public static func == (lhs: PrivateKey, rhs: PrivateKey) -> Bool { lhs.bytes_ == rhs.bytes_ }
}

