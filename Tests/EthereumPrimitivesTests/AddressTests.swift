import XCTest
@testable import EthereumPrimitives

final class AddressTests: XCTestCase {

    func testZeroAddress() {
        let zero = Address.zero
        XCTAssertTrue(zero.isZero())
        XCTAssertEqual(zero.toHex(), "0x0000000000000000000000000000000000000000")
    }

    func testAddressFromHex() throws {
        let hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        let address = try Address(hex: hex)

        XCTAssertEqual(address.bytes.count, 20)
        XCTAssertFalse(address.isZero())
    }

    func testInvalidHexLength() {
        // Too short
        XCTAssertThrowsError(try Address(hex: "0x123")) { error in
            XCTAssertTrue(error is AddressError)
        }

        // Too long
        XCTAssertThrowsError(try Address(hex: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb123")) { error in
            XCTAssertTrue(error is AddressError)
        }
    }

    func testAddressEquality() throws {
        let addr1 = try Address(hex: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
        let addr2 = try Address(hex: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
        let addr3 = try Address(hex: "0x0000000000000000000000000000000000000001")

        XCTAssertEqual(addr1, addr2)
        XCTAssertNotEqual(addr1, addr3)
    }

    func testAddressStringLiteral() {
        let address: Address = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
        XCTAssertFalse(address.isZero())
    }

    func testAddressCodable() throws {
        let address = try Address(hex: "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")

        let encoder = JSONEncoder()
        let data = try encoder.encode(address)

        let decoder = JSONDecoder()
        let decoded = try decoder.decode(Address.self, from: data)

        XCTAssertEqual(address, decoded)
    }
}
