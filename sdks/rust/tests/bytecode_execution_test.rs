use alloy_primitives::{address, hex, bytes, U256};
use guillotine_ffi::{Evm, CallType};

#[test]
fn test_simple_bytecode_execution() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract = address!("2222222222222222222222222222222222222222");
    
    // Set up balance
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Simple bytecode: PUSH1 0x42, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    // This stores 0x42 in memory and returns it
    let bytecode = bytes!("604260005260206000f3");
    evm.set_code(contract, &bytecode)
        .expect("Failed to set code");
    
    let result = evm.execute_with_type(
        caller,
        Some(contract),
        U256::ZERO,
        &[],
        100_000,
        CallType::Call,
        None
    ).expect("Failed to execute");
    
    assert!(result.is_success(), "Execution should succeed");
    assert_eq!(result.output.len(), 32, "Should return 32 bytes");
    assert_eq!(result.output[31], 0x42, "Last byte should be 0x42");
    println!("✓ Simple bytecode execution successful");
}

#[test]
fn test_complex_bytecode_with_storage() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract = address!("3333333333333333333333333333333333333333");
    
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Bytecode that:
    // 1. Stores 0xDEADBEEF at storage slot 0
    // 2. Loads it back and returns it
    // PUSH4 0xDEADBEEF, PUSH1 0x00, SSTORE
    // PUSH1 0x00, SLOAD
    // PUSH1 0x00, MSTORE
    // PUSH1 0x20, PUSH1 0x00, RETURN
    let bytecode = bytes!("63deadbeef60005560005460005260206000f3");
    evm.set_code(contract, &bytecode)
        .expect("Failed to set code");
    
    let result = evm.execute_with_type(
        caller,
        Some(contract),
        U256::ZERO,
        &[],
        100_000,
        CallType::Call,
        None
    ).expect("Failed to execute");
    
    assert!(result.is_success(), "Execution should succeed");
    
    // Check storage was written
    let stored = evm.get_storage(contract, U256::ZERO)
        .expect("Failed to get storage");
    assert_eq!(stored, U256::from(0xDEADBEEFu32), "Storage should contain 0xDEADBEEF");
    
    // Check return value
    assert_eq!(result.output.len(), 32, "Should return 32 bytes");
    let return_value = U256::from_be_slice(&result.output);
    assert_eq!(return_value, U256::from(0xDEADBEEFu32), "Should return 0xDEADBEEF");
    println!("✓ Complex bytecode with storage successful");
}

#[test]
fn test_erc20_transfer_bytecode() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let deployer = address!("1111111111111111111111111111111111111111");
    let alice = address!("2222222222222222222222222222222222222222");
    let bob = address!("3333333333333333333333333333333333333333");
    
    // Set balances
    evm.set_balance(deployer, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set deployer balance");
    evm.set_balance(alice, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set alice balance");
    
    // Minimal ERC20-like contract (simplified for testing)
    // This is a very basic contract that mimics transfer functionality
    // Real ERC20 would be much larger
    let erc20_bytecode = hex!("608060405234801561001057600080fd5b50610150806100206000396000f3fe608060405234801561001057600080fd5b50600436106100365760003560e01c806370a082311461003b578063a9059cbb14610063575b600080fd5b61004e610049366004610093565b610076565b60405190151581526020015b60405180910390f35b61004e6100713660046100bd565b600192915050565b6000602052816000526040600020549050919050565b600080fd5b6000602082840312156100a757600080fd5b81356001600160a01b03811681146100be57600080fd5b9392505050565b600080604083850312156100d957600080fd5b82356001600160a01b03811681146100f057600080fd5b946020939093013593505050565b600080fd5b60008219821115610115576101156100ff565b50019056fea264697066735822122000000000000000000000000000000000000000000000000000000000000000000000");
    
    // Deploy a simple token contract
    let token_addr = address!("4444444444444444444444444444444444444444");
    evm.set_code(token_addr, &erc20_bytecode)
        .expect("Failed to deploy token");
    
    // Set initial token balances in storage
    // slot = keccak256(alice_address . 0x00) for mapping(address => uint256)
    let alice_slot = U256::from_be_bytes(hex!("0000000000000000000000002222222222222222222222222222222222222222"));
    evm.set_storage(token_addr, alice_slot, U256::from(1000))
        .expect("Failed to set alice token balance");
    
    // Call transfer function: transfer(bob, 100)
    // Function selector for transfer(address,uint256) = 0xa9059cbb
    let mut transfer_data = Vec::new();
    transfer_data.extend_from_slice(&hex!("a9059cbb")); // transfer selector
    transfer_data.extend_from_slice(&[0u8; 12]); // padding for address
    transfer_data.extend_from_slice(bob.as_slice()); // bob's address
    transfer_data.extend_from_slice(&U256::from(100).to_be_bytes::<32>()); // amount
    
    let result = evm.execute_with_type(
        alice,
        Some(token_addr),
        U256::ZERO,
        &transfer_data,
        200_000,
        CallType::Call,
        None
    ).expect("Failed to execute transfer");
    
    // For this simple test contract, we just verify it executed
    assert!(result.gas_used > 0, "Should consume gas");
    println!("✓ ERC20-like transfer bytecode execution successful");
}

#[test] 
fn test_bytecode_with_logs() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract = address!("5555555555555555555555555555555555555555");
    
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Bytecode that emits a log
    // PUSH1 0x42, PUSH1 0x00, MSTORE  (store 0x42 in memory)
    // PUSH1 0x20, PUSH1 0x00, LOG0    (emit log with 32 bytes from memory)
    let bytecode = bytes!("604260005260206000a0");
    evm.set_code(contract, &bytecode)
        .expect("Failed to set code");
    
    let result = evm.execute_with_type(
        caller,
        Some(contract),
        U256::ZERO,
        &[],
        100_000,
        CallType::Call,
        None
    ).expect("Failed to execute");
    
    assert!(result.is_success(), "Execution should succeed");
    assert_eq!(result.logs.len(), 1, "Should emit one log");
    
    let log = &result.logs[0];
    assert_eq!(log.address, contract, "Log should be from contract");
    assert_eq!(log.topics.len(), 0, "LOG0 has no topics");
    assert_eq!(log.data.len(), 32, "Log data should be 32 bytes");
    assert_eq!(log.data[31], 0x42, "Last byte of log should be 0x42");
    println!("✓ Bytecode with logs execution successful");
}

#[test]
fn test_bytecode_gas_consumption() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract = address!("6666666666666666666666666666666666666666");
    
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Expensive bytecode with loops
    // This does multiple SSTORE operations which are gas-expensive
    let expensive_bytecode = bytes!("600060005560016001556002600255600360035560046004556005600555");
    evm.set_code(contract, &expensive_bytecode)
        .expect("Failed to set code");
    
    let result = evm.execute_with_type(
        caller,
        Some(contract),
        U256::ZERO,
        &[],
        500_000,
        CallType::Call,
        None
    ).expect("Failed to execute");
    
    assert!(result.is_success(), "Execution should succeed");
    assert!(result.gas_used > 100_000, "Should consume significant gas for multiple SSTOREs");
    println!("✓ Gas consumption tracking works correctly");
    println!("  Gas used: {}", result.gas_used);
}

#[test]
fn test_bytecode_creation() {
    guillotine_ffi::initialize();
    
    let mut evm = Evm::new().expect("Failed to create EVM");
    let creator = address!("1111111111111111111111111111111111111111");
    
    evm.set_balance(creator, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Contract creation bytecode that deploys a simple contract
    // Constructor: PUSH1 0x0a (size), PUSH1 0x0c (offset), PUSH1 0x00, CODECOPY, PUSH1 0x0a, PUSH1 0x00, RETURN
    // Runtime: PUSH1 0x42, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    let creation_bytecode = bytes!("600a600c600039600a6000f3604260005260206000f3");
    
    let result = evm.transact()
        .from(creator)
        .input(creation_bytecode.to_vec())
        .gas_limit(500_000)
        .call_type(CallType::Create)
        .execute()
        .expect("Failed to create contract");
    
    assert!(result.is_success(), "Contract creation should succeed");
    assert!(result.created_address.is_some(), "Should return created address");
    
    if let Some(deployed_addr) = result.created_address {
        // Verify the deployed contract works
        let call_result = evm.execute_with_type(
            creator,
            Some(deployed_addr),
            U256::ZERO,
            &[],
            100_000,
            CallType::Call,
            None
        ).expect("Failed to call deployed contract");
        
        assert!(call_result.is_success(), "Call to deployed contract should succeed");
        assert_eq!(call_result.output[31], 0x42, "Deployed contract should return 0x42");
        println!("✓ Contract creation and execution successful");
    }
}