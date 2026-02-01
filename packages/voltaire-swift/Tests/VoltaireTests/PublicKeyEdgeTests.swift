import XCTest
@testable import Voltaire

final class PublicKeyEdgeTests: XCTestCase {
    func testInvalidUncompressedLength() {
        XCTAssertThrowsError(try PublicKey(uncompressed: []))
        XCTAssertThrowsError(try PublicKey(uncompressed: Array(repeating: 0, count: 63)))
        XCTAssertThrowsError(try PublicKey(uncompressed: Array(repeating: 0, count: 65)))
    }
}

