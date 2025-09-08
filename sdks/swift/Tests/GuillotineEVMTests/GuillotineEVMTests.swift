import XCTest
@testable import GuillotineEVM

final class GuillotineEVMTests: XCTestCase {
    
    override class func setUp() {
        super.setUp()
        GuillotineEVM.initialize()
    }
    
    override class func tearDown() {
        GuillotineEVM.cleanup()
        super.tearDown()
    }
    
    func testAddressCreation() {
        // Test hex string initialization
        let addr1 = Address(hex: "0x0000000000000000000000000000000000000010")
        XCTAssertNotNil(addr1)
        XCTAssertEqual(addr1?.hexString, "0x0000000000000000000000000000000000000010")
        
        // Test without 0x prefix
        let addr2 = Address(hex: "0000000000000000000000000000000000000020")
        XCTAssertNotNil(addr2)
        XCTAssertEqual(addr2?.hexString, "0x0000000000000000000000000000000000000020")
        
        // Test invalid address
        let addr3 = Address(hex: "invalid")
        XCTAssertNil(addr3)
    }
    
    func testU256Creation() {
        let value1 = U256(42)
        XCTAssertEqual(value1.data.count, 32)
        XCTAssertEqual(value1.data[31], 42)
        
        let value2 = U256(1_000_000_000_000_000_000) // 1 ETH in wei
        XCTAssertEqual(value2.data.count, 32)
    }
    
    func testEVMCreation() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        XCTAssertNotNil(evm)
    }
    
    func testSetBalance() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Set balance for an account
        let account = Address(hex: "0x0000000000000000000000000000000000000010")!
        let balance = U256(1_000_000_000_000_000_000) // 1 ETH
        
        try evm.setBalance(address: account, balance: balance)
        // If no exception is thrown, the operation succeeded
    }
    
    func testSetCode() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Deploy a simple contract (STOP opcode)
        let contractAddress = Address(hex: "0x0000000000000000000000000000000000000020")!
        let bytecode = Data([0x00]) // STOP
        
        try evm.setCode(address: contractAddress, code: bytecode)
        // If no exception is thrown, the operation succeeded
    }
    
    func testSimpleCall() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Set up caller with balance
        let caller = Address(hex: "0x0000000000000000000000000000000000000010")!
        let balance = U256(1_000_000_000_000_000_000) // 1 ETH
        try evm.setBalance(address: caller, balance: balance)
        
        // Deploy a contract that returns 42
        let contractAddress = Address(hex: "0x0000000000000000000000000000000000000020")!
        let bytecode = Data([
            0x60, 0x2a,  // PUSH1 42
            0x60, 0x00,  // PUSH1 0
            0x52,        // MSTORE
            0x60, 0x20,  // PUSH1 32
            0x60, 0x00,  // PUSH1 0
            0xf3         // RETURN
        ])
        try evm.setCode(address: contractAddress, code: bytecode)
        
        // Call the contract
        let params = CallParameters(
            caller: caller,
            to: contractAddress,
            value: .zero,
            input: Data(),
            gas: 100_000,
            callType: .call
        )
        
        let result = try evm.call(params)
        
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.gasLeft, 0)
        XCTAssertEqual(result.output.count, 32)
        XCTAssertEqual(result.output[31], 42)
    }
    
    func testArithmeticOperation() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Set up caller with balance
        let caller = Address(hex: "0x0000000000000000000000000000000000000010")!
        let balance = U256(1_000_000_000_000_000_000) // 1 ETH
        try evm.setBalance(address: caller, balance: balance)
        
        // Deploy a contract that adds 3 + 5 = 8
        let contractAddress = Address(hex: "0x0000000000000000000000000000000000000030")!
        let bytecode = Data([
            0x60, 0x05,  // PUSH1 5
            0x60, 0x03,  // PUSH1 3
            0x01,        // ADD
            0x60, 0x00,  // PUSH1 0
            0x52,        // MSTORE
            0x60, 0x20,  // PUSH1 32
            0x60, 0x00,  // PUSH1 0
            0xf3         // RETURN
        ])
        try evm.setCode(address: contractAddress, code: bytecode)
        
        // Call the contract
        let params = CallParameters(
            caller: caller,
            to: contractAddress,
            value: .zero,
            input: Data(),
            gas: 100_000,
            callType: .call
        )
        
        let result = try evm.call(params)
        
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.gasLeft, 0)
        XCTAssertEqual(result.output.count, 32)
        XCTAssertEqual(result.output[31], 8) // 3 + 5 = 8
    }
    
    func testSimulation() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Set up caller with balance
        let caller = Address(hex: "0x0000000000000000000000000000000000000010")!
        let balance = U256(1_000_000_000_000_000_000) // 1 ETH
        try evm.setBalance(address: caller, balance: balance)
        
        // Deploy a simple contract
        let contractAddress = Address(hex: "0x0000000000000000000000000000000000000040")!
        let bytecode = Data([0x00]) // STOP
        try evm.setCode(address: contractAddress, code: bytecode)
        
        // Simulate a call
        let params = CallParameters(
            caller: caller,
            to: contractAddress,
            value: .zero,
            input: Data(),
            gas: 100_000,
            callType: .call
        )
        
        let result = try evm.simulate(params)
        
        XCTAssertTrue(result.success)
        XCTAssertGreaterThan(result.gasLeft, 0)
    }
    
    func testMultipleAccounts() throws {
        let coinbase = Address(hex: "0x0000000000000000000000000000000000000000")!
        let blockInfo = BlockInfo(
            number: 1,
            timestamp: 1000,
            gasLimit: 30_000_000,
            coinbase: coinbase,
            baseFee: 1_000_000_000,
            chainId: 1
        )
        
        let evm = try GuillotineEVM(blockInfo: blockInfo)
        
        // Set up multiple accounts with different balances
        let accounts = [
            (Address(hex: "0x0000000000000000000000000000000000000010")!, U256(1_000_000_000_000_000_000)),
            (Address(hex: "0x0000000000000000000000000000000000000020")!, U256(500_000_000_000_000_000)),
            (Address(hex: "0x0000000000000000000000000000000000000030")!, U256(100_000_000_000_000_000))
        ]
        
        for (address, balance) in accounts {
            try evm.setBalance(address: address, balance: balance)
        }
        
        // Deploy contracts at different addresses
        let contracts = [
            (Address(hex: "0x0000000000000000000000000000000000000040")!, Data([0x00])), // STOP
            (Address(hex: "0x0000000000000000000000000000000000000050")!, Data([0x60, 0x01, 0x60, 0x02, 0x01, 0x00])) // ADD 1+2, STOP
        ]
        
        for (address, code) in contracts {
            try evm.setCode(address: address, code: code)
        }
        
        // All operations should succeed without throwing
    }
}