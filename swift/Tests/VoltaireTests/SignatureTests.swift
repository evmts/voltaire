import XCTest
@testable import Voltaire

final class SignatureTests: XCTestCase {
    func testParseAndSerializeCompact() throws {
        // Construct a compact signature (no v)
        var r = [UInt8](repeating: 0x00, count: 32); r[31] = 0x01
        var s = [UInt8](repeating: 0x00, count: 32); s[31] = 0x02
        let compact = r + s

        let sig = try Signature(compact: compact)
        XCTAssertEqual(sig.r, r)
        XCTAssertEqual(sig.s, s)
        XCTAssertEqual(sig.v, 0)

        let ser = sig.serialize(includeV: false)
        XCTAssertEqual(ser, compact)
    }

    func testCanonicalCheckAndNormalize() throws {
        var r = [UInt8](repeating: 0x00, count: 32); r[31] = 0x01
        var s = [UInt8](repeating: 0x00, count: 32); s[31] = 0x02
        let sig = try Signature(compact: r + s)
        let normalized = sig.normalized()
        XCTAssertEqual(normalized.serialize(includeV: false).count, 64)
    }
}
