import Foundation
@_implementationOnly import CVoltaire

/// ECDSA secp256k1 signature (r, s, v)
public struct Signature: Sendable, Equatable, CustomStringConvertible {
    internal var raw: PrimitivesSignature

    public init(r: [UInt8], s: [UInt8], v: UInt8) throws {
        guard r.count == 32, s.count == 32 else {
            throw VoltaireError.invalidLength
        }
        var sig = PrimitivesSignature()
        withUnsafeMutableBytes(of: &sig.r) { dest in
            r.withUnsafeBytes { src in dest.copyMemory(from: src) }
        }
        withUnsafeMutableBytes(of: &sig.s) { dest in
            s.withUnsafeBytes { src in dest.copyMemory(from: src) }
        }
        sig.v = v

        // Validate r/s range
        // Assign without validation (callers can use isCanonical/validate separately)
        self.raw = sig
    }

    /// Parse from compact signature data (64 or 65 bytes)
    public init(compact: [UInt8]) throws {
        var sig = PrimitivesSignature()
        let rc = compact.withUnsafeBufferPointer { ptr in
            withUnsafeMutablePointer(to: &sig.r) { rPtr in
                withUnsafeMutablePointer(to: &sig.s) { sPtr in
                    withUnsafeMutablePointer(to: &sig.v) { vPtr in
                        rPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { rBytes in
                            sPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { sBytes in
                                primitives_signature_parse(ptr.baseAddress, ptr.count, rBytes, sBytes, vPtr)
                            }
                        }
                    }
                }
            }
        }
        try checkResult(rc)
        self.raw = sig
    }

    /// r component (32 bytes)
    public var r: [UInt8] {
        withUnsafeBytes(of: raw.r) { Array($0) }
    }

    /// s component (32 bytes)
    public var s: [UInt8] {
        withUnsafeBytes(of: raw.s) { Array($0) }
    }

    /// v recovery id (0,1,27,28)
    public var v: UInt8 { raw.v }

    /// Check if signature is in canonical form (low-s)
    public var isCanonical: Bool {
        let rBytes = self.r
        let sBytes = self.s
        return rBytes.withUnsafeBufferPointer { rPtr in
            sBytes.withUnsafeBufferPointer { sPtr in
                primitives_signature_is_canonical(rPtr.baseAddress, sPtr.baseAddress)
            }
        }
    }

    /// Validate signature component ranges (r and s within curve order)
    public var isValid: Bool {
        let rBytes = self.r
        let sBytes = self.s
        return rBytes.withUnsafeBufferPointer { rPtr in
            sBytes.withUnsafeBufferPointer { sPtr in
                primitives_secp256k1_validate_signature(rPtr.baseAddress, sPtr.baseAddress)
            }
        }
    }

    /// Return a normalized copy (low-s). If already canonical, returns self.
    public func normalized() -> Signature {
        var copy = raw
        withUnsafeMutablePointer(to: &copy.r) { rPtr in
            withUnsafeMutablePointer(to: &copy.s) { sPtr in
                rPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { rBytes in
                    sPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { sBytes in
                        _ = primitives_signature_normalize(rBytes, sBytes)
                    }
                }
            }
        }
        return Signature(raw: copy)
    }

    /// Serialize to compact format (64 or 65 bytes)
    public func serialize(includeV: Bool = true) -> [UInt8] {
        var out = [UInt8](repeating: 0, count: includeV ? 65 : 64)
        withUnsafePointer(to: raw.r) { rPtr in
            withUnsafePointer(to: raw.s) { sPtr in
                rPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { rBytes in
                    sPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { sBytes in
                        let rc = primitives_signature_serialize(rBytes, sBytes, raw.v, includeV, &out)
                        assert(rc >= 0, "primitives_signature_serialize failed: \(rc)")
                    }
                }
            }
        }
        return out
    }

    /// Recover uncompressed public key (64 bytes) from message hash
    public func recoverPublicKey(messageHash: Hash) throws -> PublicKey {
        var pubkey = [UInt8](repeating: 0, count: 64)
        let mh = messageHash.raw
        let rc = withUnsafePointer(to: raw.r) { rPtr in
            withUnsafePointer(to: raw.s) { sPtr in
                rPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { rBytes in
                    sPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { sBytes in
                        withUnsafePointer(to: mh.bytes) { mhPtr in
                            mhPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { mhBytes in
                                primitives_secp256k1_recover_pubkey(mhBytes, rBytes, sBytes, raw.v, &pubkey)
                            }
                        }
                    }
                }
            }
        }
        try checkResult(rc)
        return try PublicKey(uncompressed: pubkey)
    }

    /// Recover address from message hash
    public func recoverAddress(messageHash: Hash) throws -> Address {
        var addr = PrimitivesAddress()
        let mh = messageHash.raw
        let rc = withUnsafePointer(to: raw.r) { rPtr in
            withUnsafePointer(to: raw.s) { sPtr in
                rPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { rBytes in
                    sPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { sBytes in
                        withUnsafePointer(to: mh.bytes) { mhPtr in
                            mhPtr.withMemoryRebound(to: UInt8.self, capacity: 32) { mhBytes in
                                primitives_secp256k1_recover_address(mhBytes, rBytes, sBytes, raw.v, &addr)
                            }
                        }
                    }
                }
            }
        }
        try checkResult(rc)
        // Create Swift Address from raw C type
        return try Address(bytes: withUnsafeBytes(of: addr.bytes) { Array($0) })
    }

    // MARK: - Equatable
    public static func == (lhs: Signature, rhs: Signature) -> Bool {
        lhs.r == rhs.r && lhs.s == rhs.s && lhs.v == rhs.v
    }

    // MARK: - CustomStringConvertible
    public var description: String {
        let hex = Hex.encode(serialize())
        return "Signature(\(hex))"
    }

    // Internal init from raw type
    internal init(raw: PrimitivesSignature) {
        self.raw = raw
    }
}
