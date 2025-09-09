//! # guillotine-rs
//! 
//! Safe Rust bindings for the Guillotine EVM - a high-performance Ethereum Virtual Machine
//! implementation written in Zig.
//! 
//! ## Example
//! 
//! ```no_run
//! use guillotine_ffi::{Evm, EvmBuilder};
//! use alloy_primitives::{Address, U256};
//! 
//! # fn main() -> Result<(), Box<dyn std::error::Error>> {
//! // Create EVM instance
//! let mut evm = EvmBuilder::new().build()?;
//! 
//! // Set up account
//! let account = Address::from([0x11; 20]);
//! evm.set_balance(account, U256::from(1_000_000))?;
//! 
//! // Execute transaction
//! let result = evm.transact()
//!     .from(account)
//!     .to(Address::from([0x22; 20]))
//!     .value(U256::from(1000))
//!     .gas_limit(21000)
//!     .execute()?;
//! # Ok(())
//! # }
//! ```

#![warn(missing_docs)]
#![warn(missing_debug_implementations)]

pub use alloy_primitives::{Address, Bytes, B256, U256};

mod ffi;
mod types;

pub use types::{ExecutionResult, Log, CallType};

use std::ffi::CStr;
use std::ptr;
use std::slice;
use std::sync::Once;

// Global FFI initialization
static INIT: Once = Once::new();

/// Initialize the FFI layer. Call this once at the start of your program.
pub fn initialize() {
    ensure_initialized();
}

fn ensure_initialized() {
    INIT.call_once(|| {
        unsafe {
            ffi::guillotine_init();
        }
    });
}

/// Safe Rust wrapper for Guillotine EVM
#[derive(Debug)]
pub struct Evm {
    inner: EvmInner,
    tracing: bool,
}

struct EvmInner {
    handle: *mut ffi::EvmHandle,
}

impl std::fmt::Debug for EvmInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EvmInner")
            .field("handle", &"<opaque>")
            .finish()
    }
}

impl Evm {
    /// Create a new Guillotine EVM instance with default block info
    pub fn new() -> Result<Self, String> {
        Self::with_block_info(types::default_block_info())
    }

    /// Create a new Guillotine EVM instance with custom block info
    pub fn with_block_info(block_info: ffi::BlockInfoFFI) -> Result<Self, String> {
        ensure_initialized();
        
        unsafe {
            let handle = ffi::guillotine_evm_create(&block_info);
            if handle.is_null() {
                let error = get_last_error();
                Err(format!("Failed to create Guillotine VM: {}", error))
            } else {
                Ok(Self {
                    inner: EvmInner { handle },
                    tracing: false,
                })
            }
        }
    }

    /// Create a new Guillotine EVM instance with tracing enabled
    pub fn with_tracing(block_info: ffi::BlockInfoFFI) -> Result<Self, String> {
        ensure_initialized();
        
        unsafe {
            let handle = ffi::guillotine_evm_create_tracing(&block_info);
            if handle.is_null() {
                let error = get_last_error();
                Err(format!("Failed to create Guillotine VM with tracing: {}", error))
            } else {
                Ok(Self {
                    inner: EvmInner { handle },
                    tracing: true,
                })
            }
        }
    }

    /// Set balance for an address
    pub fn set_balance(&mut self, address: Address, balance: U256) -> Result<(), String> {
        let addr_bytes = **address;
        let balance_bytes = u256_to_bytes_le(balance);

        unsafe {
            let success = if self.tracing {
                ffi::guillotine_set_balance_tracing(self.inner.handle, addr_bytes.as_ptr(), balance_bytes.as_ptr())
            } else {
                ffi::guillotine_set_balance(self.inner.handle, addr_bytes.as_ptr(), balance_bytes.as_ptr())
            };

            if success {
                Ok(())
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Get balance for an address
    pub fn get_balance(&self, address: Address) -> Result<U256, String> {
        let addr_bytes = **address;
        let mut balance_bytes = [0u8; 32];

        unsafe {
            if ffi::guillotine_get_balance(self.inner.handle, addr_bytes.as_ptr(), balance_bytes.as_mut_ptr()) {
                Ok(bytes_to_u256_le(&balance_bytes))
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Set code for an address
    pub fn set_code(&mut self, address: Address, code: &[u8]) -> Result<(), String> {
        let addr_bytes = **address;

        unsafe {
            let success = if self.tracing {
                ffi::guillotine_set_code_tracing(self.inner.handle, addr_bytes.as_ptr(), code.as_ptr(), code.len())
            } else {
                ffi::guillotine_set_code(self.inner.handle, addr_bytes.as_ptr(), code.as_ptr(), code.len())
            };

            if success {
                Ok(())
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Get code for an address
    pub fn get_code(&self, address: Address) -> Result<Vec<u8>, String> {
        let addr_bytes = **address;
        let mut code_ptr: *mut u8 = ptr::null_mut();
        let mut code_len: usize = 0;

        unsafe {
            if ffi::guillotine_get_code(self.inner.handle, addr_bytes.as_ptr(), &mut code_ptr, &mut code_len) {
                if code_ptr.is_null() || code_len == 0 {
                    Ok(Vec::new())
                } else {
                    let code = slice::from_raw_parts(code_ptr, code_len).to_vec();
                    ffi::guillotine_free_code(code_ptr, code_len);
                    Ok(code)
                }
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Set storage value for an address
    pub fn set_storage(&mut self, address: Address, key: U256, value: U256) -> Result<(), String> {
        let addr_bytes = **address;
        let key_bytes = u256_to_bytes_le(key);
        let value_bytes = u256_to_bytes_le(value);

        unsafe {
            if ffi::guillotine_set_storage(self.inner.handle, addr_bytes.as_ptr(), key_bytes.as_ptr(), value_bytes.as_ptr()) {
                Ok(())
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Get storage value for an address
    pub fn get_storage(&self, address: Address, key: U256) -> Result<U256, String> {
        let addr_bytes = **address;
        let key_bytes = u256_to_bytes_le(key);
        let mut value_bytes = [0u8; 32];

        unsafe {
            if ffi::guillotine_get_storage(self.inner.handle, addr_bytes.as_ptr(), key_bytes.as_ptr(), value_bytes.as_mut_ptr()) {
                Ok(bytes_to_u256_le(&value_bytes))
            } else {
                Err(get_last_error())
            }
        }
    }

    /// Execute a transaction
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

    /// Execute a transaction with specific call type
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
        let params = ffi::CallParams {
            caller: **from,
            to: to.map(|a| **a).unwrap_or([0; 20]),
            value: u256_to_bytes_le(value),
            input: input.as_ptr(),
            input_len: input.len(),
            gas: gas_limit,
            call_type: call_type as u8,
            salt: salt.unwrap_or([0; 32]),
        };

        unsafe {
            let result = if self.tracing {
                ffi::guillotine_call_tracing(self.inner.handle, &params)
            } else {
                ffi::guillotine_call(self.inner.handle, &params)
            };

            if result.is_null() {
                return Err(get_last_error());
            }

            let exec_result = convert_result(&*result);
            ffi::guillotine_free_result(result);
            exec_result
        }
    }

    /// Simulate a transaction (doesn't modify state)
    pub fn simulate(
        &self,
        from: Address,
        to: Option<Address>,
        value: U256,
        input: &[u8],
        gas_limit: u64,
    ) -> Result<ExecutionResult, String> {
        let params = ffi::CallParams {
            caller: **from,
            to: to.map(|a| **a).unwrap_or([0; 20]),
            value: u256_to_bytes_le(value),
            input: input.as_ptr(),
            input_len: input.len(),
            gas: gas_limit,
            call_type: CallType::Call as u8,
            salt: [0; 32],
        };

        unsafe {
            let result = ffi::guillotine_simulate(self.inner.handle, &params);
            
            if result.is_null() {
                return Err(get_last_error());
            }

            let exec_result = convert_result(&*result);
            ffi::guillotine_free_result(result);
            exec_result
        }
    }

    /// Create a new transaction builder
    pub fn transact(&mut self) -> TransactionBuilder<'_> {
        TransactionBuilder::new(self)
    }
}

impl Drop for EvmInner {
    fn drop(&mut self) {
        unsafe {
            // Use the appropriate destroy function based on tracing
            // Since we can't access tracing flag here, we'll use the non-tracing version
            // This is safe as the Zig code handles both types
            ffi::guillotine_evm_destroy(self.handle);
        }
    }
}

unsafe impl Send for Evm {}
unsafe impl Sync for Evm {}

/// Builder for configuring EVM instances
#[derive(Debug, Default)]
pub struct EvmBuilder {
    block_info: Option<ffi::BlockInfoFFI>,
    tracing: bool,
}

impl EvmBuilder {
    /// Create a new EVM builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the block info
    pub fn with_block_info(mut self, block_info: ffi::BlockInfoFFI) -> Self {
        self.block_info = Some(block_info);
        self
    }

    /// Enable tracing
    pub fn with_tracing(mut self) -> Self {
        self.tracing = true;
        self
    }

    /// Set the block number
    pub fn with_block_number(mut self, number: u64) -> Self {
        let mut block_info = self.block_info.unwrap_or_else(types::default_block_info);
        block_info.number = number;
        self.block_info = Some(block_info);
        self
    }

    /// Set the chain ID
    pub fn with_chain_id(mut self, chain_id: u64) -> Self {
        let mut block_info = self.block_info.unwrap_or_else(types::default_block_info);
        block_info.chain_id = chain_id;
        self.block_info = Some(block_info);
        self
    }

    /// Build the EVM instance
    pub fn build(self) -> Result<Evm, String> {
        let block_info = self.block_info.unwrap_or_else(types::default_block_info);
        
        if self.tracing {
            Evm::with_tracing(block_info)
        } else {
            Evm::with_block_info(block_info)
        }
    }
}

/// Transaction builder for fluent transaction construction
#[derive(Debug)]
pub struct TransactionBuilder<'a> {
    evm: &'a mut Evm,
    from: Option<Address>,
    to: Option<Address>,
    value: U256,
    input: Vec<u8>,
    gas_limit: u64,
    call_type: CallType,
    salt: Option<[u8; 32]>,
}

impl<'a> TransactionBuilder<'a> {
    fn new(evm: &'a mut Evm) -> Self {
        Self {
            evm,
            from: None,
            to: None,
            value: U256::ZERO,
            input: Vec::new(),
            gas_limit: 21000,
            call_type: CallType::Call,
            salt: None,
        }
    }

    /// Set the sender address
    pub fn from(mut self, address: Address) -> Self {
        self.from = Some(address);
        self
    }

    /// Set the recipient address
    pub fn to(mut self, address: Address) -> Self {
        self.to = Some(address);
        self
    }

    /// Set the value to transfer
    pub fn value(mut self, value: U256) -> Self {
        self.value = value;
        self
    }

    /// Set the input data
    pub fn input(mut self, input: Vec<u8>) -> Self {
        self.input = input;
        self
    }

    /// Set the gas limit
    pub fn gas_limit(mut self, gas_limit: u64) -> Self {
        self.gas_limit = gas_limit;
        self
    }

    /// Set the call type
    pub fn call_type(mut self, call_type: CallType) -> Self {
        self.call_type = call_type;
        self
    }

    /// Set the salt for CREATE2
    pub fn salt(mut self, salt: [u8; 32]) -> Self {
        self.salt = Some(salt);
        self
    }

    /// Execute the transaction
    pub fn execute(self) -> Result<ExecutionResult, String> {
        let from = self.from.ok_or("From address not specified")?;
        self.evm.execute_with_type(from, self.to, self.value, &self.input, self.gas_limit, self.call_type, self.salt)
    }

    /// Simulate the transaction (doesn't modify state)
    pub fn simulate(self) -> Result<ExecutionResult, String> {
        let from = self.from.ok_or("From address not specified")?;
        self.evm.simulate(from, self.to, self.value, &self.input, self.gas_limit)
    }
}

// Helper functions

fn u256_to_bytes_le(value: U256) -> [u8; 32] {
    value.to_le_bytes()
}

fn bytes_to_u256_le(bytes: &[u8; 32]) -> U256 {
    U256::from_le_bytes(*bytes)
}

fn get_last_error() -> String {
    unsafe {
        let error_ptr = ffi::guillotine_get_last_error();
        if error_ptr.is_null() {
            "Unknown error".to_string()
        } else {
            CStr::from_ptr(error_ptr).to_string_lossy().into_owned()
        }
    }
}

unsafe fn convert_result(result: &ffi::EvmResult) -> Result<ExecutionResult, String> {
    if result.success {
        let output = if result.output_len > 0 && !result.output.is_null() {
            slice::from_raw_parts(result.output, result.output_len).to_vec()
        } else {
            Vec::new()
        };

        let logs = if result.logs_len > 0 && !result.logs.is_null() {
            let log_slice = slice::from_raw_parts(result.logs, result.logs_len);
            log_slice.iter().map(|log| {
                let topics = if log.topics_len > 0 && !log.topics.is_null() {
                    let topic_slice = slice::from_raw_parts(log.topics, log.topics_len);
                    topic_slice.iter().map(|t| B256::from(*t)).collect()
                } else {
                    Vec::new()
                };

                let data = if log.data_len > 0 && !log.data.is_null() {
                    Bytes::from(slice::from_raw_parts(log.data, log.data_len).to_vec())
                } else {
                    Bytes::new()
                };

                Log::new(Address::from(log.address), topics, data)
            }).collect()
        } else {
            Vec::new()
        };

        let gas_used = result.gas_left.saturating_sub(result.gas_left);
        
        let mut exec_result = ExecutionResult::success(gas_used, output);
        exec_result.logs = logs;

        if result.has_created_address && result.created_address != [0; 20] {
            exec_result.created_address = Some(Address::from(result.created_address));
        }

        if result.trace_json_len > 0 && !result.trace_json.is_null() {
            let trace = slice::from_raw_parts(result.trace_json, result.trace_json_len);
            exec_result.trace_json = Some(String::from_utf8_lossy(trace).into_owned());
        }

        Ok(exec_result)
    } else {
        let error = if !result.error_message.is_null() {
            CStr::from_ptr(result.error_message).to_string_lossy().into_owned()
        } else {
            "Unknown error".to_string()
        };

        Err(error)
    }
}

/// Utility function to create an address from hex string
pub fn address_from_hex(hex: &str) -> Result<Address, &'static str> {
    let hex = hex.trim_start_matches("0x");
    let bytes = hex::decode(hex).map_err(|_| "Invalid hex address")?;
    
    if bytes.len() != 20 {
        return Err("Address must be 20 bytes");
    }
    
    let mut addr_bytes = [0u8; 20];
    addr_bytes.copy_from_slice(&bytes);
    Ok(Address::from(addr_bytes))
}

/// Utility function to parse bytecode from hex string
pub fn bytecode_from_hex(hex: &str) -> Result<Vec<u8>, &'static str> {
    let hex = hex.trim_start_matches("0x");
    hex::decode(hex).map_err(|_| "Invalid hex bytecode")
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_utility_functions() {
        // Test address parsing
        let addr = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        assert_eq!(addr, Address::from([0x11; 20]));
        
        // Test bytecode parsing
        let code = bytecode_from_hex("0x6060604052").unwrap();
        assert_eq!(code, vec![0x60, 0x60, 0x60, 0x40, 0x52]);
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_vm_with_block_info() {
        let mut block_info = types::default_block_info();
        block_info.number = 1000;
        block_info.timestamp = 1234567890;
        block_info.gas_limit = 8_000_000;
        block_info.chain_id = 1;
        
        let vm = Evm::with_block_info(block_info);
        assert!(vm.is_ok());
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_balance_operations() {
        let mut vm = Evm::new().unwrap();
        let addr = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        
        // Set balance
        vm.set_balance(addr, U256::from(1000000)).unwrap();
        
        // Get balance
        let balance = vm.get_balance(addr).unwrap();
        assert_eq!(balance, U256::from(1000000));
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_code_operations() {
        let mut vm = Evm::new().unwrap();
        let addr = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Simple bytecode: PUSH1 0x60 PUSH1 0x40 MSTORE
        let code = vec![0x60, 0x60, 0x60, 0x40, 0x52];
        
        // Set code
        vm.set_code(addr, &code).unwrap();
        
        // Get code
        let retrieved_code = vm.get_code(addr).unwrap();
        assert_eq!(retrieved_code, code);
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_storage_operations() {
        let mut vm = Evm::new().unwrap();
        let addr = address_from_hex("0x3333333333333333333333333333333333333333").unwrap();
        
        let key = U256::from(42);
        let value = U256::from(1337);
        
        // Set storage
        vm.set_storage(addr, key, value).unwrap();
        
        // Get storage
        let retrieved_value = vm.get_storage(addr, key).unwrap();
        assert_eq!(retrieved_value, value);
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_simple_transfer() {
        let mut vm = Evm::new().unwrap();
        let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Set balance for sender
        vm.set_balance(from, U256::from(1000000)).unwrap();
        
        // Execute simple transfer
        let result = vm.execute(from, Some(to), U256::from(1000), &[], 21000).unwrap();
        assert!(result.success);
        assert!(result.gas_used > 0);
        
        // Check balances after transfer
        let from_balance = vm.get_balance(from).unwrap();
        let to_balance = vm.get_balance(to).unwrap();
        assert_eq!(from_balance, U256::from(999000));
        assert_eq!(to_balance, U256::from(1000));
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_transaction_builder() {
        let mut vm = Evm::new().unwrap();
        let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Set balance for sender
        vm.set_balance(from, U256::from(1000000)).unwrap();
        
        // Execute using builder pattern
        let result = vm.transact()
            .from(from)
            .to(to)
            .value(U256::from(1000))
            .gas_limit(21000)
            .execute()
            .unwrap();
        
        assert!(result.success);
        assert!(result.gas_used > 0);
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_contract_deployment() {
        let mut vm = Evm::new().unwrap();
        let deployer = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        
        // Set balance for deployer
        vm.set_balance(deployer, U256::from(10000000)).unwrap();
        
        // Simple contract bytecode that returns 42
        // PUSH1 0x2a (42) PUSH1 0x00 MSTORE PUSH1 0x20 PUSH1 0x00 RETURN
        let init_code = vec![0x60, 0x2a, 0x60, 0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3];
        
        // Deploy contract
        let result = vm.transact()
            .from(deployer)
            .input(init_code)
            .gas_limit(100000)
            .call_type(CallType::Create)
            .execute()
            .unwrap();
        
        assert!(result.success);
        assert!(result.created_address.is_some());
        
        // Verify the deployed contract
        if let Some(contract_addr) = result.created_address {
            let code = vm.get_code(contract_addr).unwrap();
            assert!(!code.is_empty());
        }
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_simulation() {
        let mut vm = Evm::new().unwrap();
        let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Set balance for sender
        vm.set_balance(from, U256::from(1000000)).unwrap();
        
        // Simulate transaction
        let result = vm.transact()
            .from(from)
            .to(to)
            .value(U256::from(1000))
            .gas_limit(21000)
            .simulate()
            .unwrap();
        
        assert!(result.success);
        
        // Check that balances haven't changed (simulation doesn't modify state)
        let from_balance = vm.get_balance(from).unwrap();
        assert_eq!(from_balance, U256::from(1000000));
        
        let to_balance = vm.get_balance(to).unwrap();
        assert_eq!(to_balance, U256::ZERO);
    }

    #[test]
    #[ignore] // Requires FFI - will test later
    fn test_tracing() {
        let block_info = types::default_block_info();
        let mut vm = Evm::with_tracing(block_info).unwrap();
        
        let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Set balance for sender
        vm.set_balance(from, U256::from(1000000)).unwrap();
        
        // Execute with tracing
        let result = vm.execute(from, Some(to), U256::from(1000), &[], 21000).unwrap();
        assert!(result.success);
        
        // Trace might be available if tracing is enabled
        // (depends on the Zig implementation)
    }
}