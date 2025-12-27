import XCTest
@testable import Voltaire

final class KeyTests: XCTestCase {
    func testGenerateAndDerivePublicKey() throws {
        let pk = try PrivateKey.generate()
        let pub = try pk.publicKey()
        XCTAssertEqual(pub.uncompressed.count, 64)
        let compressed = try pub.compressed()
        XCTAssertEqual(compressed.count, 33)
        XCTAssertTrue(compressed[0] == 0x02 || compressed[0] == 0x03)
    }

    func testAddressFromPublicKey() throws {
        // Use private key 1 (valid). Deterministic but we don't assert exact value.
        var priv = [UInt8](repeating: 0, count: 32)
        priv[31] = 0x01
        let pk = try PrivateKey(bytes: priv)
        let pub = try pk.publicKey()
        let addr = try pub.address()
        XCTAssertEqual(addr.bytes.count, 20)
        XCTAssertFalse(addr.isZero)
    }
}

