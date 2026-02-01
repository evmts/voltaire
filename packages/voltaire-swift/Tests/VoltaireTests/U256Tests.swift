import XCTest
@testable import Voltaire

final class U256Tests: XCTestCase {
    func testFromHex() throws {
        let v = try U256(hex: "0x01")
        XCTAssertEqual(v.hex, "0x0000000000000000000000000000000000000000000000000000000000000001")
    }

    func testBytesRoundTrip() throws {
        let bytes = [UInt8](repeating: 0xaa, count: 32)
        let v = try U256(bytes: bytes)
        XCTAssertEqual(v.bytes, bytes)
        XCTAssertEqual(v.hex, "0x" + String(repeating: "aa", count: 32))
    }
}
