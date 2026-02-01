import Foundation
@_implementationOnly import CVoltaire

/// Keccak-256 hashing functions
public enum Keccak256 {
    /// Compute Keccak-256 hash of data
    public static func hash(_ data: [UInt8]) -> Hash {
        var cHash = PrimitivesHash()
        let rc = data.withUnsafeBufferPointer { ptr in
            primitives_keccak256(ptr.baseAddress, ptr.count, &cHash)
        }
        assert(rc == PRIMITIVES_SUCCESS, "primitives_keccak256 failed: \(rc)")
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

    /// Hash a message using EIP-191 personal sign format
    public static func hashEthereumMessage(_ message: [UInt8]) -> Hash {
        var out = PrimitivesHash()
        let rc = message.withUnsafeBufferPointer { ptr in
            primitives_eip191_hash_message(ptr.baseAddress, ptr.count, &out)
        }
        assert(rc == PRIMITIVES_SUCCESS, "primitives_eip191_hash_message failed: \(rc)")
        return Hash(cHash: out)
    }

    /// Hash a message using EIP-191 personal sign format
    public static func hashEthereumMessage(_ message: Data) -> Hash {
        hashEthereumMessage([UInt8](message))
    }

    /// Hash a message using EIP-191 personal sign format
    public static func hashEthereumMessage(_ message: String) -> Hash {
        hashEthereumMessage([UInt8](message.utf8))
    }
}
