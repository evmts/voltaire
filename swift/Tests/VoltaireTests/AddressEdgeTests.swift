import XCTest
@testable import Voltaire

final class AddressEdgeTests: XCTestCase {
    func testInvalidBytesLength() {
        XCTAssertThrowsError(try Address(bytes: []))
        XCTAssertThrowsError(try Address(bytes: Array(repeating: 0, count: 19)))
        XCTAssertThrowsError(try Address(bytes: Array(repeating: 0, count: 21)))
    }

    func testHashableAndDescription() throws {
        let a = try Address(hex: "0xd8da6bf26964af9d7eed9e03e53415d37aa96045")
        let b = try Address(hex: "0xd8D A6BF26964AF9D7EED9E03E53415D37AA96045".replacingOccurrences(of: " ", with: ""))

        // Hashable/Equatable semantics through Set
        var set = Set<Address>()
        set.insert(a)
        XCTAssertTrue(set.contains(b))

        // Description should be EIP-55 checksummed format
        XCTAssertEqual(String(describing: a), "0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045")
    }

    func testChecksumValidationBoundaries() {
        // Valid checksum
        XCTAssertTrue(Address.isValidChecksum("0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045"))
        // Same value but all lowercase is not checksummed
        XCTAssertFalse(Address.isValidChecksum("0xd8da6bf26964af9d7eed9e03e53415d37aa96045"))
        // Wrong length / bad chars
        XCTAssertFalse(Address.isValidChecksum("0x1234"))
        XCTAssertFalse(Address.isValidChecksum("0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ"))
    }
}

