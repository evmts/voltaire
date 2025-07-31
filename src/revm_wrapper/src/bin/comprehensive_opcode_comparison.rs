use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, U256, B256,
        Output, TxKind, SpecId,
    },
    Evm,
    inspectors::TracerEip3155,
};
use std::process::Command;
use std::io::Write;

// FFI declarations for our Zig EVM
#[repr(C)]
struct ZigEvm {
    _private: [u8; 0],
}

#[repr(C)]
struct ZigFrame {
    _private: [u8; 0],
}

#[repr(C)]
struct ZigU256 {
    words: [u64; 4],
}

impl From<U256> for ZigU256 {
    fn from(value: U256) -> Self {
        let bytes = value.to_be_bytes::<32>();
        let mut words = [0u64; 4];
        for i in 0..4 {
            let mut word_bytes = [0u8; 8];
            word_bytes.copy_from_slice(&bytes[i*8..(i+1)*8]);
            words[3-i] = u64::from_be_bytes(word_bytes);
        }
        ZigU256 { words }
    }
}

impl From<ZigU256> for U256 {
    fn from(value: ZigU256) -> Self {
        let mut bytes = [0u8; 32];
        for i in 0..4 {
            let word_bytes = value.words[3-i].to_be_bytes();
            bytes[i*8..(i+1)*8].copy_from_slice(&word_bytes);
        }
        U256::from_be_bytes(bytes)
    }
}

#[link(name = "bn254_wrapper", kind = "static")]
extern "C" {}

#[link(name = "guillotine_opcode_test", kind = "static")]
extern "C" {
    fn zigEvmCreate() -> *mut ZigEvm;
    fn zigEvmDestroy(evm: *mut ZigEvm);
    fn zigFrameCreate(evm: *mut ZigEvm) -> *mut ZigFrame;
    fn zigFrameDestroy(frame: *mut ZigFrame);
    fn zigStackPush(frame: *mut ZigFrame, value: ZigU256);
    fn zigStackPop(frame: *mut ZigFrame) -> ZigU256;
    fn zigStackSize(frame: *mut ZigFrame) -> usize;
    fn zigExecuteOpcode(evm: *mut ZigEvm, frame: *mut ZigFrame, opcode: u8) -> i32;
    fn zigGetGasRemaining(frame: *mut ZigFrame) -> u64;
    fn zigSetGasRemaining(frame: *mut ZigFrame, gas: u64);
}

struct OpcodeTest {
    name: &'static str,
    opcode: u8,
    stack_input: Vec<U256>,
    expected_output: Vec<U256>,
    expected_gas_used: Option<u64>,
}

fn main() {
    println!("=== Comprehensive Opcode Comparison: Zig EVM vs REVM ===\n");
    
    let mut total_passed = 0;
    let mut total_failed = 0;
    
    // Arithmetic opcodes tests
    let arithmetic_tests = vec![
        // ADD tests
        OpcodeTest {
            name: "ADD: 5 + 10 = 15",
            opcode: 0x01,
            stack_input: vec![U256::from(5), U256::from(10)],
            expected_output: vec![U256::from(15)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "ADD: MAX + 1 = 0 (overflow)",
            opcode: 0x01,
            stack_input: vec![U256::MAX, U256::from(1)],
            expected_output: vec![U256::ZERO],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "ADD: 0 + 42 = 42",
            opcode: 0x01,
            stack_input: vec![U256::from(0), U256::from(42)],
            expected_output: vec![U256::from(42)],
            expected_gas_used: Some(3),
        },
        
        // SUB tests
        OpcodeTest {
            name: "SUB: 100 - 58 = 42",
            opcode: 0x03,
            stack_input: vec![U256::from(100), U256::from(58)],
            expected_output: vec![U256::from(42)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "SUB: 5 - 10 = MAX-4 (underflow)",
            opcode: 0x03,
            stack_input: vec![U256::from(5), U256::from(10)],
            expected_output: vec![U256::MAX - U256::from(4)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "SUB: 42 - 0 = 42",
            opcode: 0x03,
            stack_input: vec![U256::from(42), U256::from(0)],
            expected_output: vec![U256::from(42)],
            expected_gas_used: Some(3),
        },
        
        // MUL tests
        OpcodeTest {
            name: "MUL: 7 * 6 = 42",
            opcode: 0x02,
            stack_input: vec![U256::from(7), U256::from(6)],
            expected_output: vec![U256::from(42)],
            expected_gas_used: Some(5),
        },
        OpcodeTest {
            name: "MUL: 0 * 42 = 0",
            opcode: 0x02,
            stack_input: vec![U256::from(0), U256::from(42)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(5),
        },
        
        // DIV tests
        OpcodeTest {
            name: "DIV: 84 / 2 = 42",
            opcode: 0x04,
            stack_input: vec![U256::from(84), U256::from(2)],
            expected_output: vec![U256::from(42)],
            expected_gas_used: Some(5),
        },
        OpcodeTest {
            name: "DIV: 10 / 0 = 0 (division by zero)",
            opcode: 0x04,
            stack_input: vec![U256::from(10), U256::from(0)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(5),
        },
        
        // MOD tests
        OpcodeTest {
            name: "MOD: 17 % 5 = 2",
            opcode: 0x06,
            stack_input: vec![U256::from(17), U256::from(5)],
            expected_output: vec![U256::from(2)],
            expected_gas_used: Some(5),
        },
        OpcodeTest {
            name: "MOD: 10 % 0 = 0 (mod by zero)",
            opcode: 0x06,
            stack_input: vec![U256::from(10), U256::from(0)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(5),
        },
        
        // ADDMOD tests
        OpcodeTest {
            name: "ADDMOD: (10 + 10) % 8 = 4",
            opcode: 0x08,
            stack_input: vec![U256::from(10), U256::from(10), U256::from(8)],
            expected_output: vec![U256::from(4)],
            expected_gas_used: Some(8),
        },
        
        // MULMOD tests
        OpcodeTest {
            name: "MULMOD: (10 * 10) % 8 = 4",
            opcode: 0x09,
            stack_input: vec![U256::from(10), U256::from(10), U256::from(8)],
            expected_output: vec![U256::from(4)],
            expected_gas_used: Some(8),
        },
        
        // EXP tests
        OpcodeTest {
            name: "EXP: 2 ** 3 = 8",
            opcode: 0x0A,
            stack_input: vec![U256::from(2), U256::from(3)],
            expected_output: vec![U256::from(8)],
            expected_gas_used: None, // EXP gas is dynamic
        },
        
        // SIGNEXTEND tests
        OpcodeTest {
            name: "SIGNEXTEND: extend 0xFF from byte 0",
            opcode: 0x0B,
            stack_input: vec![U256::from(0), U256::from(0xFF)],
            expected_output: vec![U256::MAX],
            expected_gas_used: Some(5),
        },
    ];
    
    // Comparison opcodes tests
    let comparison_tests = vec![
        // LT tests
        OpcodeTest {
            name: "LT: 5 < 10 = 1",
            opcode: 0x10,
            stack_input: vec![U256::from(5), U256::from(10)],
            expected_output: vec![U256::from(1)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "LT: 10 < 5 = 0",
            opcode: 0x10,
            stack_input: vec![U256::from(10), U256::from(5)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(3),
        },
        
        // GT tests
        OpcodeTest {
            name: "GT: 10 > 5 = 1",
            opcode: 0x11,
            stack_input: vec![U256::from(5), U256::from(10)],
            expected_output: vec![U256::from(1)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "GT: 5 > 10 = 0",
            opcode: 0x11,
            stack_input: vec![U256::from(10), U256::from(5)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(3),
        },
        
        // EQ tests
        OpcodeTest {
            name: "EQ: 42 == 42 = 1",
            opcode: 0x14,
            stack_input: vec![U256::from(42), U256::from(42)],
            expected_output: vec![U256::from(1)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "EQ: 42 == 43 = 0",
            opcode: 0x14,
            stack_input: vec![U256::from(42), U256::from(43)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(3),
        },
        
        // ISZERO tests
        OpcodeTest {
            name: "ISZERO: 0 = 1",
            opcode: 0x15,
            stack_input: vec![U256::from(0)],
            expected_output: vec![U256::from(1)],
            expected_gas_used: Some(3),
        },
        OpcodeTest {
            name: "ISZERO: 1 = 0",
            opcode: 0x15,
            stack_input: vec![U256::from(1)],
            expected_output: vec![U256::from(0)],
            expected_gas_used: Some(3),
        },
    ];
    
    // Bitwise opcodes tests
    let bitwise_tests = vec![
        // AND tests
        OpcodeTest {
            name: "AND: 0xFF & 0x0F = 0x0F",
            opcode: 0x16,
            stack_input: vec![U256::from(0xFF), U256::from(0x0F)],
            expected_output: vec![U256::from(0x0F)],
            expected_gas_used: Some(3),
        },
        
        // OR tests
        OpcodeTest {
            name: "OR: 0xF0 | 0x0F = 0xFF",
            opcode: 0x17,
            stack_input: vec![U256::from(0xF0), U256::from(0x0F)],
            expected_output: vec![U256::from(0xFF)],
            expected_gas_used: Some(3),
        },
        
        // XOR tests
        OpcodeTest {
            name: "XOR: 0xFF ^ 0xF0 = 0x0F",
            opcode: 0x18,
            stack_input: vec![U256::from(0xFF), U256::from(0xF0)],
            expected_output: vec![U256::from(0x0F)],
            expected_gas_used: Some(3),
        },
        
        // NOT tests
        OpcodeTest {
            name: "NOT: ~0 = MAX",
            opcode: 0x19,
            stack_input: vec![U256::from(0)],
            expected_output: vec![U256::MAX],
            expected_gas_used: Some(3),
        },
        
        // SHL tests
        OpcodeTest {
            name: "SHL: 1 << 4 = 16",
            opcode: 0x1B,
            stack_input: vec![U256::from(4), U256::from(1)],
            expected_output: vec![U256::from(16)],
            expected_gas_used: Some(3),
        },
        
        // SHR tests
        OpcodeTest {
            name: "SHR: 16 >> 4 = 1",
            opcode: 0x1C,
            stack_input: vec![U256::from(4), U256::from(16)],
            expected_output: vec![U256::from(1)],
            expected_gas_used: Some(3),
        },
    ];
    
    println!("Testing Arithmetic Opcodes:");
    println!("==========================");
    for test in &arithmetic_tests {
        if run_comparison_test(test) {
            total_passed += 1;
        } else {
            total_failed += 1;
        }
    }
    
    println!("\nTesting Comparison Opcodes:");
    println!("===========================");
    for test in &comparison_tests {
        if run_comparison_test(test) {
            total_passed += 1;
        } else {
            total_failed += 1;
        }
    }
    
    println!("\nTesting Bitwise Opcodes:");
    println!("========================");
    for test in &bitwise_tests {
        if run_comparison_test(test) {
            total_passed += 1;
        } else {
            total_failed += 1;
        }
    }
    
    println!("\n=== Final Summary ===");
    println!("Total Passed: {}", total_passed);
    println!("Total Failed: {}", total_failed);
    
    if total_failed > 0 {
        std::process::exit(1);
    }
}

fn run_comparison_test(test: &OpcodeTest) -> bool {
    print!("  {} ... ", test.name);
    std::io::stdout().flush().unwrap();
    
    // Run on REVM
    let revm_result = run_revm_test(test);
    
    // Run on Zig EVM
    let zig_result = run_zig_test(test);
    
    // Compare results
    match (&revm_result, &zig_result) {
        (Ok(revm_stack), Ok(zig_stack)) => {
            if revm_stack == zig_stack {
                println!("✅ PASS");
                true
            } else {
                println!("❌ FAIL");
                println!("    REVM output: {:?}", revm_stack);
                println!("    Zig output:  {:?}", zig_stack);
                false
            }
        }
        (Err(e), _) => {
            println!("❌ FAIL (REVM error: {})", e);
            false
        }
        (_, Err(e)) => {
            println!("❌ FAIL (Zig error: {})", e);
            false
        }
    }
}

fn run_revm_test(test: &OpcodeTest) -> Result<Vec<U256>, String> {
    let mut db = CacheDB::new(EmptyDB::default());
    let caller = Address::from([0x11; 20]);
    let contract_address = Address::from([0x33; 20]);
    
    // Create bytecode that:
    // 1. Pushes all input values to stack
    // 2. Executes the opcode
    // 3. Stores result to memory
    // 4. Returns the memory
    let mut bytecode = Vec::new();
    
    // Push values in reverse order (so they end up in correct stack order)
    for value in test.stack_input.iter().rev() {
        // Use PUSH32 for simplicity
        bytecode.push(0x7F);
        bytecode.extend_from_slice(&value.to_be_bytes::<32>());
    }
    
    // Execute the opcode
    bytecode.push(test.opcode);
    
    // Store result to memory (assuming single output)
    bytecode.push(0x60); // PUSH1
    bytecode.push(0x00); // 0 (memory offset)
    bytecode.push(0x52); // MSTORE
    
    // Return 32 bytes from memory
    bytecode.push(0x60); // PUSH1
    bytecode.push(0x20); // 32 (size)
    bytecode.push(0x60); // PUSH1
    bytecode.push(0x00); // 0 (offset)
    bytecode.push(0xF3); // RETURN
    
    db.insert_account_info(
        caller,
        revm::primitives::AccountInfo {
            balance: U256::MAX,
            nonce: 0,
            code_hash: B256::ZERO,
            code: None,
        }
    );
    
    db.insert_account_info(
        contract_address,
        revm::primitives::AccountInfo {
            balance: U256::ZERO,
            nonce: 0,
            code_hash: B256::ZERO,
            code: Some(revm::primitives::Bytecode::LegacyRaw(Bytes::from(bytecode))),
        }
    );
    
    let mut evm = Evm::builder()
        .with_db(db)
        .with_spec_id(SpecId::LATEST)
        .modify_tx_env(|tx| {
            tx.caller = caller;
            tx.transact_to = TxKind::Call(contract_address);
            tx.gas_limit = 1_000_000;
            tx.data = Bytes::new();
        })
        .build();
    
    let result = evm.transact()
        .map_err(|e| format!("Transaction failed: {:?}", e))?;
    
    match result.result {
        ExecutionResult::Success { output, .. } => {
            match output {
                Output::Call(data) => {
                    if data.len() == 32 {
                        let mut bytes = [0u8; 32];
                        bytes.copy_from_slice(&data);
                        Ok(vec![U256::from_be_bytes(bytes)])
                    } else {
                        Err(format!("Unexpected output length: {}", data.len()))
                    }
                }
                _ => Err("Unexpected output type".to_string()),
            }
        }
        ExecutionResult::Revert { output, .. } => {
            Err(format!("Reverted: 0x{}", hex::encode(&output)))
        }
        ExecutionResult::Halt { reason, .. } => {
            Err(format!("Halted: {:?}", reason))
        }
    }
}

fn run_zig_test(test: &OpcodeTest) -> Result<Vec<U256>, String> {
    unsafe {
        let evm = zigEvmCreate();
        if evm.is_null() {
            return Err("Failed to create Zig EVM".to_string());
        }
        
        let frame = zigFrameCreate(evm);
        if frame.is_null() {
            zigEvmDestroy(evm);
            return Err("Failed to create Zig frame".to_string());
        }
        
        // Set gas if needed
        if test.expected_gas_used.is_some() {
            zigSetGasRemaining(frame, 1000);
        }
        
        // Push values to stack
        for value in &test.stack_input {
            zigStackPush(frame, (*value).into());
        }
        
        // Execute opcode
        let result = zigExecuteOpcode(evm, frame, test.opcode);
        if result != 0 {
            zigFrameDestroy(frame);
            zigEvmDestroy(evm);
            return Err(format!("Opcode execution failed with code: {}", result));
        }
        
        // Get result from stack
        let mut output = Vec::new();
        let stack_size = zigStackSize(frame);
        for _ in 0..stack_size {
            let value = zigStackPop(frame);
            output.push(value.into());
        }
        output.reverse(); // Stack pops in reverse order
        
        // Check gas if needed
        if let Some(expected_gas) = test.expected_gas_used {
            let gas_remaining = zigGetGasRemaining(frame);
            let gas_used = 1000 - gas_remaining;
            if gas_used != expected_gas {
                zigFrameDestroy(frame);
                zigEvmDestroy(evm);
                return Err(format!("Gas mismatch: expected {}, got {}", expected_gas, gas_used));
            }
        }
        
        zigFrameDestroy(frame);
        zigEvmDestroy(evm);
        
        Ok(output)
    }
}