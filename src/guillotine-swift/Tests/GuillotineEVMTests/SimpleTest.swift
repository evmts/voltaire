import XCTest
@testable import GuillotinePrimitives

final class SimpleTest: XCTestCase {
    
    func testBasicFunctionality() {
        // Test basic primitives functionality
        let address = Address.zero
        XCTAssertEqual(address.hexString, "0x0000000000000000000000000000000000000000")
        
        let u256 = U256.zero
        XCTAssertEqual(u256.uint64Value, 0)
        
        let hash = Hash.zero
        XCTAssertEqual(hash.hexString, "0x0000000000000000000000000000000000000000000000000000000000000000")
        
        let bytes = Bytes.empty
        XCTAssertTrue(bytes.isEmpty)
    }
}