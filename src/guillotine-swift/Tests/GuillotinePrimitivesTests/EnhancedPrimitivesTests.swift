import XCTest
@testable import GuillotinePrimitives

final class EnhancedPrimitivesTests: XCTestCase {
    
    // MARK: - Address Extension Tests
    
    func testRandomAddressGeneration() throws {
        let addr1 = Address.random()
        let addr2 = Address.random()
        
        // Addresses should be different
        XCTAssertNotEqual(addr1, addr2)
        
        // Should be valid addresses (20 bytes)
        XCTAssertEqual(addr1.rawBytes.count, 20)
        XCTAssertEqual(addr2.rawBytes.count, 20)
    }
    
    func testContractAddressGeneration() throws {
        let deployer: Address = "0x1234567890123456789012345678901234567890"
        let nonce: UInt64 = 42
        
        let contractAddr1 = Address.contractAddress(from: deployer, nonce: nonce)
        let contractAddr2 = Address.contractAddress(from: deployer, nonce: nonce)
        
        // Same deployer and nonce should generate same address
        XCTAssertEqual(contractAddr1, contractAddr2)
        
        // Different nonce should generate different address
        let contractAddr3 = Address.contractAddress(from: deployer, nonce: nonce + 1)
        XCTAssertNotEqual(contractAddr1, contractAddr3)
        
        // Different deployer should generate different address
        let deployer2: Address = "0x9876543210987654321098765432109876543210"
        let contractAddr4 = Address.contractAddress(from: deployer2, nonce: nonce)
        XCTAssertNotEqual(contractAddr1, contractAddr4)
    }
    
    func testCreate2AddressGeneration() throws {
        let deployer: Address = "0x1234567890123456789012345678901234567890"
        let salt = U256(0x123456)
        let initCodeHash = Bytes([0x12, 0x34, 0x56, 0x78])
        
        let addr1 = Address.create2Address(from: deployer, salt: salt, initCodeHash: initCodeHash)
        let addr2 = Address.create2Address(from: deployer, salt: salt, initCodeHash: initCodeHash)
        
        // Same inputs should produce same address
        XCTAssertEqual(addr1, addr2)
        
        // Different salt should produce different address
        let addr3 = Address.create2Address(from: deployer, salt: U256(0x654321), initCodeHash: initCodeHash)
        XCTAssertNotEqual(addr1, addr3)
    }
    
    // MARK: - U256 Arithmetic Tests
    
    func testSafeArithmetic() throws {
        let a = U256(100)
        let b = U256(50)
        
        // Safe addition
        let sum = try a.safeAdd(b)
        XCTAssertEqual(sum, U256(150))
        
        // Safe subtraction
        let diff = try a.safeSub(b)
        XCTAssertEqual(diff, U256(50))
        
        // Safe multiplication
        let product = try a.safeMul(b)
        XCTAssertEqual(product, U256(5000))
        
        // Safe division
        let quotient = try a.safeDiv(b)
        XCTAssertEqual(quotient, U256(2))
        
        // Safe modulo
        let remainder = try U256(103).safeMod(U256(50))
        XCTAssertEqual(remainder, U256(3))
    }
    
    func testSafeArithmeticOverflow() throws {
        let max = U256.max
        let one = U256(1)
        
        // Addition overflow should throw
        XCTAssertThrowsError(try max.safeAdd(one)) { error in
            XCTAssertTrue(error is PrimitivesError)
        }
        
        // Subtraction underflow should throw
        let zero = U256.zero
        XCTAssertThrowsError(try zero.safeSub(one)) { error in
            XCTAssertTrue(error is PrimitivesError)
        }
        
        // Division by zero should throw
        XCTAssertThrowsError(try one.safeDiv(zero)) { error in
            XCTAssertEqual(error as? PrimitivesError, .divisionByZero)
        }
    }
    
    func testBitwiseOperations() throws {
        let a = U256(0xFF00)  // 65280
        let b = U256(0x0F0F)  // 3855
        
        // AND operation
        let andResult = a.and(b)
        XCTAssertEqual(andResult, U256(0x0F00)) // 3840
        
        // OR operation  
        let orResult = a.or(b)
        XCTAssertEqual(orResult, U256(0xFF0F)) // 65295
        
        // XOR operation
        let xorResult = a.xor(b)
        XCTAssertEqual(xorResult, U256(0xF00F)) // 61455
        
        // NOT operation
        let notResult = U256(0).not()
        XCTAssertEqual(notResult, U256.max)
    }
    
    func testShiftOperations() throws {
        let value = U256(0x12)  // 18 in decimal
        
        // Left shift by 4 bits (multiply by 16)
        let leftShifted = value.shiftLeft(4)
        XCTAssertEqual(leftShifted, U256(0x120)) // 288
        
        // Right shift by 1 bit (divide by 2)
        let rightShifted = value.shiftRight(1)
        XCTAssertEqual(rightShifted, U256(0x9)) // 9
        
        // Shift by 256 or more should return zero
        let overShifted = value.shiftLeft(256)
        XCTAssertEqual(overShifted, U256.zero)
        
        let overShiftedRight = value.shiftRight(256)
        XCTAssertEqual(overShiftedRight, U256.zero)
    }
    
    func testEtherWeiConversions() throws {
        // Test ether conversion
        let oneEther = U256.ether(1.0)
        let expectedWei = U256(1_000_000_000_000_000_000) // 10^18
        XCTAssertEqual(oneEther, expectedWei)
        
        // Test gwei conversion
        let twentyGwei = U256.gwei(20)
        let expectedWeiFromGwei = U256(20_000_000_000) // 20 * 10^9
        XCTAssertEqual(twentyGwei, expectedWeiFromGwei)
        
        // Test wei conversion (should be identity)
        let directWei = U256.wei(12345)
        XCTAssertEqual(directWei, U256(12345))
    }
    
    func testU256Properties() throws {
        // Test zero check
        XCTAssertTrue(U256.zero.isZero)
        XCTAssertFalse(U256(1).isZero)
        
        // Test one check
        XCTAssertTrue(U256(1).isOne)
        XCTAssertFalse(U256(2).isOne)
        XCTAssertFalse(U256.zero.isOne)
    }
    
    // MARK: - Bytes Extension Tests
    
    func testBytesSlicing() throws {
        let bytes: Bytes = [0x12, 0x34, 0x56, 0x78, 0x9A]
        
        // Test normal slicing
        let slice = try bytes.slice(from: 1, length: 3)
        XCTAssertEqual(slice, Bytes([0x34, 0x56, 0x78]))
        
        // Test slice from beginning
        let beginSlice = try bytes.slice(from: 0, length: 2)
        XCTAssertEqual(beginSlice, Bytes([0x12, 0x34]))
        
        // Test slice to end
        let endSlice = try bytes.slice(from: 3, length: 2)
        XCTAssertEqual(endSlice, Bytes([0x78, 0x9A]))
        
        // Test invalid slice should throw
        XCTAssertThrowsError(try bytes.slice(from: 10, length: 1))
        XCTAssertThrowsError(try bytes.slice(from: 0, length: 10))
    }
    
    func testBytesPadding() throws {
        let bytes: Bytes = [0x12, 0x34]
        
        // Test right padding
        let rightPadded = bytes.padded(to: 5)
        XCTAssertEqual(rightPadded, Bytes([0x12, 0x34, 0x00, 0x00, 0x00]))
        
        // Test right padding with custom byte
        let customPadded = bytes.padded(to: 4, with: 0xFF)
        XCTAssertEqual(customPadded, Bytes([0x12, 0x34, 0xFF, 0xFF]))
        
        // Test left padding
        let leftPadded = bytes.leftPadded(to: 5)
        XCTAssertEqual(leftPadded, Bytes([0x00, 0x00, 0x00, 0x12, 0x34]))
        
        // Test left padding with custom byte
        let customLeftPadded = bytes.leftPadded(to: 4, with: 0xAA)
        XCTAssertEqual(customLeftPadded, Bytes([0xAA, 0xAA, 0x12, 0x34]))
        
        // Test padding when already at target length
        let noPadding = bytes.padded(to: 2)
        XCTAssertEqual(noPadding, bytes)
        
        // Test padding when longer than target
        let noChange = bytes.padded(to: 1)
        XCTAssertEqual(noChange, bytes)
    }
    
    func testBytesToU256Conversion() throws {
        // Test simple conversion
        let bytes: Bytes = [0x12, 0x34]
        let u256 = try bytes.toU256()
        
        // Should be interpreted as big-endian, so 0x1234 = 4660
        XCTAssertEqual(u256, U256(0x1234))
        
        // Test 32-byte conversion
        let thirtyTwoBytes = Bytes(Array(repeating: 0x00, count: 31) + [0xFF])
        let u256From32 = try thirtyTwoBytes.toU256()
        XCTAssertEqual(u256From32, U256(0xFF))
        
        // Test overflow should throw
        let tooManyBytes = Bytes(Array(repeating: 0xFF, count: 33))
        XCTAssertThrowsError(try tooManyBytes.toU256())
    }
    
    func testBytesToAddressConversion() throws {
        // Test valid 20-byte conversion
        let addressBytes = Bytes(Array(repeating: 0x12, count: 20))
        let address = try addressBytes.toAddress()
        XCTAssertEqual(address.rawBytes, Array(repeating: 0x12, count: 20))
        
        // Test invalid length should throw
        let shortBytes: Bytes = [0x12, 0x34]
        XCTAssertThrowsError(try shortBytes.toAddress())
        
        let longBytes = Bytes(Array(repeating: 0xFF, count: 25))
        XCTAssertThrowsError(try longBytes.toAddress())
        
        // Test address from hash (32 bytes -> last 20 bytes)
        let hashBytes = Bytes(Array(repeating: 0x00, count: 12) + Array(repeating: 0xFF, count: 20))
        let addressFromHash = try hashBytes.toAddressFromHash()
        XCTAssertEqual(addressFromHash.rawBytes, Array(repeating: 0xFF, count: 20))
    }
    
    func testBytesUtilities() throws {
        let bytes1: Bytes = [0x12, 0x34]
        let bytes2: Bytes = [0x56, 0x78]
        
        // Test concatenation
        let concatenated = bytes1.concatenated(with: bytes2)
        XCTAssertEqual(concatenated, Bytes([0x12, 0x34, 0x56, 0x78]))
        
        // Test prefix checking
        let longBytes: Bytes = [0x12, 0x34, 0x56, 0x78]
        XCTAssertTrue(longBytes.hasPrefix(bytes1))
        XCTAssertFalse(longBytes.hasPrefix(bytes2))
        
        // Test suffix checking
        XCTAssertTrue(longBytes.hasSuffix(bytes2))
        XCTAssertFalse(longBytes.hasSuffix(bytes1))
        
        // Test reversal
        let reversed = bytes1.reversed()
        XCTAssertEqual(reversed, Bytes([0x34, 0x12]))
    }
    
    func testBytesIntegerConversions() throws {
        // Test UInt64 conversion
        let uint64Bytes = Bytes.from(uint64: 0x123456789ABCDEF0)
        let convertedBack = try uint64Bytes.toUInt64()
        XCTAssertEqual(convertedBack, 0x123456789ABCDEF0)
        
        // Test UInt32 conversion
        let uint32Bytes = Bytes.from(uint32: 0x12345678)
        let convertedBack32 = try uint32Bytes.toUInt32()
        XCTAssertEqual(convertedBack32, 0x12345678)
        
        // Test overflow for integer conversion
        let tooManyBytesFor64 = Bytes(Array(repeating: 0xFF, count: 9))
        XCTAssertThrowsError(try tooManyBytesFor64.toUInt64())
        
        let tooManyBytesFor32 = Bytes(Array(repeating: 0xFF, count: 5))
        XCTAssertThrowsError(try tooManyBytesFor32.toUInt32())
    }
    
    func testRandomBytesGeneration() throws {
        let random1 = Bytes.random(length: 32)
        let random2 = Bytes.random(length: 32)
        
        // Should generate different random bytes
        XCTAssertNotEqual(random1, random2)
        
        // Should have correct length
        XCTAssertEqual(random1.count, 32)
        XCTAssertEqual(random2.count, 32)
        
        // Test empty random bytes
        let empty = Bytes.random(length: 0)
        XCTAssertEqual(empty.count, 0)
        XCTAssertTrue(empty.isEmpty)
    }
    
    func testKeccak256Hash() throws {
        // Test that hash function works (even if simplified)
        let input: Bytes = [0x12, 0x34, 0x56, 0x78]
        let hash1 = input.keccak256
        let hash2 = input.keccak256
        
        // Same input should produce same hash
        XCTAssertEqual(hash1, hash2)
        
        // Hash should be 32 bytes
        XCTAssertEqual(hash1.count, 32)
        
        // Different input should produce different hash
        let differentInput: Bytes = [0x87, 0x65, 0x43, 0x21]
        let differentHash = differentInput.keccak256
        XCTAssertNotEqual(hash1, differentHash)
    }
    
    // MARK: - Error Handling Tests
    
    func testPrimitivesErrorDescriptions() throws {
        let lengthError = PrimitivesError.invalidLength(expected: 20, actual: 10)
        XCTAssertTrue(lengthError.localizedDescription.contains("Invalid length"))
        
        let hexLengthError = PrimitivesError.invalidHexLength(expected: 40, actual: 38)
        XCTAssertTrue(hexLengthError.localizedDescription.contains("Invalid hex length"))
        
        let hexStringError = PrimitivesError.invalidHexString("invalid")
        XCTAssertTrue(hexStringError.localizedDescription.contains("Invalid hex string"))
        
        let overflowError = PrimitivesError.overflow
        XCTAssertTrue(overflowError.localizedDescription.contains("overflow"))
        
        let underflowError = PrimitivesError.underflow
        XCTAssertTrue(underflowError.localizedDescription.contains("underflow"))
        
        let divisionError = PrimitivesError.divisionByZero
        XCTAssertTrue(divisionError.localizedDescription.contains("Division by zero"))
    }
    
    // MARK: - Performance Tests
    
    func testArithmeticPerformance() throws {
        let a = U256(123456789)
        let b = U256(987654321)
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Perform 1000 arithmetic operations
        for _ in 0..<1000 {
            _ = try a.safeAdd(b)
            _ = try a.safeMul(b)
            _ = a.and(b)
            _ = a.or(b)
        }
        
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        print("Performed 4000 U256 operations in \(timeElapsed) seconds")
        
        // Should complete quickly
        XCTAssertLessThan(timeElapsed, 1.0, "U256 arithmetic performance regression")
    }
    
    func testBytesPerformance() throws {
        let bytes = Bytes.random(length: 1024)
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Perform 1000 bytes operations
        for _ in 0..<1000 {
            _ = bytes.keccak256
            _ = bytes.padded(to: 2048)
            _ = bytes.reversed()
            _ = bytes.hasPrefix(Bytes([0x00]))
        }
        
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        print("Performed 4000 Bytes operations in \(timeElapsed) seconds")
        
        // Should complete quickly
        XCTAssertLessThan(timeElapsed, 1.0, "Bytes operations performance regression")
    }
}