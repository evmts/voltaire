//! # guillotine-rs
//! 
//! Safe Rust bindings for the Guillotine EVM - a high-performance Ethereum Virtual Machine
//! implementation written in Zig.
//! 
//! ## Example
//! 
//! ```no_run
//! use guillotine_rs::{Evm, EvmBuilder};
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

pub use types::ExecutionResult;

use std::ffi::CStr;
use std::ptr;
use std::slice;

/// Safe Rust wrapper for Guillotine EVM
#[derive(Debug)]
pub struct Evm {
    inner: EvmInner,
}

struct EvmInner {
    vm: *mut ffi::GuillotineVm,
}

impl std::fmt::Debug for EvmInner {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        f.debug_struct("EvmInner")
            .field("vm", &"<opaque>")
            .finish()
    }
}

impl Evm {
    /// Create a new Guillotine EVM instance
    pub fn new() -> Result<Self, &'static str> {
        unsafe {
            let vm = ffi::guillotine_vm_create();
            if vm.is_null() {
                Err("Failed to create Guillotine VM")
            } else {
                Ok(Self {
                    inner: EvmInner { vm },
                })
            }
        }
    }

    /// Set balance for an address
    pub fn set_balance(&mut self, address: Address, balance: U256) -> Result<(), &'static str> {
        let addr = ffi::GuillotineAddress {
            bytes: **address,
        };
        
        let balance_bytes = balance.to_le_bytes::<32>();
        
        let balance_u256 = ffi::GuillotineU256 {
            bytes: balance_bytes,
        };

        unsafe {
            if ffi::guillotine_set_balance(self.inner.vm, &addr, &balance_u256) {
                Ok(())
            } else {
                Err("Failed to set balance")
            }
        }
    }

    /// Set code for an address
    pub fn set_code(&mut self, address: Address, code: &[u8]) -> Result<(), &'static str> {
        let addr = ffi::GuillotineAddress {
            bytes: **address,
        };

        unsafe {
            if ffi::guillotine_set_code(self.inner.vm, &addr, code.as_ptr(), code.len()) {
                Ok(())
            } else {
                Err("Failed to set code")
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
        let from_addr = ffi::GuillotineAddress {
            bytes: **from,
        };

        let to_addr = to.map(|addr| ffi::GuillotineAddress {
            bytes: **addr,
        });

        let value_bytes = value.to_le_bytes::<32>();
        
        let value_u256 = ffi::GuillotineU256 {
            bytes: value_bytes,
        };

        unsafe {
            let result = ffi::guillotine_vm_execute(
                self.inner.vm,
                &from_addr,
                to_addr.as_ref().map(|a| a as *const _).unwrap_or(ptr::null()),
                &value_u256,
                input.as_ptr(),
                input.len(),
                gas_limit,
            );

            if result.success {
                let output = if result.output_len > 0 && !result.output.is_null() {
                    slice::from_raw_parts(result.output, result.output_len).to_vec()
                } else {
                    Vec::new()
                };

                Ok(ExecutionResult {
                    success: true,
                    gas_used: result.gas_used,
                    output,
                    logs: Vec::new(),
                })
            } else {
                let error = if !result.error_message.is_null() {
                    CStr::from_ptr(result.error_message).to_string_lossy().into_owned()
                } else {
                    "Unknown error".to_string()
                };

                Err(error)
            }
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
            ffi::guillotine_vm_destroy(self.vm);
        }
    }
}

unsafe impl Send for Evm {}
unsafe impl Sync for Evm {}

/// Builder for configuring EVM instances
#[derive(Debug, Default)]
pub struct EvmBuilder {
    gas_limit: Option<u64>,
}

impl EvmBuilder {
    /// Create a new EVM builder
    pub fn new() -> Self {
        Self::default()
    }

    /// Set the default gas limit
    pub fn with_gas_limit(mut self, gas_limit: u64) -> Self {
        self.gas_limit = Some(gas_limit);
        self
    }

    /// Build the EVM instance
    pub fn build(self) -> Result<Evm, &'static str> {
        Evm::new()
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

    /// Execute the transaction
    pub fn execute(self) -> Result<ExecutionResult, String> {
        let from = self.from.ok_or("From address not specified")?;
        self.evm.execute(from, self.to, self.value, &self.input, self.gas_limit)
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

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_vm_creation() {
        let vm = Evm::new();
        assert!(vm.is_ok());
    }

    #[test]
    fn test_simple_execution() {
        let mut vm = Evm::new().unwrap();
        let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
        let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
        
        // Set balance for sender
        vm.set_balance(from, U256::from(1000000)).unwrap();
        
        // Execute simple transfer
        let result = vm.execute(from, Some(to), U256::from(1000), &[], 21000).unwrap();
        assert!(result.success);
        assert!(result.gas_used > 0);
    }

    #[test]
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
}