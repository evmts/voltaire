//! Low-level FFI bindings to Guillotine EVM
//!
//! This module contains all unsafe FFI calls to the Guillotine EVM implementation.
//! All unsafe code is isolated here and wrapped in safe abstractions in the parent module.

use std::os::raw::c_char;

// Opaque pointer types
#[repr(C)]
pub struct GuillotineVm {
    _private: [u8; 0],
}

// C-compatible types
#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct GuillotineAddress {
    pub bytes: [u8; 20],
}

#[repr(C)]
#[derive(Debug, Clone, Copy)]
pub struct GuillotineU256 {
    pub bytes: [u8; 32], // Little-endian representation
}

#[repr(C)]
#[derive(Debug)]
pub struct GuillotineExecutionResult {
    pub success: bool,
    pub gas_used: u64,
    pub output: *mut u8,
    pub output_len: usize,
    pub error_message: *const c_char,
}

extern "C" {
    // VM creation and destruction
    pub fn guillotine_vm_create() -> *mut GuillotineVm;
    pub fn guillotine_vm_destroy(vm: *mut GuillotineVm);

    // State management
    pub fn guillotine_set_balance(
        vm: *mut GuillotineVm,
        address: *const GuillotineAddress,
        balance: *const GuillotineU256,
    ) -> bool;

    pub fn guillotine_set_code(
        vm: *mut GuillotineVm,
        address: *const GuillotineAddress,
        code: *const u8,
        code_len: usize,
    ) -> bool;

    // Execution
    pub fn guillotine_vm_execute(
        vm: *mut GuillotineVm,
        from: *const GuillotineAddress,
        to: *const GuillotineAddress,
        value: *const GuillotineU256,
        input: *const u8,
        input_len: usize,
        gas_limit: u64,
    ) -> GuillotineExecutionResult;

    // Utility functions
    pub fn guillotine_u256_from_u64(value: u64, u256: *mut GuillotineU256);
}