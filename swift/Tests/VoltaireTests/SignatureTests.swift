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

    func testSerializeIncludeVRoundTrip() throws {
        var r = [UInt8](repeating: 0x00, count: 32); r[31] = 0x0a
        var s = [UInt8](repeating: 0x00, count: 32); s[31] = 0x0b
        // Construct with components
        let sig = try Signature(r: r, s: s, v: 27)
        let withV = sig.serialize(includeV: true)
        XCTAssertEqual(withV.count, 65)

        // Parse back
        let parsed = try Signature(compact: withV)
        XCTAssertEqual(parsed.r, r)
        XCTAssertEqual(parsed.s, s)
        XCTAssertEqual(parsed.v, 27)
    }

    func testRecoverPublicKeyInvalidSignature() throws {
        // Zero signature should fail to recover
        let zero = [UInt8](repeating: 0, count: 32)
        let sig = try Signature(r: zero, s: zero, v: 0)
        // Build a zero hash via API to avoid string tricks
        let zeroHash = Hash.zero
        XCTAssertThrowsError(try sig.recoverPublicKey(messageHash: zeroHash))
        XCTAssertThrowsError(try sig.recoverAddress(messageHash: zeroHash))
    }
}
