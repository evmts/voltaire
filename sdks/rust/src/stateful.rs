//! Stateful high-performance EVM wrapper
//! 
//! This module provides a stateful EVM instance that avoids recreation
//! overhead and uses zero-copy techniques for maximum performance.

use crate::ffi;
use crate::types::{ExecutionResult, Log, CallType};
use alloy_primitives::{Address, Bytes, B256, U256};
use std::ffi::CStr;
use std::sync::Once;

// Global FFI initialization
static INIT: Once = Once::new();

fn ensure_initialized() {
    INIT.call_once(|| {
        unsafe {
            ffi::guillotine_ffi_init();
        }
    });
}

/// A stateful EVM instance that maintains state across calls
/// 
/// This provides significantly better performance than creating/destroying
/// EVM instances for each operation, especially in benchmarking scenarios.
#[derive(Debug)]
pub struct StatefulEvm {
    handle: usize,
    /// Track whether we own this handle (for drop)
    owned: bool,
}

impl StatefulEvm {
    /// Create a new stateful EVM instance with default parameters
    pub fn new() -> Result<Self, String> {
        Self::with_config(StatefulEvmConfig::default())
    }
    
    /// Create a new stateful EVM instance with custom configuration
    pub fn with_config(config: StatefulEvmConfig) -> Result<Self, String> {
        ensure_initialized();
        
        unsafe {
            let handle = ffi::guillotine_ffi_create_stateful(
                config.block_number,
                config.block_timestamp,
                config.block_gas_limit,
                &config.coinbase,
                config.base_fee,
                config.chain_id,
            );
            
            if handle == 0 {
                let error = get_last_error();
                return Err(format!("Failed to create stateful EVM: {}", error));
            }
            
            Ok(Self {
                handle,
                owned: true,
            })
        }
    }
    
    /// Reset the EVM state (clears database but keeps instance)
    /// 
    /// This is much faster than destroying and recreating the EVM
    pub fn reset(&mut self) -> Result<(), String> {
        unsafe {
            if !ffi::guillotine_ffi_reset_state(self.handle) {
                return Err(get_last_error());
            }
        }
        Ok(())
    }
    
    /// Set balance for an address
    pub fn set_balance(&mut self, address: Address, balance: U256) -> Result<(), String> {
        let addr_bytes = **address;
        let balance_bytes = u256_to_bytes_le(balance);
        
        unsafe {
            if !ffi::guillotine_ffi_set_balance(self.handle, &addr_bytes, &balance_bytes) {
                return Err(get_last_error());
            }
        }
        Ok(())
    }
    
    /// Set code for an address (zero-copy)
    pub fn set_code(&mut self, address: Address, code: &[u8]) -> Result<(), String> {
        let addr_bytes = **address;
        let code_slice = ffi::FfiSlice::from_slice(code);
        
        unsafe {
            if !ffi::guillotine_ffi_set_code(self.handle, &addr_bytes, code_slice) {
                return Err(get_last_error());
            }
        }
        Ok(())
    }
    
    /// Execute a transaction (zero-copy)
    pub fn execute(
        &mut self,
        from: Address,
        to: Option<Address>,
        value: U256,
        input: &[u8],
        gas_limit: u64,
    ) -> Result<ExecutionResult, String> {
        self.execute_with_type(from, to, value, input, gas_limit, CallType::Call, None)
    }
    
    /// Execute a transaction with specific call type (zero-copy)
    pub fn execute_with_type(
        &mut self,
        from: Address,
        to: Option<Address>,
        value: U256,
        input: &[u8],
        gas_limit: u64,
        call_type: CallType,
        salt: Option<[u8; 32]>,
    ) -> Result<ExecutionResult, String> {
        let params = ffi::FfiCallParams {
            caller: **from,
            to: to.map(|a| **a).unwrap_or([0; 20]),
            value: u256_to_bytes_le(value),
            input: ffi::FfiSlice::from_slice(input),
            gas: gas_limit,
            call_type: call_type as u8,
            salt: salt.unwrap_or([0; 32]),
        };
        
        let mut result = ffi::FfiExecutionResult {
            success: false,
            gas_left: 0,
            output: ffi::FfiSlice { ptr: std::ptr::null(), len: 0 },
            logs_ptr: std::ptr::null(),
            logs_len: 0,
            created_address: [0; 20],
            has_created_address: false,
        };
        
        unsafe {
            if !ffi::guillotine_ffi_execute(self.handle, &params, &mut result) {
                return Err(get_last_error());
            }
            
            // Convert result (zero-copy where possible)
            let output = if result.output.len > 0 {
                result.output.to_slice().to_vec()
            } else {
                Vec::new()
            };
            
            let logs = if result.logs_len > 0 && !result.logs_ptr.is_null() {
                let log_slice = std::slice::from_raw_parts(result.logs_ptr, result.logs_len);
                log_slice.iter().map(|log| {
                    let topics_slice = log.topics.to_slice();
                    let topics_count = topics_slice.len() / 32;
                    let mut topics = Vec::with_capacity(topics_count);
                    for i in 0..topics_count {
                        let start = i * 32;
                        let end = start + 32;
                        let mut topic_bytes = [0u8; 32];
                        topic_bytes.copy_from_slice(&topics_slice[start..end]);
                        topics.push(B256::from(topic_bytes));
                    }
                    
                    let data = if log.data.len > 0 {
                        Bytes::from(log.data.to_slice().to_vec())
                    } else {
                        Bytes::new()
                    };
                    
                    Log::new(Address::from(log.address), topics, data)
                }).collect()
            } else {
                Vec::new()
            };
            
            let gas_used = gas_limit.saturating_sub(result.gas_left);
            let mut exec_result = ExecutionResult::success(gas_used, output);
            exec_result.logs = logs;
            
            if result.has_created_address {
                exec_result.created_address = Some(Address::from(result.created_address));
            }
            
            Ok(exec_result)
        }
    }
    
    /// Perform batch state updates for efficiency
    pub fn batch_updates(&mut self, updates: Vec<StateUpdate>) -> Result<(), String> {
        let mut ops = Vec::with_capacity(updates.len());
        
        for update in &updates {
            let op = match update {
                StateUpdate::SetBalance { address, balance } => {
                    ffi::FfiBatchOperation {
                        op_type: 0,
                        address: **address,
                        key: u256_to_bytes_le(*balance),
                        value: ffi::FfiSlice { ptr: std::ptr::null(), len: 0 },
                    }
                },
                StateUpdate::SetCode { address, code } => {
                    ffi::FfiBatchOperation {
                        op_type: 1,
                        address: **address,
                        key: [0; 32],
                        value: ffi::FfiSlice::from_slice(code),
                    }
                },
                StateUpdate::SetStorage { address, slot, value } => {
                    ffi::FfiBatchOperation {
                        op_type: 2,
                        address: **address,
                        key: u256_to_bytes_le(*slot),
                        value: ffi::FfiSlice::from_slice(&u256_to_bytes_le(*value)),
                    }
                },
            };
            ops.push(op);
        }
        
        unsafe {
            if !ffi::guillotine_ffi_batch_state_updates(
                self.handle,
                ops.as_ptr(),
                ops.len(),
            ) {
                return Err(get_last_error());
            }
        }
        
        Ok(())
    }
    
    /// Clone the handle (creates a new reference to the same EVM)
    /// 
    /// This is useful for benchmarking where you want to reuse the same
    /// EVM instance across iterations without drop/recreate overhead.
    pub fn share_handle(&self) -> Self {
        Self {
            handle: self.handle,
            owned: false, // Don't destroy on drop
        }
    }
}

impl Drop for StatefulEvm {
    fn drop(&mut self) {
        if self.owned && self.handle != 0 {
            unsafe {
                ffi::guillotine_ffi_destroy_instance(self.handle);
            }
        }
    }
}

unsafe impl Send for StatefulEvm {}
unsafe impl Sync for StatefulEvm {}

/// Configuration for stateful EVM creation
#[derive(Debug, Clone)]
pub struct StatefulEvmConfig {
    pub block_number: u64,
    pub block_timestamp: u64,
    pub block_gas_limit: u64,
    pub coinbase: [u8; 20],
    pub base_fee: u64,
    pub chain_id: u64,
}

impl Default for StatefulEvmConfig {
    fn default() -> Self {
        Self {
            block_number: 1,
            block_timestamp: 1000,
            block_gas_limit: 30_000_000,
            coinbase: [0; 20],
            base_fee: 1_000_000_000,
            chain_id: 1,
        }
    }
}

/// State update for batch operations
#[derive(Debug, Clone)]
pub enum StateUpdate {
    SetBalance {
        address: Address,
        balance: U256,
    },
    SetCode {
        address: Address,
        code: Vec<u8>,
    },
    SetStorage {
        address: Address,
        slot: U256,
        value: U256,
    },
}

// Helper functions

fn u256_to_bytes_le(value: U256) -> [u8; 32] {
    value.to_le_bytes()
}

fn get_last_error() -> String {
    unsafe {
        let error_ptr = ffi::guillotine_ffi_get_last_error();
        if error_ptr.is_null() {
            "Unknown error".to_string()
        } else {
            CStr::from_ptr(error_ptr).to_string_lossy().into_owned()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    #[ignore] // Requires FFI
    fn test_stateful_evm_reuse() {
        // Create once, use multiple times
        let mut evm = StatefulEvm::new().unwrap();
        let from = Address::from([0x11; 20]);
        let to = Address::from([0x22; 20]);
        
        // First execution
        evm.set_balance(from, U256::from(1_000_000)).unwrap();
        let result1 = evm.execute(from, Some(to), U256::from(1000), &[], 21000).unwrap();
        assert!(result1.success);
        
        // Reset and reuse (much faster than recreating)
        evm.reset().unwrap();
        
        // Second execution with same instance
        evm.set_balance(from, U256::from(2_000_000)).unwrap();
        let result2 = evm.execute(from, Some(to), U256::from(2000), &[], 21000).unwrap();
        assert!(result2.success);
    }
    
    #[test]
    #[ignore] // Requires FFI
    fn test_batch_operations() {
        let mut evm = StatefulEvm::new().unwrap();
        
        let updates = vec![
            StateUpdate::SetBalance {
                address: Address::from([0x11; 20]),
                balance: U256::from(1_000_000),
            },
            StateUpdate::SetBalance {
                address: Address::from([0x22; 20]),
                balance: U256::from(2_000_000),
            },
            StateUpdate::SetCode {
                address: Address::from([0x33; 20]),
                code: vec![0x60, 0x00, 0x60, 0x00, 0xf3],
            },
        ];
        
        evm.batch_updates(updates).unwrap();
    }
}