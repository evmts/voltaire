import XCTest
@testable import Voltaire

final class HexTests: XCTestCase {
    func testEncode() {
        let bytes: [UInt8] = [0xde, 0xad, 0xbe, 0xef]
        XCTAssertEqual(Hex.encode(bytes), "0xdeadbeef")
    }

    func testEncodeEmpty() {
        XCTAssertEqual(Hex.encode([]), "0x")
    }

    func testDecode() throws {
        let bytes = try Hex.decode("0xdeadbeef")
        XCTAssertEqual(bytes, [0xde, 0xad, 0xbe, 0xef])
    }

    func testDecodeWithoutPrefix() throws {
        // Note: The Zig implementation requires 0x prefix
        // Raw hex without prefix will throw
        XCTAssertThrowsError(try Hex.decode("deadbeef")) { error in
            XCTAssertTrue(error is VoltaireError)
        }
    }

    func testDecodeEmpty() throws {
        let bytes = try Hex.decode("0x")
        XCTAssertEqual(bytes, [])
    }

    func testDecodeInvalid() {
        XCTAssertThrowsError(try Hex.decode("0xgg")) { error in
            XCTAssertTrue(error is VoltaireError)
        }
    }

    func testRoundTrip() throws {
        let original: [UInt8] = [0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef]
        let hex = Hex.encode(original)
        let decoded = try Hex.decode(hex)
        XCTAssertEqual(decoded, original)
    }

    func testEncodeData() {
        let data = Data([0xca, 0xfe])
        XCTAssertEqual(Hex.encode(data), "0xcafe")
    }
}
