import Foundation
import CVoltaire

/// Keccak-256 hashing functions
public enum Keccak256 {
    /// Compute Keccak-256 hash of data
    public static func hash(_ data: [UInt8]) -> Hash {
        var cHash = PrimitivesHash()
        data.withUnsafeBufferPointer { ptr in
            _ = primitives_keccak256(ptr.baseAddress, ptr.count, &cHash)
        }
        return Hash(cHash: cHash)
    }

    /// Compute Keccak-256 hash of data
    public static func hash(_ data: Data) -> Hash {
        hash([UInt8](data))
    }

    /// Compute Keccak-256 hash of UTF-8 string
    public static func hash(_ string: String) -> Hash {
        hash([UInt8](string.utf8))
    }
}
