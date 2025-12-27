import XCTest
@testable import Voltaire

final class Keccak256Tests: XCTestCase {
    func testEmptyHash() {
        let hash = Keccak256.hash("")
        XCTAssertEqual(
            hash.hex,
            "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        )
    }

    func testHelloWorld() {
        let hash = Keccak256.hash("hello world")
        XCTAssertEqual(
            hash.hex,
            "0x47173285a8d7341e5e972fc677286384f802f8ef42a5ec5f03bbfa254cb01fad"
        )
    }

    func testBytes() {
        let hash = Keccak256.hash([0x68, 0x65, 0x6c, 0x6c, 0x6f]) // "hello"
        XCTAssertEqual(
            hash.hex,
            "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
        )
    }

    func testHashFromHex() throws {
        let hash = try Hash(hex: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
        XCTAssertEqual(hash.bytes.count, 32)
        XCTAssertEqual(hash.bytes[0], 0xc5)
    }

    func testHashEquality() throws {
        let a = try Hash(hex: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
        let b = try Hash(hex: "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470")
        XCTAssertEqual(a, b)
    }

    func testZeroHash() {
        let zero = Hash.zero
        XCTAssertEqual(zero.hex, "0x0000000000000000000000000000000000000000000000000000000000000000")
    }

    func testData() {
        let data = Data([0x68, 0x65, 0x6c, 0x6c, 0x6f])
        let hash = Keccak256.hash(data)
        XCTAssertEqual(
            hash.hex,
            "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
        )
    }
}
