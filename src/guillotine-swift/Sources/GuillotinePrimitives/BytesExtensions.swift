import Foundation

// MARK: - Bytes Enhanced Operations

extension Bytes {
    /// Simple hash (would use Keccak256 in production)
    public var keccak256: Bytes {
        // Simplified hash implementation for demo
        // In production, this should use proper Keccak-256
        let inputBytes = self.bytes
        var hash = [UInt8](repeating: 0, count: 32)
        
        // Simple XOR-based hash (NOT cryptographically secure)
        for (index, byte) in inputBytes.enumerated() {
            hash[index % 32] ^= byte
        }
        
        return Bytes(hash)
    }
    
    /// Slice bytes from start with given length
    public func slice(from start: Int, length: Int) throws -> Bytes {
        let endIndex = start + length
        guard start >= 0, length >= 0, endIndex <= self.count else {
            throw PrimitivesError.invalidLength(expected: length, actual: self.count - start)
        }
        
        let slicedBytes = Array(self.bytes[start..<endIndex])
        return Bytes(slicedBytes)
    }
    
    /// Pad bytes to specific length
    public func padded(to length: Int, with byte: UInt8 = 0) -> Bytes {
        if self.count >= length {
            return self
        }
        
        let paddingLength = length - self.count
        var result = self.bytes
        result.append(contentsOf: Array(repeating: byte, count: paddingLength))
        
        return Bytes(result)
    }
    
    /// Left-pad bytes to specific length
    public func leftPadded(to length: Int, with byte: UInt8 = 0) -> Bytes {
        if self.count >= length {
            return self
        }
        
        let paddingLength = length - self.count
        var result = Array(repeating: byte, count: paddingLength)
        result.append(contentsOf: self.bytes)
        
        return Bytes(result)
    }
    
    /// Convert to U256 (big-endian interpretation)
    public func toU256() throws -> U256 {
        guard self.count <= 32 else {
            throw PrimitivesError.invalidLength(expected: 32, actual: self.count)
        }
        
        // Pad to 32 bytes and convert from big-endian to little-endian
        let paddedBytes = self.leftPadded(to: 32).bytes
        let littleEndianBytes = Array(paddedBytes.reversed())
        
        return try U256(bytes: littleEndianBytes)
    }
    
    /// Convert to Address (must be exactly 20 bytes)
    public func toAddress() throws -> Address {
        guard self.count == 20 else {
            throw PrimitivesError.invalidLength(expected: 20, actual: self.count)
        }
        
        return try Address(self.bytes)
    }
    
    /// Convert to Address from last 20 bytes (for hash-derived addresses)
    public func toAddressFromHash() throws -> Address {
        guard self.count >= 20 else {
            throw PrimitivesError.invalidLength(expected: 20, actual: self.count)
        }
        
        let addressBytes = Array(self.bytes.suffix(20))
        return try Address(addressBytes)
    }
    
    /// Check if bytes start with specific prefix
    public func hasPrefix(_ prefix: Bytes) -> Bool {
        guard self.count >= prefix.count else { return false }
        
        for i in 0..<prefix.count {
            if self.bytes[i] != prefix.bytes[i] {
                return false
            }
        }
        
        return true
    }
    
    /// Check if bytes end with specific suffix
    public func hasSuffix(_ suffix: Bytes) -> Bool {
        guard self.count >= suffix.count else { return false }
        
        let startIndex = self.count - suffix.count
        for i in 0..<suffix.count {
            if self.bytes[startIndex + i] != suffix.bytes[i] {
                return false
            }
        }
        
        return true
    }
    
    /// Concatenate with other bytes
    public func concatenated(with other: Bytes) -> Bytes {
        var result = self.bytes
        result.append(contentsOf: other.bytes)
        return Bytes(result)
    }
    
    /// Reverse the bytes
    public func reversed() -> Bytes {
        return Bytes(Array(self.bytes.reversed()))
    }
    
    /// Get bytes as UInt64 (little-endian, up to 8 bytes)
    public func toUInt64() throws -> UInt64 {
        guard self.count <= 8 else {
            throw PrimitivesError.invalidLength(expected: 8, actual: self.count)
        }
        
        var result: UInt64 = 0
        for (index, byte) in self.bytes.enumerated() {
            result |= UInt64(byte) << (index * 8)
        }
        
        return result
    }
    
    /// Get bytes as UInt32 (little-endian, up to 4 bytes)
    public func toUInt32() throws -> UInt32 {
        guard self.count <= 4 else {
            throw PrimitivesError.invalidLength(expected: 4, actual: self.count)
        }
        
        var result: UInt32 = 0
        for (index, byte) in self.bytes.enumerated() {
            result |= UInt32(byte) << (index * 8)
        }
        
        return result
    }
}

// MARK: - Static Constructors

extension Bytes {
    /// Create bytes from UInt64 (little-endian)
    public static func from(uint64: UInt64) -> Bytes {
        var value = uint64
        var bytes = [UInt8]()
        
        for _ in 0..<8 {
            bytes.append(UInt8(value & 0xFF))
            value >>= 8
        }
        
        return Bytes(bytes)
    }
    
    /// Create bytes from UInt32 (little-endian)
    public static func from(uint32: UInt32) -> Bytes {
        var value = uint32
        var bytes = [UInt8]()
        
        for _ in 0..<4 {
            bytes.append(UInt8(value & 0xFF))
            value >>= 8
        }
        
        return Bytes(bytes)
    }
    
    /// Create random bytes of specific length
    public static func random(length: Int) -> Bytes {
        var bytes = [UInt8](repeating: 0, count: length)
        for i in 0..<length {
            bytes[i] = UInt8.random(in: 0...255)
        }
        return Bytes(bytes)
    }
}