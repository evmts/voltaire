import XCTest
@testable import Voltaire

final class SignatureValidationTests: XCTestCase {
    func testSignatureIsValidRanges() throws {
        let r = [UInt8](repeating: 0, count: 31) + [0x01]
        let s = [UInt8](repeating: 0, count: 31) + [0x02]
        let sig = try Signature(r: r, s: s, v: 0)
        XCTAssertTrue(sig.isValid)
        XCTAssertTrue(sig.isCanonical) // tiny s should be low-s
    }

    func testSignatureInvalidRanges() throws {
        let r = [UInt8](repeating: 0xFF, count: 32) // likely >= N
        let s = [UInt8](repeating: 0xFF, count: 32)
        let sig = try Signature(r: r, s: s, v: 0)
        XCTAssertFalse(sig.isValid)

        // Zero s should be invalid
        let zr = [UInt8](repeating: 0, count: 31) + [0x01]
        let zs = [UInt8](repeating: 0, count: 32)
        let sig2 = try Signature(r: zr, s: zs, v: 0)
        XCTAssertFalse(sig2.isValid)
    }
}

