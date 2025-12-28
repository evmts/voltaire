import XCTest
@testable import Voltaire

final class SignatureEdgeTests: XCTestCase {
    func testParseAndSerializeWithV() throws {
        var r = [UInt8](repeating: 0, count: 32); r[31] = 0x01
        var s = [UInt8](repeating: 0, count: 32); s[31] = 0x02
        let v: UInt8 = 27
        let sig65 = r + s + [v]

        let sig = try Signature(compact: sig65)
        XCTAssertEqual(sig.r, r)
        XCTAssertEqual(sig.s, s)
        XCTAssertEqual(sig.v, v)

        let ser = sig.serialize(includeV: true)
        XCTAssertEqual(ser.count, 65)
        XCTAssertEqual(ser[64], v)
    }

    func testInvalidCompactLengths() {
        XCTAssertThrowsError(try Signature(compact: []))
        XCTAssertThrowsError(try Signature(compact: [0x00]))
        XCTAssertThrowsError(try Signature(compact: Array(repeating: 0, count: 63)))
        XCTAssertThrowsError(try Signature(compact: Array(repeating: 0, count: 66)))
    }

    func testRecoverWithInvalidSignatureFails() throws {
        // Zero signature should fail to recover
        let hash = try Hash(hex: "0x" + String(repeating: "00", count: 32))
        let r = [UInt8](repeating: 0, count: 32)
        let s = [UInt8](repeating: 0, count: 32)
        let sig = try Signature(r: r, s: s, v: 0)

        XCTAssertThrowsError(try sig.recoverPublicKey(messageHash: hash))
        XCTAssertThrowsError(try sig.recoverAddress(messageHash: hash))
    }
}
