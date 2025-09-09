//! Low-level FFI bindings to Guillotine EVM
//!
//! This module provides both auto-generated and manual bindings for the stateful FFI interface.
//! All unsafe code is isolated here and wrapped in safe abstractions in the parent module.

#![allow(non_upper_case_globals)]
#![allow(non_camel_case_types)]
#![allow(non_snake_case)]
#![allow(dead_code)]
#![allow(improper_ctypes)]

use std::os::raw::{c_char, c_void};

// Include the auto-generated bindings from bindgen
include!(concat!(env!("OUT_DIR"), "/bindings.rs"));

// Additional stateful FFI bindings for zero-copy interface

#[repr(C)]
pub struct FfiSlice {
    pub ptr: *const u8,
    pub len: usize,
}

impl FfiSlice {
    pub fn from_slice(slice: &[u8]) -> Self {
        Self {
            ptr: slice.as_ptr(),
            len: slice.len(),
        }
    }
    
    pub unsafe fn to_slice(&self) -> &[u8] {
        if self.len == 0 {
            &[]
        } else {
            std::slice::from_raw_parts(self.ptr, self.len)
        }
    }
}

#[repr(C)]
pub struct FfiCallParams {
    pub caller: [u8; 20],
    pub to: [u8; 20],
    pub value: [u8; 32],
    pub input: FfiSlice,
    pub gas: u64,
    pub call_type: u8,
    pub salt: [u8; 32],
}

#[repr(C)]
pub struct FfiExecutionResult {
    pub success: bool,
    pub gas_left: u64,
    pub output: FfiSlice,
    pub logs_ptr: *const FfiLog,
    pub logs_len: usize,
    pub created_address: [u8; 20],
    pub has_created_address: bool,
}

#[repr(C)]
pub struct FfiLog {
    pub address: [u8; 20],
    pub topics: FfiSlice,
    pub data: FfiSlice,
}

#[repr(C)]
pub struct FfiBatchOperation {
    pub op_type: u8,
    pub address: [u8; 20],
    pub key: [u8; 32],
    pub value: FfiSlice,
}

extern "C" {
    // Stateful FFI functions
    pub fn guillotine_ffi_init();
    pub fn guillotine_ffi_cleanup();
    
    pub fn guillotine_ffi_create_stateful(
        block_number: u64,
        block_timestamp: u64,
        block_gas_limit: u64,
        coinbase: *const [u8; 20],
        base_fee: u64,
        chain_id: u64,
    ) -> usize;
    
    pub fn guillotine_ffi_reset_state(handle: usize) -> bool;
    pub fn guillotine_ffi_destroy_instance(handle: usize);
    
    pub fn guillotine_ffi_set_balance(
        handle: usize,
        address: *const [u8; 20],
        balance: *const [u8; 32],
    ) -> bool;
    
    pub fn guillotine_ffi_set_code(
        handle: usize,
        address: *const [u8; 20],
        code: FfiSlice,
    ) -> bool;
    
    pub fn guillotine_ffi_execute(
        handle: usize,
        params: *const FfiCallParams,
        result: *mut FfiExecutionResult,
    ) -> bool;
    
    pub fn guillotine_ffi_batch_state_updates(
        handle: usize,
        ops: *const FfiBatchOperation,
        ops_count: usize,
    ) -> bool;
    
    pub fn guillotine_ffi_get_last_error() -> *const c_char;
}