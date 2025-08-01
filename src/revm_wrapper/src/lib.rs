use revm::{
    Database,
    db::{CacheDB, EmptyDB},
    primitives::{
        address, Address, Bytecode, Bytes, ExecutionResult as RevmExecutionResult, B256, U256,
    },
    Evm, InMemoryDB,
};
use std::collections::HashMap;
use std::ffi::{c_char, CStr, CString};
use std::ptr;

/// Error codes for C interop
#[repr(C)]
pub enum RevmErrorCode {
    Success = 0,
    InvalidInput = 1,
    ExecutionError = 2,
    StateError = 3,
    MemoryError = 4,
    Unknown = 99,
}

/// Error structure for C interop
#[repr(C)]
pub struct RevmError {
    pub message: *mut c_char,
    pub code: i32,
}

impl RevmError {
    fn new(code: RevmErrorCode, message: String) -> *mut Self {
        let error = Box::new(RevmError {
            message: CString::new(message).unwrap().into_raw(),
            code: code as i32,
        });
        Box::into_raw(error)
    }
}

/// Settings for the REVM execution
#[repr(C)]
#[derive(Copy, Clone)]
pub struct RevmSettings {
    pub gas_limit: u64,
    pub chain_id: u64,
    pub block_number: u64,
    pub block_timestamp: u64,
    pub block_gas_limit: u64,
    pub block_difficulty: u64,
    pub block_basefee: u64,
    pub coinbase: [u8; 20],
}

impl Default for RevmSettings {
    fn default() -> Self {
        RevmSettings {
            gas_limit: 30_000_000,
            chain_id: 1,
            block_number: 0,
            block_timestamp: 0,
            block_gas_limit: 30_000_000,
            block_difficulty: 0,
            block_basefee: 0,
            coinbase: [0; 20],
        }
    }
}

/// Execution result from REVM
#[repr(C)]
pub struct ExecutionResult {
    pub success: bool,
    pub gas_used: u64,
    pub gas_refunded: u64,
    pub output_data: *mut u8,
    pub output_len: usize,
    pub logs_count: usize,
    pub revert_reason: *mut c_char,
}

/// Main REVM wrapper struct
pub struct RevmVm {
    db: CacheDB<EmptyDB>,
    settings: RevmSettings,
}

/// Create a new REVM instance
#[no_mangle]
pub unsafe extern "C" fn revm_new(
    settings: *const RevmSettings,
    out_error: *mut *mut RevmError,
) -> *mut RevmVm {
    *out_error = ptr::null_mut();

    if settings.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Settings cannot be null".to_string(),
        );
        return ptr::null_mut();
    }

    let settings = *settings;
    let db = CacheDB::new(EmptyDB::default());

    let vm = Box::new(RevmVm { db, settings });

    Box::into_raw(vm)
}

/// Free a REVM instance
#[no_mangle]
pub unsafe extern "C" fn revm_free(vm: *mut RevmVm) {
    if !vm.is_null() {
        let _ = Box::from_raw(vm);
    }
}

/// Set account balance
#[no_mangle]
pub unsafe extern "C" fn revm_set_balance(
    vm: *mut RevmVm,
    address: *const u8,
    balance_hex: *const c_char,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();

    if vm.is_null() || address.is_null() || balance_hex.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let addr_bytes = std::slice::from_raw_parts(address, 20);
    let addr = Address::from_slice(addr_bytes);

    let balance_str = match CStr::from_ptr(balance_hex).to_str() {
        Ok(s) => s,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid balance string encoding".to_string(),
            );
            return 0;
        }
    };

    let balance_str = balance_str.trim_start_matches("0x");
    let balance = match U256::from_str_radix(balance_str, 16) {
        Ok(b) => b,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid balance value".to_string(),
            );
            return 0;
        }
    };

    let account_info = revm::primitives::AccountInfo {
        balance,
        nonce: 0,
        code_hash: revm::primitives::KECCAK_EMPTY,
        code: None,
    };
    vm.db.insert_account_info(addr, account_info);

    1
}

/// Set account code
#[no_mangle]
pub unsafe extern "C" fn revm_set_code(
    vm: *mut RevmVm,
    address: *const u8,
    code_hex: *const c_char,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();

    if vm.is_null() || address.is_null() || code_hex.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let addr_bytes = std::slice::from_raw_parts(address, 20);
    let addr = Address::from_slice(addr_bytes);

    let code_str = match CStr::from_ptr(code_hex).to_str() {
        Ok(s) => s,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid code string encoding".to_string(),
            );
            return 0;
        }
    };

    let code_str = code_str.trim_start_matches("0x");
    let code_bytes = match hex::decode(code_str) {
        Ok(bytes) => bytes,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid hex code".to_string(),
            );
            return 0;
        }
    };

    let bytecode = Bytecode::new_raw(Bytes::from(code_bytes));
    let mut account_info = vm.db.basic(addr).unwrap_or_default().unwrap_or_default();
    account_info.code = Some(bytecode);
    vm.db.insert_account_info(addr, account_info);

    1
}

/// Set storage value
#[no_mangle]
pub unsafe extern "C" fn revm_set_storage(
    vm: *mut RevmVm,
    address: *const u8,
    slot_hex: *const c_char,
    value_hex: *const c_char,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();

    if vm.is_null() || address.is_null() || slot_hex.is_null() || value_hex.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let addr_bytes = std::slice::from_raw_parts(address, 20);
    let addr = Address::from_slice(addr_bytes);

    let slot_str = match CStr::from_ptr(slot_hex).to_str() {
        Ok(s) => s.trim_start_matches("0x"),
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid slot string encoding".to_string(),
            );
            return 0;
        }
    };

    let value_str = match CStr::from_ptr(value_hex).to_str() {
        Ok(s) => s.trim_start_matches("0x"),
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid value string encoding".to_string(),
            );
            return 0;
        }
    };

    let slot = match U256::from_str_radix(slot_str, 16) {
        Ok(s) => s,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid storage slot".to_string(),
            );
            return 0;
        }
    };

    let value = match U256::from_str_radix(value_str, 16) {
        Ok(v) => v,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid storage value".to_string(),
            );
            return 0;
        }
    };

    vm.db.insert_account_storage(addr, slot, value);

    1
}

/// Execute a transaction
#[no_mangle]
pub unsafe extern "C" fn revm_execute(
    vm: *mut RevmVm,
    from: *const u8,
    to: *const u8,
    value_hex: *const c_char,
    input_data: *const u8,
    input_len: usize,
    gas_limit: u64,
    out_result: *mut *mut ExecutionResult,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();
    *out_result = ptr::null_mut();

    if vm.is_null() || from.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let from_bytes = std::slice::from_raw_parts(from, 20);
    let from_addr = Address::from_slice(from_bytes);

    let to_addr = if to.is_null() {
        None
    } else {
        let to_bytes = std::slice::from_raw_parts(to, 20);
        Some(Address::from_slice(to_bytes))
    };

    let value = if value_hex.is_null() {
        U256::ZERO
    } else {
        let value_str = match CStr::from_ptr(value_hex).to_str() {
            Ok(s) => s.trim_start_matches("0x"),
            Err(_) => {
                *out_error = RevmError::new(
                    RevmErrorCode::InvalidInput,
                    "Invalid value string encoding".to_string(),
                );
                return 0;
            }
        };

        match U256::from_str_radix(value_str, 16) {
            Ok(v) => v,
            Err(_) => {
                *out_error = RevmError::new(
                    RevmErrorCode::InvalidInput,
                    "Invalid value".to_string(),
                );
                return 0;
            }
        }
    };

    let input = if input_data.is_null() || input_len == 0 {
        Bytes::new()
    } else {
        let data = std::slice::from_raw_parts(input_data, input_len);
        Bytes::from(data.to_vec())
    };

    // Build and execute EVM
    let mut evm = Evm::builder()
        .with_db(&mut vm.db)
        .modify_block_env(|block| {
            block.number = U256::from(vm.settings.block_number);
            block.timestamp = U256::from(vm.settings.block_timestamp);
            block.gas_limit = U256::from(vm.settings.block_gas_limit);
            block.difficulty = U256::from(vm.settings.block_difficulty);
            block.basefee = U256::from(vm.settings.block_basefee);
            block.coinbase = Address::from_slice(&vm.settings.coinbase);
        })
        .modify_cfg_env(|cfg| {
            cfg.chain_id = vm.settings.chain_id;
        })
        .modify_tx_env(|tx| {
            tx.caller = from_addr;
            tx.transact_to = if let Some(to) = to_addr {
                revm::primitives::TxKind::Call(to)
            } else {
                revm::primitives::TxKind::Create
            };
            tx.value = value;
            tx.data = input;
            tx.gas_limit = gas_limit;
            // Use 0 gas price for calls (like main.rs benchmark), 1 wei for contract creation
            tx.gas_price = if to_addr.is_some() { 
                U256::ZERO // Free gas for calls
            } else { 
                U256::from(1u64) // 1 wei for contract creation
            };
        })
        .build();

    let result = match evm.transact_commit() {
        Ok(res) => res,
        Err(e) => {
            *out_error = RevmError::new(
                RevmErrorCode::ExecutionError,
                format!("Execution failed: {:?}", e),
            );
            return 0;
        }
    };

    // Convert result
    let (success, gas_used, gas_refunded, output, revert_reason) = match result {
        RevmExecutionResult::Success {
            gas_used,
            gas_refunded,
            output,
            ..
        } => {
            let output_bytes = match output {
                revm::primitives::Output::Call(bytes) => bytes,
                revm::primitives::Output::Create(bytes, _) => bytes,
            };
            (true, gas_used, gas_refunded, output_bytes, None)
        }
        RevmExecutionResult::Revert { gas_used, output } => {
            let reason = if output.len() > 4 {
                // Try to decode revert reason
                String::from_utf8_lossy(&output[4..]).to_string()
            } else {
                "Execution reverted".to_string()
            };
            (false, gas_used, 0, output, Some(reason))
        }
        RevmExecutionResult::Halt { reason, gas_used } => {
            let reason = format!("Execution halted: {:?}", reason);
            (false, gas_used, 0, Bytes::new(), Some(reason))
        }
    };

    // Create result
    let mut output_vec = output.to_vec();
    let output_ptr = if output_vec.is_empty() {
        ptr::null_mut()
    } else {
        let ptr = output_vec.as_mut_ptr();
        std::mem::forget(output_vec);
        ptr
    };

    let revert_ptr = revert_reason
        .and_then(|r| CString::new(r).ok())
        .map(|cstr| cstr.into_raw())
        .unwrap_or(ptr::null_mut());

    let exec_result = Box::new(ExecutionResult {
        success,
        gas_used,
        gas_refunded,
        output_data: output_ptr,
        output_len: output.len(),
        logs_count: 0, // TODO: Implement logs
        revert_reason: revert_ptr,
    });

    *out_result = Box::into_raw(exec_result);
    1
}

/// Get error message
#[no_mangle]
pub unsafe extern "C" fn revm_get_error_message(error: *const RevmError) -> *const c_char {
    if error.is_null() {
        return ptr::null();
    }
    (*error).message
}

/// Free an error
#[no_mangle]
pub unsafe extern "C" fn revm_free_error(error: *mut RevmError) {
    if !error.is_null() {
        let error = Box::from_raw(error);
        if !error.message.is_null() {
            let _ = CString::from_raw(error.message);
        }
    }
}

/// Free an execution result
#[no_mangle]
pub unsafe extern "C" fn revm_free_result(result: *mut ExecutionResult) {
    if !result.is_null() {
        let result = Box::from_raw(result);
        if !result.output_data.is_null() {
            let _ = Vec::from_raw_parts(result.output_data, result.output_len, result.output_len);
        }
        if !result.revert_reason.is_null() {
            let _ = CString::from_raw(result.revert_reason);
        }
    }
}

/// Get storage value
#[no_mangle]
pub unsafe extern "C" fn revm_get_storage(
    vm: *mut RevmVm,
    address: *const u8,
    slot_hex: *const c_char,
    out_value: *mut c_char,
    out_value_len: usize,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();

    if vm.is_null() || address.is_null() || slot_hex.is_null() || out_value.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let addr_bytes = std::slice::from_raw_parts(address, 20);
    let addr = Address::from_slice(addr_bytes);

    let slot_str = match CStr::from_ptr(slot_hex).to_str() {
        Ok(s) => s.trim_start_matches("0x"),
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid slot string encoding".to_string(),
            );
            return 0;
        }
    };

    let slot = match U256::from_str_radix(slot_str, 16) {
        Ok(s) => s,
        Err(_) => {
            *out_error = RevmError::new(
                RevmErrorCode::InvalidInput,
                "Invalid storage slot".to_string(),
            );
            return 0;
        }
    };

    let mut db = &mut vm.db;
    let value = db.storage(addr, slot).unwrap_or_default();
    let value_hex = format!("0x{:064x}", value);

    if value_hex.len() + 1 > out_value_len {
        *out_error = RevmError::new(
            RevmErrorCode::MemoryError,
            "Output buffer too small".to_string(),
        );
        return 0;
    }

    let c_value = CString::new(value_hex).unwrap();
    let bytes = c_value.as_bytes_with_nul();
    std::ptr::copy_nonoverlapping(bytes.as_ptr() as *const c_char, out_value, bytes.len());

    1
}

/// Get account balance
#[no_mangle]
pub unsafe extern "C" fn revm_get_balance(
    vm: *mut RevmVm,
    address: *const u8,
    out_balance: *mut c_char,
    out_balance_len: usize,
    out_error: *mut *mut RevmError,
) -> i32 {
    *out_error = ptr::null_mut();

    if vm.is_null() || address.is_null() || out_balance.is_null() {
        *out_error = RevmError::new(
            RevmErrorCode::InvalidInput,
            "Invalid input parameters".to_string(),
        );
        return 0;
    }

    let vm = &mut *vm;
    let addr_bytes = std::slice::from_raw_parts(address, 20);
    let addr = Address::from_slice(addr_bytes);

    let mut db = &mut vm.db;
    let account_info = db.basic(addr).unwrap_or_default().unwrap_or_default();
    let balance_hex = format!("0x{:064x}", account_info.balance);

    if balance_hex.len() + 1 > out_balance_len {
        *out_error = RevmError::new(
            RevmErrorCode::MemoryError,
            "Output buffer too small".to_string(),
        );
        return 0;
    }

    let c_balance = CString::new(balance_hex).unwrap();
    let bytes = c_balance.as_bytes_with_nul();
    std::ptr::copy_nonoverlapping(bytes.as_ptr() as *const c_char, out_balance, bytes.len());

    1
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_revm_creation() {
        unsafe {
            let settings = RevmSettings::default();
            let mut error: *mut RevmError = ptr::null_mut();

            let vm = revm_new(&settings, &mut error);
            assert!(!vm.is_null());
            assert!(error.is_null());

            revm_free(vm);
        }
    }

    #[test]
    fn test_set_and_get_balance() {
        unsafe {
            let settings = RevmSettings::default();
            let mut error: *mut RevmError = ptr::null_mut();

            let vm = revm_new(&settings, &mut error);
            assert!(!vm.is_null());

            let address = [1u8; 20];
            let balance = CString::new("0x1234567890abcdef").unwrap();

            let success = revm_set_balance(vm, address.as_ptr(), balance.as_ptr(), &mut error);
            assert_eq!(success, 1);
            assert!(error.is_null());

            let mut out_balance = [0u8; 100];
            let success = revm_get_balance(
                vm,
                address.as_ptr(),
                out_balance.as_mut_ptr() as *mut c_char,
                out_balance.len(),
                &mut error,
            );
            assert_eq!(success, 1);
            assert!(error.is_null());

            let result = CStr::from_ptr(out_balance.as_ptr() as *const c_char)
                .to_str()
                .unwrap();
            assert_eq!(
                result,
                "0x0000000000000000000000000000000000000000000000001234567890abcdef"
            );

            revm_free(vm);
        }
    }
}