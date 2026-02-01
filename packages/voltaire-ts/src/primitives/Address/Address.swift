import Foundation
@_implementationOnly import CVoltaire

/// Ethereum address (20 bytes)
public struct Address: Equatable, Hashable, CustomStringConvertible, Sendable, Comparable {
    /// Raw 20-byte address data
    private var raw: PrimitivesAddress

    /// Zero address (0x0000...0000)
    public static let zero = Address()

    /// Create zero address
    public init() {
        self.raw = PrimitivesAddress()
    }

    /// Create from hex string (with or without 0x prefix)
    public init(hex: String) throws {
        var addr = PrimitivesAddress()
        let result = hex.withCString { ptr in
            primitives_address_from_hex(ptr, &addr)
        }
        try checkResult(result)
        self.raw = addr
    }

    /// Create from raw bytes
    public init(bytes: [UInt8]) throws {
        guard bytes.count == 20 else {
            throw VoltaireError.invalidLength
        }
        var addr = PrimitivesAddress()
        withUnsafeMutableBytes(of: &addr.bytes) { dest in
            bytes.withUnsafeBytes { src in
                dest.copyMemory(from: src)
            }
        }
        self.raw = addr
    }

    /// Convert to hex string (lowercase, with 0x prefix)
    public var hex: String {
        var addr = raw
        var buf = [CChar](repeating: 0, count: 43)
        let rc = primitives_address_to_hex(&addr, &buf)
        assert(rc >= 0, "primitives_address_to_hex failed: \(rc)")
        return String(cString: buf)
    }

    /// Convert to checksummed hex string (EIP-55)
    public var checksumHex: String {
        var addr = raw
        var buf = [CChar](repeating: 0, count: 43)
        let rc = primitives_address_to_checksum_hex(&addr, &buf)
        assert(rc >= 0, "primitives_address_to_checksum_hex failed: \(rc)")
        return String(cString: buf)
    }

    /// Lowercase hex string (alias of `hex`)
    public var lowercaseHex: String { hex }

    /// Uppercase hex string (0x + uppercase hex)
    public var uppercaseHex: String { hex.uppercased() }

    /// Short hex string (e.g. 0x123456...abc)
    public var shortHex: String {
        let h = self.hex
        guard h.count == 42 else { return h }
        let prefix = h.prefix(8) // 0x + 6 chars
        let suffix = h.suffix(3)
        return prefix + "..." + suffix
    }

    /// Check if this is the zero address
    public var isZero: Bool {
        var addr = raw
        return primitives_address_is_zero(&addr)
    }

    /// Validate EIP-55 checksum of a hex string
    public static func isValidChecksum(_ hex: String) -> Bool {
        return hex.withCString { ptr in
            primitives_address_validate_checksum(ptr)
        }
    }

    /// Create from checksummed hex string (EIP-55). Throws if checksum invalid.
    public init(checksummedHex: String) throws {
        guard Address.isValidChecksum(checksummedHex) else {
            throw VoltaireError.invalidChecksum
        }
        try self.init(hex: checksummedHex)
    }

    /// Validate an address hex string (with or without 0x prefix)
    public static func isValid(_ hex: String) -> Bool {
        var tmp = PrimitivesAddress()
        let rc = hex.withCString { ptr in
            primitives_address_from_hex(ptr, &tmp)
        }
        return rc == PRIMITIVES_SUCCESS
    }

    /// Convert to byte array
    public var bytes: [UInt8] {
        withUnsafeBytes(of: raw.bytes) { Array($0) }
    }

    // MARK: - CustomStringConvertible

    public var description: String {
        checksumHex
    }

    // MARK: - Equatable

    public static func == (lhs: Address, rhs: Address) -> Bool {
        var lhsRaw = lhs.raw
        var rhsRaw = rhs.raw
        return primitives_address_equals(&lhsRaw, &rhsRaw)
    }

    // MARK: - Hashable

    public func hash(into hasher: inout Hasher) {
        withUnsafeBytes(of: raw.bytes) { hasher.combine(bytes: $0) }
    }

    // MARK: - Comparable

    public static func < (lhs: Address, rhs: Address) -> Bool {
        let a = lhs.bytes
        let b = rhs.bytes
        for i in 0..<20 {
            if a[i] < b[i] { return true }
            if a[i] > b[i] { return false }
        }
        return false
    }

    // MARK: - ABI encoding helpers

    /// 32-byte ABI-encoded representation (left-padded)
    public var abiEncoded: [UInt8] {
        var out = [UInt8](repeating: 0, count: 32)
        let src = self.bytes
        for i in 0..<20 { out[12 + i] = src[i] }
        return out
    }

    /// Create address from 32-byte ABI-encoded value
    public static func fromAbiEncoded(_ bytes: [UInt8]) throws -> Address {
        guard bytes.count == 32 else { throw VoltaireError.invalidLength }
        let last20 = Array(bytes.suffix(20))
        return try Address(bytes: last20)
    }

    // MARK: - U256 conversion

    /// Convert address to U256 (20 bytes as least significant bytes)
    public var asU256: U256 {
        var buf = [UInt8](repeating: 0, count: 32)
        let src = self.bytes
        for i in 0..<20 { buf[12 + i] = src[i] }
        // U256 init cannot fail here (length fixed)
        // Force unwrap via try! is safe due to length validation
        return try! U256(bytes: buf)
    }

    /// Create address from U256 (uses least significant 20 bytes)
    public static func from(u256: U256) -> Address {
        // Take last 20 bytes
        let last20 = Array(u256.bytes.suffix(20))
        // This cannot throw due to fixed length
        return try! Address(bytes: last20)
    }

    // MARK: - Base64

    /// Create address from base64-encoded 20-byte data
    public static func fromBase64(_ base64: String) throws -> Address {
        guard let data = Data(base64Encoded: base64) else {
            throw VoltaireError.invalidInput
        }
        return try Address(bytes: [UInt8](data))
    }

    // MARK: - Contract address derivation

    /// Calculate CREATE contract address (sender + nonce)
    public static func calculateCreate(sender: Address, nonce: UInt64) throws -> Address {
        var out = PrimitivesAddress()
        var s = sender.raw
        let rc = primitives_calculate_create_address(&s, nonce, &out)
        try checkResult(rc)
        return try Address(bytes: withUnsafeBytes(of: out.bytes) { Array($0) })
    }

    /// Calculate CREATE2 contract address (sender + salt + init code)
    public static func calculateCreate2(sender: Address, salt: Bytes32, initCode: [UInt8]) throws -> Address {
        var out = PrimitivesAddress()
        var s = sender.raw
        let saltBytes = salt.bytes
        let rc = saltBytes.withUnsafeBufferPointer { saltPtr in
            initCode.withUnsafeBufferPointer { codePtr in
                primitives_calculate_create2_address(&s, saltPtr.baseAddress, codePtr.baseAddress, codePtr.count, &out)
            }
        }
        try checkResult(rc)
        return try Address(bytes: withUnsafeBytes(of: out.bytes) { Array($0) })
    }
}
