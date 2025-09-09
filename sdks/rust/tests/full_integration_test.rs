use alloy_primitives::{address, bytes, U256};
use guillotine_ffi::{Evm, CallType};

#[test]
fn test_full_evm_workflow() {
    // Initialize the FFI layer
    guillotine_ffi::initialize();

    // Create an EVM instance with default configuration
    let mut evm = Evm::new().expect("Failed to create EVM");

    // Test account addresses
    let alice = address!("1111111111111111111111111111111111111111");
    let bob = address!("2222222222222222222222222222222222222222");
    let contract_addr = address!("3333333333333333333333333333333333333333");

    // Set initial balances
    evm.set_balance(alice, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set Alice's balance");
    evm.set_balance(bob, U256::from(500_000_000_000_000_000u64))
        .expect("Failed to set Bob's balance");

    // Simple contract bytecode that stores a value
    // PUSH1 0x42 PUSH1 0x00 SSTORE (stores 0x42 at slot 0)
    let bytecode = bytes!("60426000556000356000525f6020525f5ff3");
    evm.set_code(contract_addr, &bytecode)
        .expect("Failed to set contract code");

    // Execute a call to the contract
    let result = evm.execute_with_type(
        alice,
        Some(contract_addr),
        U256::ZERO,
        &[],
        100_000,
        CallType::Call,
        None
    ).expect("Failed to execute call");

    assert!(result.is_success(), "Contract call should succeed");
    assert!(result.gas_used > 0, "Should consume some gas");

    // Test storage operations
    let key = U256::from(0);
    let expected_value = U256::from(0x42);
    let stored_value = evm.get_storage(contract_addr, key)
        .expect("Failed to get storage");
    assert_eq!(stored_value, expected_value, "Storage value should be 0x42");

    // Test balance transfer via transaction builder
    let transfer_result = evm.transact()
        .from(alice)
        .to(bob)
        .value(U256::from(100_000_000_000_000_000u64))
        .gas_limit(21_000)
        .call_type(CallType::Call)
        .execute()
        .expect("Failed to execute transfer");

    assert!(transfer_result.is_success(), "Transfer should succeed");

    // Verify balances after transfer
    let alice_balance = evm.get_balance(alice)
        .expect("Failed to get Alice's balance");
    let bob_balance = evm.get_balance(bob)
        .expect("Failed to get Bob's balance");

    assert!(alice_balance < U256::from(1_000_000_000_000_000_000u64), "Alice's balance should decrease");
    assert!(bob_balance > U256::from(500_000_000_000_000_000u64), "Bob's balance should increase");
}

#[test]
fn test_contract_creation() {
    guillotine_ffi::initialize();

    let mut evm = Evm::new().expect("Failed to create EVM");
    let creator = address!("1111111111111111111111111111111111111111");
    
    // Set creator balance
    evm.set_balance(creator, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set creator balance");

    // Simple contract creation bytecode
    // Constructor code that returns runtime code
    let creation_code = bytes!("6080604052348015600f57600080fd5b50603e80601d6000396000f3fe6080604052600080fdfea265627a7a72315820");
    
    let result = evm.transact()
        .from(creator)
        .input(creation_code.to_vec())
        .value(U256::ZERO)
        .gas_limit(500_000)
        .call_type(CallType::Create)
        .execute()
        .expect("Failed to create contract");

    assert!(result.is_success(), "Contract creation should succeed");
    assert!(result.created_address.is_some(), "Should return created address");
    
    if let Some(new_contract) = result.created_address {
        // Verify contract was deployed
        let code = evm.get_code(new_contract)
            .expect("Failed to get contract code");
        assert!(!code.is_empty(), "Contract should have code");
    }
}

#[test]
fn test_revert_handling() {
    guillotine_ffi::initialize();

    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract_addr = address!("2222222222222222222222222222222222222222");

    // Set caller balance
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");

    // Contract that always reverts: PUSH1 0x00 DUP1 REVERT
    let revert_code = bytes!("600080fd");
    evm.set_code(contract_addr, &revert_code)
        .expect("Failed to set code");

    let result = evm.execute_with_type(
        caller,
        Some(contract_addr),
        U256::ZERO,
        &[],
        100_000,
        CallType::Call,
        None
    ).expect("Failed to execute call");

    assert!(result.is_failure(), "Call should fail/revert");
    assert!(result.gas_used > 0, "Should still consume gas");
}

#[test]
fn test_static_call() {
    guillotine_ffi::initialize();

    let mut evm = Evm::new().expect("Failed to create EVM");
    let caller = address!("1111111111111111111111111111111111111111");
    let contract_addr = address!("2222222222222222222222222222222222222222");

    // Set initial state
    evm.set_balance(caller, U256::from(1_000_000_000_000_000_000u64))
        .expect("Failed to set balance");
    
    // Contract that tries to write storage (should fail in static call)
    let write_code = bytes!("60426000556000356000525f6020525f5ff3");
    evm.set_code(contract_addr, &write_code)
        .expect("Failed to set code");

    // Execute static call (should not modify state)
    let result = evm.execute_with_type(
        caller,
        Some(contract_addr),
        U256::ZERO,
        &[],
        100_000,
        CallType::StaticCall,
        None
    );

    // Static calls that attempt state changes should fail
    match result {
        Ok(res) => {
            // Some implementations might succeed but not write
            if res.is_success() {
                let stored = evm.get_storage(contract_addr, U256::from(0))
                    .expect("Failed to get storage");
                assert_eq!(stored, U256::ZERO, "Static call should not modify storage");
            }
        }
        Err(_) => {
            // Expected behavior - static call with state modification attempts fails
        }
    }
}