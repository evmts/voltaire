import XCTest
@testable import GuillotinePrimitives

final class AddressTests: XCTestCase {
    
    func testZeroAddress() {
        let address = Address.zero
        XCTAssertEqual(address.hexString, "0x0000000000000000000000000000000000000000")
        XCTAssertEqual(address.rawBytes, Array(repeating: 0, count: 20))
    }
    
    func testAddressFromHex() throws {
        let hexString = "0x1234567890123456789012345678901234567890"
        let address = try Address(hex: hexString)
        XCTAssertEqual(address.hexString, hexString)
    }
    
    func testAddressFromHexWithoutPrefix() throws {
        let hexString = "1234567890123456789012345678901234567890"
        let address = try Address(hex: hexString)
        XCTAssertEqual(address.hexString, "0x" + hexString)
    }
    
    func testAddressFromBytes() throws {
        let bytes: [UInt8] = [0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90,
                              0x12, 0x34, 0x56, 0x78, 0x90, 0x12, 0x34, 0x56, 0x78, 0x90]
        let address = try Address(bytes)
        XCTAssertEqual(address.rawBytes, bytes)
        XCTAssertEqual(address.hexString, "0x1234567890123456789012345678901234567890")
    }
    
    func testInvalidLength() {
        XCTAssertThrowsError(try Address([0x12, 0x34])) { error in
            guard case PrimitivesError.invalidLength(let expected, let actual) = error else {
                XCTFail("Expected invalidLength error")
                return
            }
            XCTAssertEqual(expected, 20)
            XCTAssertEqual(actual, 2)
        }
    }
    
    func testInvalidHexLength() {
        XCTAssertThrowsError(try Address(hex: "0x1234")) { error in
            guard case PrimitivesError.invalidHexLength(let expected, let actual) = error else {
                XCTFail("Expected invalidHexLength error")
                return
            }
            XCTAssertEqual(expected, 40)
            XCTAssertEqual(actual, 4)
        }
    }
    
    func testInvalidHexString() {
        XCTAssertThrowsError(try Address(hex: "0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG")) { error in
            guard case PrimitivesError.invalidHexString = error else {
                XCTFail("Expected invalidHexString error")
                return
            }
        }
    }
    
    func testEquality() throws {
        let address1 = try Address(hex: "0x1234567890123456789012345678901234567890")
        let address2 = try Address(hex: "0x1234567890123456789012345678901234567890")
        let address3 = try Address(hex: "0x0000000000000000000000000000000000000000")
        
        XCTAssertEqual(address1, address2)
        XCTAssertNotEqual(address1, address3)
    }
    
    func testStringLiteral() {
        let address: Address = "0x1234567890123456789012345678901234567890"
        XCTAssertEqual(address.hexString, "0x1234567890123456789012345678901234567890")
    }
    
    func testCodable() throws {
        let address = try Address(hex: "0x1234567890123456789012345678901234567890")
        
        let encoder = JSONEncoder()
        let data = try encoder.encode(address)
        
        let decoder = JSONDecoder()
        let decoded = try decoder.decode(Address.self, from: data)
        
        XCTAssertEqual(address, decoded)
    }
}