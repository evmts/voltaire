import XCTest
@testable import EthereumPrimitives

final class HexTests: XCTestCase {

    func testHexToBytes() throws {
        // Test with 0x prefix
        let bytes1 = try Hex.toBytes("0xabcd")
        XCTAssertEqual(bytes1.count, 2)
        XCTAssertEqual(bytes1[0], 0xab)
        XCTAssertEqual(bytes1[1], 0xcd)

        // Test without 0x prefix
        let bytes2 = try Hex.toBytes("1234")
        XCTAssertEqual(bytes2.count, 2)
        XCTAssertEqual(bytes2[0], 0x12)
        XCTAssertEqual(bytes2[1], 0x34)

        // Test empty
        let bytes3 = try Hex.toBytes("0x")
        XCTAssertEqual(bytes3.count, 0)
    }

    func testBytesToHex() {
        let data = Data([0xab, 0xcd, 0xef])
        let hex = Hex.fromBytes(data)
        XCTAssertEqual(hex, "0xabcdef")

        // Empty data
        let empty = Hex.fromBytes(Data())
        XCTAssertEqual(empty, "0x")
    }

    func testHexValidation() {
        XCTAssertTrue(Hex.isValid("0xabcdef"))
        XCTAssertTrue(Hex.isValid("abcdef"))
        XCTAssertTrue(Hex.isValid("0x"))

        XCTAssertFalse(Hex.isValid("0xzz"))
        XCTAssertFalse(Hex.isValid("xyz"))
    }

    func testOddLengthHex() {
        XCTAssertThrowsError(try Hex.toBytes("0xabc")) { error in
            XCTAssertTrue(error is HexError)
        }
    }

    func testPadLeft() {
        let hex = "0x123"
        let padded = Hex.padLeft(hex, toLength: 4)
        XCTAssertEqual(padded, "0x00000123")
    }

    func testTrimLeadingZeros() {
        let hex = "0x00001234"
        let trimmed = Hex.trimLeadingZeros(hex)
        XCTAssertEqual(trimmed, "0x1234")

        // All zeros
        let allZeros = Hex.trimLeadingZeros("0x0000")
        XCTAssertEqual(allZeros, "0x0")
    }

    func testDataExtension() throws {
        let data = Data([0x12, 0x34])
        XCTAssertEqual(data.hexString, "0x1234")

        let fromHex = try Data(hex: "0xabcd")
        XCTAssertEqual(fromHex, Data([0xab, 0xcd]))
    }
}
