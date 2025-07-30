import XCTest
@testable import GuillotineEVM
@testable import GuillotinePrimitives

@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
final class EVMTests: XCTestCase {
    
    func testEVMInitialization() async throws {
        let evm = try EVM()
        XCTAssertTrue(EVM.isInitialized)
        XCTAssertFalse(EVM.version.isEmpty)
    }
    
    func testSimpleExecution() async throws {
        let evm = try EVM()
        
        // Simple PUSH1 0x42 bytecode
        let bytecode = Bytes([0x60, 0x42])
        
        let result = try await evm.execute(bytecode: bytecode)
        XCTAssertTrue(result.isSuccess)
        XCTAssertEqual(result.gasUsed, 0) // Simple operation with no actual execution cost in this test
    }
    
    func testSetBalance() async throws {
        let evm = try EVM()
        let address: Address = "0x1234567890123456789012345678901234567890"
        let balance = U256(1000)
        
        try evm.setBalance(address, balance: balance)
        // If no exception is thrown, the operation succeeded
    }
    
    func testSetCode() async throws {
        let evm = try EVM()
        let address: Address = "0x1234567890123456789012345678901234567890"
        let code = Bytes([0x60, 0x01]) // PUSH1 1
        
        try evm.setCode(address, code: code)
        // If no exception is thrown, the operation succeeded
    }
    
    func testExecutionWithParameters() async throws {
        let evm = try EVM()
        
        let bytecode = Bytes([0x60, 0x42]) // PUSH1 0x42
        let caller: Address = "0x1000000000000000000000000000000000000000"
        let to: Address = "0x2000000000000000000000000000000000000000"
        let value = U256(100)
        let input = Bytes([0x01, 0x02, 0x03])
        let gasLimit: UInt64 = 100000
        
        let result = try await evm.execute(
            bytecode: bytecode,
            caller: caller,
            to: to,
            value: value,
            input: input,
            gasLimit: gasLimit
        )
        
        XCTAssertTrue(result.isSuccess)
    }
    
    func testExecutionResult() async throws {
        let evm = try EVM()
        let bytecode = Bytes([0x60, 0x42]) // PUSH1 0x42
        
        let result = try await evm.execute(bytecode: bytecode)
        
        XCTAssertTrue(result.isSuccess)
        XCTAssertFalse(result.isRevert)
        XCTAssertNil(result.errorMessage)
        XCTAssertGreaterThanOrEqual(result.gasUsed, 0)
    }
    
    func testVersion() {
        let version = EVM.version
        XCTAssertEqual(version, "1.0.0")
    }
}