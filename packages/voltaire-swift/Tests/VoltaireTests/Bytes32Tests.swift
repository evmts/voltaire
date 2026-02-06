import XCTest
@testable import Voltaire

final class Bytes32Tests: XCTestCase {
    func testFromHex() throws {
        let b = try Bytes32(hex: "0x" + String(repeating: "00", count: 32))
        XCTAssertEqual(b.bytes.count, 32)
        XCTAssertEqual(b.hex, "0x" + String(repeating: "00", count: 32 * 1))
    }

    func testEquality() throws {
        let a = try Bytes32(hex: "0x" + String(repeating: "11", count: 32))
        let b = try Bytes32(hex: "0x" + String(repeating: "11", count: 32))
        XCTAssertEqual(a, b)
    }
}

