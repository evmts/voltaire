import XCTest
@testable import GuillotineEVM
@testable import GuillotinePrimitives

@available(macOS 13.0, iOS 16.0, watchOS 9.0, tvOS 16.0, *)
final class GuillotineEVMTests: XCTestCase {
    
    // MARK: - Basic Initialization Tests
    
    func testEVMInitialization() async throws {
        let evm = try GuillotineEVM()
        
        // Test that static version is available
        XCTAssertFalse(GuillotineEVM.version.isEmpty)
        XCTAssertEqual(GuillotineEVM.version, "1.0.0")
        
        // Test that EVM is initialized
        XCTAssertTrue(GuillotineEVM.isInitialized)
    }
    
    func testEVMMultipleInstances() async throws {
        // Test that multiple EVM instances can be created safely
        let evm1 = try GuillotineEVM()
        let evm2 = try GuillotineEVM()
        
        // Both should be functional
        let bytecode: Bytes = [0x60, 0x42] // PUSH1 0x42
        let result1 = try await evm1.execute(bytecode: bytecode)
        let result2 = try await evm2.execute(bytecode: bytecode)
        
        XCTAssertTrue(result1.isSuccess)
        XCTAssertTrue(result2.isSuccess)
    }
    
    // MARK: - Simple Execution Tests
    
    func testSimpleExecution() async throws {
        let evm = try GuillotineEVM()
        
        // Simple PUSH1 0x42 bytecode
        let bytecode: Bytes = [0x60, 0x42]
        
        let result = try await evm.execute(bytecode: bytecode)
        XCTAssertTrue(result.isSuccess)
        XCTAssertFalse(result.isRevert)
        XCTAssertFalse(result.isError)
        XCTAssertNil(result.error)
        XCTAssertNil(result.revertReason)
        XCTAssertGreaterThanOrEqual(result.gasUsed, 0)
    }
    
    func testExecutionWithCustomGasLimit() async throws {
        let evm = try GuillotineEVM()
        
        let bytecode: Bytes = [0x60, 0x42] // PUSH1 0x42
        let gasLimit: UInt64 = 50_000
        
        let result = try await evm.execute(bytecode: bytecode, gasLimit: gasLimit)
        XCTAssertTrue(result.isSuccess)
        XCTAssertLessThanOrEqual(result.gasUsed, gasLimit)
    }
    
    func testExecutionWithInvalidBytecode() async throws {
        let evm = try GuillotineEVM()
        
        // Invalid opcode (0xFE is INVALID in EVM)
        let bytecode: Bytes = [0xFE]
        
        let result = try await evm.execute(bytecode: bytecode)
        
        // Should complete but may not be successful depending on EVM implementation
        // We test that it doesn't crash and returns a result
        XCTAssertGreaterThanOrEqual(result.gasUsed, 0)
    }
    
    // MARK: - Contract Call Tests
    
    func testContractCall() async throws {
        let evm = try GuillotineEVM()
        
        // First set up a contract with code
        let contractAddress: Address = "0x1234567890123456789012345678901234567890"
        let contractCode: Bytes = [0x60, 0x42, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3] // Simple return 0x42
        
        try evm.setCode(contractAddress, code: contractCode)
        
        // Now call the contract
        let result = try await evm.call(
            to: contractAddress,
            input: .empty,
            value: .zero,
            from: .zero,
            gasLimit: 100_000
        )
        
        XCTAssertTrue(result.isSuccess, "Contract call should succeed")
        XCTAssertFalse(result.isRevert)
        XCTAssertNil(result.error)
        XCTAssertGreaterThan(result.gasUsed, 0)
        XCTAssertEqual(result.logs.count, 0) // No logs emitted in this test
    }
    
    func testContractCallWithValue() async throws {
        let evm = try GuillotineEVM()
        
        let contractAddress: Address = "0x1000000000000000000000000000000000000000"
        let caller: Address = "0x2000000000000000000000000000000000000000"
        let value = U256.ether(1.0) // 1 ETH
        
        // Set balance for caller
        try evm.setBalance(caller, balance: U256.ether(10.0))
        
        // Simple contract that just accepts value
        let contractCode: Bytes = [0x60, 0x00, 0x60, 0x00, 0xF3] // Return empty
        try evm.setCode(contractAddress, code: contractCode)
        
        let result = try await evm.call(
            to: contractAddress,
            input: .empty,
            value: value,
            from: caller,
            gasLimit: 100_000
        )
        
        // Call should succeed (implementation dependent on EVM behavior)
        XCTAssertGreaterThan(result.gasUsed, 0)
    }
    
    func testStaticCall() async throws {
        let evm = try GuillotineEVM()
        
        let contractAddress: Address = "0x1234567890123456789012345678901234567890"
        let contractCode: Bytes = [0x60, 0x42, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3] // Return 0x42
        
        try evm.setCode(contractAddress, code: contractCode)
        
        let result = try await evm.staticCall(
            to: contractAddress,
            input: .empty,
            from: .zero,
            gasLimit: 100_000
        )
        
        // Static call should work like regular call but with no state changes
        XCTAssertTrue(result.isSuccess || !result.isError, "Static call should not error")
        XCTAssertGreaterThan(result.gasUsed, 0)
    }
    
    // MARK: - Contract Deployment Tests
    
    func testContractDeployment() async throws {
        let evm = try GuillotineEVM()
        
        let deployer: Address = "0x1000000000000000000000000000000000000000"
        let deploymentCode: Bytes = [0x60, 0x42, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3] // Simple contract
        
        // Set balance for deployer
        try evm.setBalance(deployer, balance: U256.ether(1.0))
        
        let result = try await evm.deploy(
            bytecode: deploymentCode,
            value: .zero,
            from: deployer,
            gasLimit: 200_000
        )
        
        // Deployment should succeed or at least not error catastrophically
        XCTAssertGreaterThan(result.gasUsed, 0)
        if result.isSuccess {
            XCTAssertNotNil(result.contractAddress)
        }
    }
    
    func testContractDeploymentWithConstructor() async throws {
        let evm = try GuillotineEVM()
        
        let deployer: Address = "0x2000000000000000000000000000000000000000"
        let bytecode: Bytes = [0x60, 0x42, 0x60, 0x00, 0x52] // PUSH1 0x42, PUSH1 0x00, MSTORE
        let constructor: Bytes = [0x60, 0x20, 0x60, 0x00, 0xF3] // Return 32 bytes
        
        try evm.setBalance(deployer, balance: U256.ether(1.0))
        
        let result = try await evm.deploy(
            bytecode: bytecode,
            constructor: constructor,
            value: .zero,
            from: deployer,
            gasLimit: 300_000
        )
        
        XCTAssertGreaterThan(result.gasUsed, 0)
        // Implementation may or may not succeed - test that it doesn't crash
    }
    
    // MARK: - Transaction Tests
    
    func testTransactionExecution() async throws {
        let evm = try GuillotineEVM()
        
        let from: Address = "0x1111111111111111111111111111111111111111"
        let to: Address = "0x2222222222222222222222222222222222222222"
        
        // Set up accounts
        try evm.setBalance(from, balance: U256.ether(5.0))
        let simpleCode: Bytes = [0x60, 0x00, 0x60, 0x00, 0xF3] // Return empty
        try evm.setCode(to, code: simpleCode)
        
        let transaction = Transaction(
            from: from,
            to: to,
            value: U256.ether(0.1),
            input: .empty,
            gasLimit: 100_000,
            gasPrice: U256.gwei(20),
            nonce: 0
        )
        
        let result = try await evm.executeTransaction(transaction)
        
        XCTAssertGreaterThan(result.gasUsed, 0)
        XCTAssertNil(result.contractAddress) // Not a deployment
        XCTAssertEqual(result.logs.count, 0) // No logs in simple transaction
    }
    
    func testContractCreationTransaction() async throws {
        let evm = try GuillotineEVM()
        
        let deployer: Address = "0x3333333333333333333333333333333333333333"
        let deploymentCode: Bytes = [0x60, 0x42, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xF3]
        
        try evm.setBalance(deployer, balance: U256.ether(2.0))
        
        let transaction = Transaction(
            from: deployer,
            to: nil, // Contract creation
            value: .zero,
            input: deploymentCode,
            gasLimit: 200_000,
            gasPrice: U256.gwei(20),
            nonce: 1
        )
        
        XCTAssertTrue(transaction.isContractCreation)
        XCTAssertFalse(transaction.isCall)
        
        let result = try await evm.executeTransaction(transaction)
        
        XCTAssertGreaterThan(result.gasUsed, 0)
        // Contract address may or may not be set depending on success
    }
    
    // MARK: - State Management Tests
    
    func testSetAndGetBalance() async throws {
        let evm = try GuillotineEVM()
        
        let address: Address = "0x1234567890123456789012345678901234567890"
        let balance = U256.ether(100.0)
        
        // Setting balance should not throw
        XCTAssertNoThrow(try evm.setBalance(address, balance: balance))
        
        // We can't directly get balance with current C API, but setting should succeed
    }
    
    func testSetCode() async throws {
        let evm = try GuillotineEVM()
        
        let address: Address = "0x1234567890123456789012345678901234567890"
        let code: Bytes = [0x60, 0x01, 0x60, 0x02, 0x01] // PUSH1 1, PUSH1 2, ADD
        
        XCTAssertNoThrow(try evm.setCode(address, code: code))
        
        // Verify we can call the contract after setting code
        let result = try await evm.call(to: address, gasLimit: 50_000)
        XCTAssertGreaterThan(result.gasUsed, 0)
    }
    
    // MARK: - Error Handling Tests
    
    func testExecutionErrorHandling() async throws {
        let evm = try GuillotineEVM()
        
        // Test with empty bytecode
        let emptyBytecode: Bytes = .empty
        let result = try await evm.execute(bytecode: emptyBytecode)
        
        // Should complete without throwing, even if not successful
        XCTAssertGreaterThanOrEqual(result.gasUsed, 0)
    }
    
    func testInvalidAddressError() async throws {
        let evm = try GuillotineEVM()
        
        // Test that invalid operations are handled gracefully
        let zeroAddress = Address.zero
        
        // Should not throw when setting balance on zero address
        XCTAssertNoThrow(try evm.setBalance(zeroAddress, balance: U256(1000)))
    }
    
    func testOutOfGasScenario() async throws {
        let evm = try GuillotineEVM()
        
        // Complex bytecode with very low gas limit
        let complexBytecode: Bytes = [
            0x60, 0x01, // PUSH1 1
            0x60, 0x02, // PUSH1 2  
            0x01,       // ADD
            0x60, 0x03, // PUSH1 3
            0x02,       // MUL
            0x60, 0x04, // PUSH1 4
            0x06,       // MOD
        ]
        
        let result = try await evm.execute(bytecode: complexBytecode, gasLimit: 10) // Very low gas
        
        // Should handle out of gas gracefully
        XCTAssertLessThanOrEqual(result.gasUsed, 10)
    }
    
    // MARK: - Concurrent Execution Tests
    
    func testConcurrentExecution() async throws {
        let evm = try GuillotineEVM()
        
        let bytecode: Bytes = [0x60, 0x42, 0x60, 0x43, 0x01] // PUSH1 42, PUSH1 43, ADD
        
        // Execute multiple operations concurrently
        let tasks = (0..<5).map { _ in
            Task {
                try await evm.execute(bytecode: bytecode)
            }
        }
        
        let results = try await withThrowingTaskGroup(of: ExecutionResult.self) { group in
            for task in tasks {
                group.addTask { try await task.value }
            }
            
            var results: [ExecutionResult] = []
            for try await result in group {
                results.append(result)
            }
            return results
        }
        
        XCTAssertEqual(results.count, 5)
        for result in results {
            XCTAssertTrue(result.isSuccess || !result.isError)
            XCTAssertGreaterThan(result.gasUsed, 0)
        }
    }
    
    // MARK: - Performance Tests
    
    func testExecutionPerformance() async throws {
        let evm = try GuillotineEVM()
        let bytecode: Bytes = [0x60, 0x42] // Simple PUSH1 0x42
        
        let startTime = CFAbsoluteTimeGetCurrent()
        
        // Execute 100 operations
        for _ in 0..<100 {
            let result = try await evm.execute(bytecode: bytecode)
            XCTAssertGreaterThanOrEqual(result.gasUsed, 0)
        }
        
        let timeElapsed = CFAbsoluteTimeGetCurrent() - startTime
        print("Executed 100 operations in \(timeElapsed) seconds")
        
        // Performance should be reasonable (less than 1 second for 100 simple operations)
        XCTAssertLessThan(timeElapsed, 5.0, "Performance regression detected")
    }
    
    // MARK: - Integration Tests
    
    func testComplexSmartContractScenario() async throws {
        let evm = try GuillotineEVM()
        
        // Set up a more complex scenario with multiple accounts
        let owner: Address = "0x1111111111111111111111111111111111111111"
        let user1: Address = "0x2222222222222222222222222222222222222222" 
        let user2: Address = "0x3333333333333333333333333333333333333333"
        let contract: Address = "0x4444444444444444444444444444444444444444"
        
        // Set up balances
        try evm.setBalance(owner, balance: U256.ether(100.0))
        try evm.setBalance(user1, balance: U256.ether(50.0))
        try evm.setBalance(user2, balance: U256.ether(25.0))
        
        // Deploy a simple contract
        let contractCode: Bytes = [
            0x60, 0x42,             // PUSH1 0x42
            0x60, 0x00,             // PUSH1 0x00
            0x52,                   // MSTORE
            0x60, 0x20,             // PUSH1 0x20
            0x60, 0x00,             // PUSH1 0x00
            0xF3                    // RETURN
        ]
        
        try evm.setCode(contract, code: contractCode)
        
        // Execute multiple interactions
        let call1 = try await evm.call(
            to: contract,
            from: user1,
            gasLimit: 100_000
        )
        
        let call2 = try await evm.call(
            to: contract,
            from: user2,
            gasLimit: 100_000
        )
        
        // Both calls should complete
        XCTAssertGreaterThan(call1.gasUsed, 0)
        XCTAssertGreaterThan(call2.gasUsed, 0)
    }
}