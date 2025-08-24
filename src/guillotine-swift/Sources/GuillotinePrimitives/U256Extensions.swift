import Foundation

// MARK: - U256 Enhanced Operations

extension U256 {
    /// Safe arithmetic operations with overflow checking
    public func safeAdd(_ other: U256) throws -> U256 {
        return try adding(other)
    }
    
    public func safeSub(_ other: U256) throws -> U256 {
        return try subtracting(other)
    }
    
    public func safeMul(_ other: U256) throws -> U256 {
        // Simplified multiplication - would need proper big integer implementation
        guard let selfValue = uint64Value, let otherValue = other.uint64Value else {
            throw PrimitivesError.overflow
        }
        
        let (result, overflow) = selfValue.multipliedReportingOverflow(by: otherValue)
        if overflow {
            throw PrimitivesError.overflow
        }
        
        return U256(result)
    }
    
    public func safeDiv(_ other: U256) throws -> U256 {
        guard other != .zero else {
            throw PrimitivesError.divisionByZero
        }
        
        guard let selfValue = uint64Value, let otherValue = other.uint64Value else {
            throw PrimitivesError.overflow
        }
        
        return U256(selfValue / otherValue)
    }
    
    public func safeMod(_ other: U256) throws -> U256 {
        guard other != .zero else {
            throw PrimitivesError.divisionByZero
        }
        
        guard let selfValue = uint64Value, let otherValue = other.uint64Value else {
            throw PrimitivesError.overflow
        }
        
        return U256(selfValue % otherValue)
    }
    
    public func safePow(_ exponent: U256) throws -> U256 {
        guard let selfValue = uint64Value, let expValue = exponent.uint64Value else {
            throw PrimitivesError.overflow
        }
        
        guard expValue <= 64 else { // Prevent massive exponents
            throw PrimitivesError.overflow
        }
        
        var result: UInt64 = 1
        var base = selfValue
        var exp = expValue
        
        while exp > 0 {
            if exp & 1 == 1 {
                let (newResult, overflow) = result.multipliedReportingOverflow(by: base)
                if overflow {
                    throw PrimitivesError.overflow
                }
                result = newResult
            }
            
            let (newBase, overflow) = base.multipliedReportingOverflow(by: base)
            if overflow && exp > 1 {
                throw PrimitivesError.overflow
            }
            base = newBase
            exp >>= 1
        }
        
        return U256(result)
    }
    
    /// Bitwise operations
    public func and(_ other: U256) -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        for i in 0..<32 {
            result[i] = bytes[i] & other.bytes[i]
        }
        return try! U256(bytes: result)
    }
    
    public func or(_ other: U256) -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        for i in 0..<32 {
            result[i] = bytes[i] | other.bytes[i]
        }
        return try! U256(bytes: result)
    }
    
    public func xor(_ other: U256) -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        for i in 0..<32 {
            result[i] = bytes[i] ^ other.bytes[i]
        }
        return try! U256(bytes: result)
    }
    
    public func not() -> U256 {
        var result = Array(repeating: UInt8(0), count: 32)
        for i in 0..<32 {
            result[i] = ~bytes[i]
        }
        return try! U256(bytes: result)
    }
    
    public func shiftLeft(_ positions: Int) -> U256 {
        guard positions > 0 && positions < 256 else {
            return positions >= 256 ? .zero : self
        }
        
        let byteShifts = positions / 8
        let bitShifts = positions % 8
        
        var result = Array(repeating: UInt8(0), count: 32)
        
        if byteShifts < 32 {
            for i in 0..<(32 - byteShifts) {
                let sourceIndex = i
                let destIndex = i + byteShifts
                
                if bitShifts == 0 {
                    result[destIndex] = bytes[sourceIndex]
                } else {
                    result[destIndex] |= bytes[sourceIndex] << bitShifts
                    if sourceIndex > 0 {
                        result[destIndex] |= bytes[sourceIndex - 1] >> (8 - bitShifts)
                    }
                }
            }
        }
        
        return try! U256(bytes: result)
    }
    
    public func shiftRight(_ positions: Int) -> U256 {
        guard positions > 0 && positions < 256 else {
            return positions >= 256 ? .zero : self
        }
        
        let byteShifts = positions / 8
        let bitShifts = positions % 8
        
        var result = Array(repeating: UInt8(0), count: 32)
        
        if byteShifts < 32 {
            for i in byteShifts..<32 {
                let sourceIndex = i
                let destIndex = i - byteShifts
                
                if bitShifts == 0 {
                    result[destIndex] = bytes[sourceIndex]
                } else {
                    result[destIndex] |= bytes[sourceIndex] >> bitShifts
                    if sourceIndex < 31 {
                        result[destIndex] |= bytes[sourceIndex + 1] << (8 - bitShifts)
                    }
                }
            }
        }
        
        return try! U256(bytes: result)
    }
    
    /// Create from Wei/Ether/Gwei
    public static func wei(_ amount: UInt64) -> U256 {
        U256(amount)
    }
    
    public static func ether(_ amount: Double) -> U256 {
        // 1 ether = 10^18 wei
        let weiPerEther: UInt64 = 1_000_000_000_000_000_000
        let weiAmount = UInt64(amount * Double(weiPerEther))
        return U256(weiAmount)
    }
    
    public static func gwei(_ amount: UInt64) -> U256 {
        // 1 gwei = 10^9 wei
        let weiPerGwei: UInt64 = 1_000_000_000
        return U256(amount * weiPerGwei)
    }
    
    /// Check if the value is zero
    public var isZero: Bool {
        return self == .zero
    }
    
    /// Check if the value is one
    public var isOne: Bool {
        return self == U256(1)
    }
}