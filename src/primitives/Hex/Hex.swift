import Foundation
import CVoltaire

/// Hex encoding/decoding utilities
public enum Hex {
    /// Convert hex string to bytes
    public static func decode(_ hex: String) throws -> [UInt8] {
        var buf = [UInt8](repeating: 0, count: hex.count / 2 + 1)
        let result = hex.withCString { ptr in
            primitives_hex_to_bytes(ptr, &buf, buf.count)
        }
        if result < 0 {
            throw VoltaireError(code: result)
        }
        return Array(buf.prefix(Int(result)))
    }

    /// Convert bytes to hex string (with 0x prefix)
    public static func encode(_ bytes: [UInt8]) -> String {
        var buf = [CChar](repeating: 0, count: bytes.count * 2 + 3)
        bytes.withUnsafeBufferPointer { ptr in
            _ = primitives_bytes_to_hex(ptr.baseAddress, ptr.count, &buf, buf.count)
        }
        return String(cString: buf)
    }

    /// Convert Data to hex string
    public static func encode(_ data: Data) -> String {
        encode([UInt8](data))
    }
}
