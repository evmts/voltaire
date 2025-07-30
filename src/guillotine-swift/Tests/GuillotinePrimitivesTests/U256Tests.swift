import XCTest
@testable import GuillotinePrimitives

final class U256Tests: XCTestCase {
    
    func testZero() {
        let u256 = U256.zero
        XCTAssertEqual(u256.uint64Value, 0)
        XCTAssertEqual(u256.hexString, "0x0000000000000000000000000000000000000000000000000000000000000000")
    }
    
    func testMax() {
        let u256 = U256.max
        XCTAssertNil(u256.uint64Value)
        XCTAssertEqual(u256.hexString, "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff")
    }
    
    func testFromUInt64() {
        let u256 = U256(12345)
        XCTAssertEqual(u256.uint64Value, 12345)
        XCTAssertEqual(u256.hexString, "0x0000000000000000000000000000000000000000000000000000000000003039")
    }
    
    func testFromHex() throws {
        let u256 = try U256(hex: "0x1234567890abcdef")
        XCTAssertEqual(u256.uint64Value, 0x1234567890abcdef)
        XCTAssertEqual(u256.hexString, "0x0000000000000000000000000000000000000000000000001234567890abcdef")
    }
    
    func testFromHexWithoutPrefix() throws {
        let u256 = try U256(hex: "1234567890abcdef")
        XCTAssertEqual(u256.uint64Value, 0x1234567890abcdef)
    }
    
    func testFromBytes() throws {
        var bytes = Array(repeating: UInt8(0), count: 32)
        bytes[0] = 0x39  // Little-endian: 0x3039 = 12345
        bytes[1] = 0x30
        
        let u256 = try U256(bytes: bytes)
        XCTAssertEqual(u256.uint64Value, 12345)
    }
    
    func testInvalidLength() {
        XCTAssertThrowsError(try U256(bytes: [0x12, 0x34])) { error in
            guard case PrimitivesError.invalidLength(let expected, let actual) = error else {
                XCTFail("Expected invalidLength error")
                return
            }
            XCTAssertEqual(expected, 32)
            XCTAssertEqual(actual, 2)
        }
    }
    
    func testInvalidHexLength() {
        let longHex = String(repeating: "a", count: 66) // 66 chars > 64 max
        XCTAssertThrowsError(try U256(hex: longHex)) { error in
            guard case PrimitivesError.invalidHexLength(let expected, let actual) = error else {
                XCTFail("Expected invalidHexLength error")
                return
            }
            XCTAssertEqual(expected, 64)
            XCTAssertEqual(actual, 66)
        }
    }
    
    func testAddition() throws {
        let a = U256(100)
        let b = U256(200)
        let result = try a.adding(b)
        XCTAssertEqual(result.uint64Value, 300)
    }
    
    func testAdditionOverflow() {
        let a = U256.max
        let b = U256(1)
        XCTAssertThrowsError(try a.adding(b)) { error in
            guard case PrimitivesError.overflow = error else {
                XCTFail("Expected overflow error")
                return
            }
        }
    }
    
    func testSubtraction() throws {
        let a = U256(300)
        let b = U256(100)
        let result = try a.subtracting(b)
        XCTAssertEqual(result.uint64Value, 200)
    }
    
    func testSubtractionUnderflow() {
        let a = U256(100)
        let b = U256(200)
        XCTAssertThrowsError(try a.subtracting(b)) { error in
            guard case PrimitivesError.underflow = error else {
                XCTFail("Expected underflow error")
                return
            }
        }
    }
    
    func testComparison() {
        let a = U256(100)
        let b = U256(200)
        let c = U256(100)
        
        XCTAssertTrue(a < b)
        XCTAssertFalse(b < a)
        XCTAssertFalse(a < c)
        XCTAssertEqual(a, c)
        XCTAssertNotEqual(a, b)
    }
    
    func testIntegerLiteral() {
        let u256: U256 = 12345
        XCTAssertEqual(u256.uint64Value, 12345)
    }
    
    func testCodable() throws {
        let u256 = U256(12345)
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(u256)
        
        let decoder = JSONDecoder()
        let decoded = try decoder.decode(U256.self, from: data)
        
        XCTAssertEqual(u256, decoded)
    }
}