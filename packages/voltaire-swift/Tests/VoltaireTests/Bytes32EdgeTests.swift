import XCTest
@testable import Voltaire

final class Bytes32EdgeTests: XCTestCase {
    func testInvalidBytesLength() {
        XCTAssertThrowsError(try Bytes32(bytes: []))
        XCTAssertThrowsError(try Bytes32(bytes: Array(repeating: 0, count: 31)))
        XCTAssertThrowsError(try Bytes32(bytes: Array(repeating: 0, count: 33)))
    }

    func testInvalidHex() {
        XCTAssertThrowsError(try Bytes32(hex: "0xxyz"))
        XCTAssertThrowsError(try Bytes32(hex: "0x" + String(repeating: "0", count: 63))) // odd length
    }
}

