import XCTest
@testable import Voltaire

final class U256EdgeTests: XCTestCase {
    func testInvalidBytesLength() {
        XCTAssertThrowsError(try U256(bytes: []))
        XCTAssertThrowsError(try U256(bytes: Array(repeating: 0, count: 31)))
        XCTAssertThrowsError(try U256(bytes: Array(repeating: 0, count: 33)))
    }

    func testInvalidHex() {
        XCTAssertThrowsError(try U256(hex: "0xzz"))
        XCTAssertThrowsError(try U256(hex: "0xgg"))
    }
}
