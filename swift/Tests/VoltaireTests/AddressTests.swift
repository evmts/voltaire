import XCTest
@testable import Voltaire

final class AddressTests: XCTestCase {
    func testZeroAddress() {
        let zero = Address.zero
        XCTAssertTrue(zero.isZero)
        XCTAssertEqual(zero.hex, "0x0000000000000000000000000000000000000000")
    }

    func testFromHex() throws {
        let addr = try Address(hex: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        XCTAssertFalse(addr.isZero)
        XCTAssertEqual(addr.hex, "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    }

    func testFromHexWithoutPrefix() throws {
        let addr = try Address(hex: "d8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        XCTAssertEqual(addr.hex, "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    }

    func testInvalidHex() {
        XCTAssertThrowsError(try Address(hex: "0xinvalid")) { error in
            XCTAssertTrue(error is VoltaireError)
        }
    }

    func testInvalidLength() {
        XCTAssertThrowsError(try Address(hex: "0x1234")) { error in
            // Real impl returns invalidHex for wrong-length hex
            XCTAssertTrue(error is VoltaireError)
        }
    }

    func testEquality() throws {
        let a = try Address(hex: "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
        let b = try Address(hex: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        XCTAssertEqual(a, b)
    }

    func testFromBytes() throws {
        let bytes: [UInt8] = [
            0xd8, 0xda, 0x6b, 0xf2, 0x69, 0x64, 0xaf, 0x9d, 0x7e, 0xed,
            0x9e, 0x03, 0xe5, 0x34, 0x15, 0xd3, 0x7a, 0xa9, 0x60, 0x45
        ]
        let addr = try Address(bytes: bytes)
        XCTAssertEqual(addr.hex, "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
    }

    func testToBytes() throws {
        let addr = try Address(hex: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        let bytes = addr.bytes
        XCTAssertEqual(bytes.count, 20)
        XCTAssertEqual(bytes[0], 0xd8)
        XCTAssertEqual(bytes[19], 0x45)
    }

    func testChecksumHex() throws {
        let addr = try Address(hex: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        // Real implementation provides proper EIP-55 checksum
        XCTAssertEqual(addr.checksumHex, "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
    }

    func testChecksumValidation() {
        XCTAssertTrue(Address.isValidChecksum("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"))
        XCTAssertFalse(Address.isValidChecksum("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"))
    }
}
