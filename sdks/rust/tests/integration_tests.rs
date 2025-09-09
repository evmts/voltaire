//! Integration tests for the Guillotine Rust SDK

use guillotine_ffi::*;
use alloy_primitives::{Address, U256};

#[test]
fn test_evm_creation() {
    // Mock test - just verify the types compile
    // Real implementation would create an actual EVM instance
}

#[test] 
fn test_address_from_hex() {
    let addr = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
    assert_eq!(addr, Address::from([0x11; 20]));
    
    let addr2 = address_from_hex("1111111111111111111111111111111111111111").unwrap();
    assert_eq!(addr2, Address::from([0x11; 20]));
}

#[test]
fn test_bytecode_from_hex() {
    let code = bytecode_from_hex("0x6060604052").unwrap();
    assert_eq!(code, vec![0x60, 0x60, 0x60, 0x40, 0x52]);
    
    let code2 = bytecode_from_hex("6060604052").unwrap();
    assert_eq!(code2, vec![0x60, 0x60, 0x60, 0x40, 0x52]);
}

#[test]
fn test_call_type_values() {
    assert_eq!(CallType::Call as u8, 0);
    assert_eq!(CallType::CallCode as u8, 1);
    assert_eq!(CallType::DelegateCall as u8, 2);
    assert_eq!(CallType::StaticCall as u8, 3);
    assert_eq!(CallType::Create as u8, 4);
    assert_eq!(CallType::Create2 as u8, 5);
}

#[test]
fn test_execution_result_construction() {
    let result = ExecutionResult::success(21000, vec![0x01, 0x02, 0x03]);
    assert!(result.is_success());
    assert!(!result.is_failure());
    assert_eq!(result.gas_used, 21000);
    assert_eq!(result.output(), &[0x01, 0x02, 0x03]);
    
    let failure = ExecutionResult::failure(5000);
    assert!(!failure.is_success());
    assert!(failure.is_failure());
    assert_eq!(failure.gas_used, 5000);
    assert!(failure.output().is_empty());
}

#[test]
fn test_log_construction() {
    let addr = Address::from([0x11; 20]);
    let topics = vec![B256::from([0x22; 32])];
    let data = Bytes::from(vec![0x33, 0x44]);
    
    let log = Log::new(addr, topics.clone(), data.clone());
    assert_eq!(log.address, addr);
    assert_eq!(log.topics, topics);
    assert_eq!(log.data, data);
}