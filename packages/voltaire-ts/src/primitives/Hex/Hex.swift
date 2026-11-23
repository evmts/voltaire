import Foundation
@_implementationOnly import CVoltaire

/// Hex encoding/decoding utilities
public enum Hex {
    /// Convert hex string to bytes
    public static func decode(_ hex: String) throws -> [UInt8] {
        // Use O(1) UTF-8 byte count instead of O(N) Character grapheme count,
        // and write directly into uninitialized capacity to avoid zero-fill + copy.
        let cap = hex.utf8.count / 2 + 1
        var rc: Int32 = 0
        let out = Array<UInt8>(unsafeUninitializedCapacity: cap) { buffer, initializedCount in
            rc = hex.withCString { ptr in
                primitives_hex_to_bytes(ptr, buffer.baseAddress, cap)
            }
            initializedCount = rc >= 0 ? Int(rc) : 0
        }
        if rc < 0 {
            throw VoltaireError(code: rc)
        }
        return out
    }

    /// Convert bytes to hex string (with 0x prefix)
    public static func encode(_ bytes: [UInt8]) -> String {
        let outLen = bytes.count * 2 + 2
        let cap = outLen + 1
        return String(unsafeUninitializedCapacity: cap) { buffer in
            let rc = bytes.withUnsafeBufferPointer { ptr in
                buffer.baseAddress!.withMemoryRebound(to: CChar.self, capacity: cap) { cPtr in
                    primitives_bytes_to_hex(ptr.baseAddress, ptr.count, cPtr, cap)
                }
            }
            assert(rc >= 0, "primitives_bytes_to_hex failed: \(rc)")
            return Int(rc)
        }
    }

    /// Convert Data to hex string
    public static func encode(_ data: Data) -> String {
        encode([UInt8](data))
    }
}
