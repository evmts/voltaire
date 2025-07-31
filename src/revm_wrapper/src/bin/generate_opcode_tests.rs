use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, U256, B256,
        Output, TxKind, SpecId,
    },
    Evm,
};
use std::fs;
use std::io::Write;

struct OpcodeTestCase {
    name: String,
    bytecode: Vec<u8>,
    expected_stack: Vec<U256>,
    expected_gas_used: Option<u64>,
}

fn main() {
    println!("=== Generating Comprehensive Opcode Test Cases ===\n");
    
    let mut test_cases = Vec::new();
    
    // Generate test cases for EVERY opcode category
    generate_arithmetic_tests(&mut test_cases);
    generate_comparison_tests(&mut test_cases);
    generate_bitwise_tests(&mut test_cases);
    generate_stack_tests(&mut test_cases);
    generate_memory_tests(&mut test_cases);
    generate_storage_tests(&mut test_cases);
    generate_control_tests(&mut test_cases);
    generate_all_push_tests(&mut test_cases);
    generate_all_dup_tests(&mut test_cases);
    generate_all_swap_tests(&mut test_cases);
    generate_all_log_tests(&mut test_cases);
    generate_system_tests(&mut test_cases);
    generate_environment_tests(&mut test_cases);
    generate_block_tests(&mut test_cases);
    generate_crypto_tests(&mut test_cases);
    generate_call_tests(&mut test_cases);
    generate_create_tests(&mut test_cases);
    generate_data_tests(&mut test_cases);
    generate_external_tests(&mut test_cases);
    generate_eip_tests(&mut test_cases);
    generate_misc_tests(&mut test_cases);
    generate_precompile_tests(&mut test_cases);
    
    // Create a Zig test file that will run all these test cases
    let mut zig_test = String::new();
    zig_test.push_str("// Auto-generated opcode comparison tests\n");
    zig_test.push_str("const std = @import(\"std\");\n");
    zig_test.push_str("const testing = std.testing;\n");
    zig_test.push_str("const Evm = @import(\"evm\");\n");
    zig_test.push_str("const Address = @import(\"Address\").Address;\n\n");
    
    for test_case in &test_cases {
        // First run the test in revm to get the actual result
        let revm_result = run_revm_test(&test_case);
        
        println!("Generated test: {}", test_case.name);
        
        // Generate Zig test
        zig_test.push_str(&format!("test \"{}\" {{\n", test_case.name));
        zig_test.push_str("    const allocator = testing.allocator;\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    var memory_db = Evm.MemoryDatabase.init(allocator);\n");
        zig_test.push_str("    defer memory_db.deinit();\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    const db_interface = memory_db.to_database_interface();\n");
        zig_test.push_str("    var builder = Evm.EvmBuilder.init(allocator, db_interface);\n");
        zig_test.push_str("    var vm = try builder.build();\n");
        zig_test.push_str("    defer vm.deinit();\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    const caller = Address.from_u256(0x1100000000000000000000000000000000000000);\n");
        zig_test.push_str("    const contract_address = Address.from_u256(0x3300000000000000000000000000000000000000);\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    // Deploy bytecode\n");
        zig_test.push_str("    const bytecode = &[_]u8{");
        
        // Write bytecode
        for (i, byte) in test_case.bytecode.iter().enumerate() {
            if i % 8 == 0 {
                zig_test.push_str("\n        ");
            }
            zig_test.push_str(&format!("0x{:02x}, ", byte));
        }
        zig_test.push_str("\n    };\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    try vm.state.set_code(contract_address, bytecode);\n");
        zig_test.push_str("    try vm.state.set_balance(caller, std.math.maxInt(u256));\n");
        zig_test.push_str("    \n");
        zig_test.push_str("    // Call contract\n");
        zig_test.push_str("    const result = try vm.call_contract(\n");
        zig_test.push_str("        caller,\n");
        zig_test.push_str("        contract_address,\n");
        zig_test.push_str("        0,\n");
        zig_test.push_str("        &[_]u8{},\n");
        zig_test.push_str("        1_000_000,\n");
        zig_test.push_str("        false\n");
        zig_test.push_str("    );\n");
        zig_test.push_str("    defer if (result.output) |output| allocator.free(output);\n");
        zig_test.push_str("    \n");
        
        match revm_result {
            Ok(stack) => {
                // Success case - check result matches
                zig_test.push_str("    try testing.expect(result.success);\n");
                
                if !stack.is_empty() {
                    zig_test.push_str("    \n");
                    zig_test.push_str("    // Check output\n");
                    zig_test.push_str("    try testing.expect(result.output != null);\n");
                    zig_test.push_str("    const output = result.output.?;\n");
                    zig_test.push_str("    try testing.expectEqual(@as(usize, 32), output.len);\n");
                    zig_test.push_str("    \n");
                    zig_test.push_str("    // Convert output to u256\n");
                    zig_test.push_str("    var bytes: [32]u8 = undefined;\n");
                    zig_test.push_str("    @memcpy(&bytes, output[0..32]);\n");
                    zig_test.push_str("    const result_value = std.mem.readInt(u256, &bytes, .big);\n");
                    zig_test.push_str(&format!("    \n"));
                    zig_test.push_str(&format!("    // REVM produced: {}\n", stack[0]));
                    zig_test.push_str(&format!("    try testing.expectEqual(@as(u256, {}), result_value);\n", stack[0]));
                }
                
                if let Some(expected_gas) = test_case.expected_gas_used {
                    zig_test.push_str(&format!("    \n"));
                    zig_test.push_str(&format!("    // Check gas usage\n"));
                    zig_test.push_str(&format!("    const gas_used = 1_000_000 - result.gas_left;\n"));
                    zig_test.push_str(&format!("    try testing.expectEqual(@as(u64, {}), gas_used);\n", expected_gas));
                }
            }
            Err(e) => {
                // Error case - check we get the same error
                zig_test.push_str("    // REVM failed with error, we should fail too\n");
                zig_test.push_str(&format!("    // REVM error: {}\n", e));
                
                if e.contains("Reverted") {
                    zig_test.push_str("    try testing.expect(!result.success);\n");
                    zig_test.push_str("    try testing.expect(result.is_revert);\n");
                } else if e.contains("InvalidJump") {
                    zig_test.push_str("    try testing.expect(!result.success);\n");
                    zig_test.push_str("    // Should fail with invalid jump\n");
                } else if e.contains("InvalidFEOpcode") || e.contains("Invalid") {
                    zig_test.push_str("    try testing.expect(!result.success);\n");
                    zig_test.push_str("    // Should fail with invalid opcode\n");
                } else if e.contains("Halted") {
                    zig_test.push_str("    try testing.expect(!result.success);\n");
                    zig_test.push_str("    // Should halt execution\n");
                } else {
                    zig_test.push_str("    try testing.expect(!result.success);\n");
                }
            }
        }
        
        zig_test.push_str("}\n\n");
    }
    
    // Write the generated test file
    let output_path = "/Users/williamcory/guillotine-0/test/evm/opcodes/generated_opcode_comparison_test.zig";
    fs::write(output_path, zig_test)
        .expect("Failed to write test file");
    
    println!("\nGenerated {}", output_path);
    println!("Run with: zig build test-opcode-comparison");
}

fn generate_arithmetic_tests(tests: &mut Vec<OpcodeTestCase>) {
    // ADD tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ADD 5 + 10 = 15".to_string(),
        bytecode: vec![
            0x60, 0x05, // PUSH1 5
            0x60, 0x0A, // PUSH1 10
            0x01,       // ADD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(15)],
        expected_gas_used: Some(21024),
    });
    
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ADD overflow MAX + 1 = 0".to_string(),
        bytecode: vec![
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // MAX_U256
            0x60, 0x01, // PUSH1 1
            0x01,       // ADD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::ZERO],
        expected_gas_used: None,
    });
    
    // SUB tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SUB 100 - 58 = 42".to_string(),
        bytecode: vec![
            0x60, 0x64, // PUSH1 100
            0x60, 0x3A, // PUSH1 58
            0x03,       // SUB
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: Some(21024),
    });
    
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SUB underflow 5 - 10".to_string(),
        bytecode: vec![
            0x60, 0x05, // PUSH1 5
            0x60, 0x0A, // PUSH1 10
            0x03,       // SUB
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX - U256::from(4)],
        expected_gas_used: Some(21024),
    });
    
    // MUL tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MUL 7 * 6 = 42".to_string(),
        bytecode: vec![
            0x60, 0x07, // PUSH1 7
            0x60, 0x06, // PUSH1 6
            0x02,       // MUL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: Some(21026),
    });
    
    // DIV tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: DIV 84 / 2 = 42".to_string(),
        bytecode: vec![
            0x60, 0x54, // PUSH1 84
            0x60, 0x02, // PUSH1 2
            0x04,       // DIV
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: Some(21026),
    });
    
    tests.push(OpcodeTestCase {
        name: "REVM comparison: DIV by zero 10 / 0 = 0".to_string(),
        bytecode: vec![
            0x60, 0x0A, // PUSH1 10
            0x60, 0x00, // PUSH1 0
            0x04,       // DIV
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],
        expected_gas_used: Some(21026),
    });
    
    // MOD tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MOD 17 % 5 = 2".to_string(),
        bytecode: vec![
            0x60, 0x11, // PUSH1 17
            0x60, 0x05, // PUSH1 5
            0x06,       // MOD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(2)],
        expected_gas_used: Some(21026),
    });
    
    // SDIV test (signed division)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SDIV -10 / 3 = -3".to_string(),
        bytecode: vec![
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF6, // -10
            0x60, 0x03, // PUSH1 3
            0x05,       // SDIV
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX - U256::from(2)], // -3 in two's complement
        expected_gas_used: Some(21026),
    });
    
    // SMOD test (signed modulo)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SMOD -10 % 3 = -1".to_string(),
        bytecode: vec![
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF6, // -10
            0x60, 0x03, // PUSH1 3
            0x07,       // SMOD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX], // -1 in two's complement
        expected_gas_used: Some(21026),
    });
    
    // ADDMOD tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ADDMOD (10 + 10) % 8 = 4".to_string(),
        bytecode: vec![
            0x60, 0x0A, // PUSH1 10
            0x60, 0x0A, // PUSH1 10
            0x60, 0x08, // PUSH1 8
            0x08,       // ADDMOD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(4)],
        expected_gas_used: Some(21029),
    });
    
    // MULMOD tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MULMOD (10 * 10) % 8 = 4".to_string(),
        bytecode: vec![
            0x60, 0x0A, // PUSH1 10
            0x60, 0x0A, // PUSH1 10
            0x60, 0x08, // PUSH1 8
            0x09,       // MULMOD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(4)],
        expected_gas_used: Some(21029),
    });
    
    // EXP tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: EXP 2 ** 3 = 8".to_string(),
        bytecode: vec![
            0x60, 0x02, // PUSH1 2
            0x60, 0x03, // PUSH1 3
            0x0A,       // EXP
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(8)],
        expected_gas_used: None, // EXP gas is dynamic
    });
    
    // SIGNEXTEND tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SIGNEXTEND 0xFF from byte 0".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x60, 0xFF, // PUSH1 0xFF
            0x0B,       // SIGNEXTEND
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX],
        expected_gas_used: Some(21026),
    });
}

fn generate_comparison_tests(tests: &mut Vec<OpcodeTestCase>) {
    // LT tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: LT 5 < 10 = 1".to_string(),
        bytecode: vec![
            0x60, 0x05, // PUSH1 5
            0x60, 0x0A, // PUSH1 10
            0x10,       // LT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
    
    // GT tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: GT 10 > 5 = 1".to_string(),
        bytecode: vec![
            0x60, 0x05, // PUSH1 5
            0x60, 0x0A, // PUSH1 10
            0x11,       // GT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
    
    // EQ tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: EQ 42 == 42 = 1".to_string(),
        bytecode: vec![
            0x60, 0x2A, // PUSH1 42
            0x60, 0x2A, // PUSH1 42
            0x14,       // EQ
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
    
    // ISZERO tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ISZERO 0 = 1".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x15,       // ISZERO
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21023),
    });
    
    // SLT test (signed less than)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SLT -1 < 1 = 1".to_string(),
        bytecode: vec![
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // -1
            0x60, 0x01, // PUSH1 1
            0x12,       // SLT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
    
    // SGT test (signed greater than)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SGT 1 > -1 = 1".to_string(),
        bytecode: vec![
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, // -1
            0x60, 0x01, // PUSH1 1
            0x13,       // SGT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
}

fn generate_bitwise_tests(tests: &mut Vec<OpcodeTestCase>) {
    // BYTE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BYTE extracts byte at index".to_string(),
        bytecode: vec![
            0x60, 0x1F, // PUSH1 31 (index - least significant byte)
            0x60, 0xFF, // PUSH1 0xFF
            0x1A,       // BYTE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0xFF)],
        expected_gas_used: None,
    });
    
    // AND tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: AND 0xFF & 0x0F = 0x0F".to_string(),
        bytecode: vec![
            0x60, 0xFF, // PUSH1 0xFF
            0x60, 0x0F, // PUSH1 0x0F
            0x16,       // AND
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0x0F)],
        expected_gas_used: Some(21024),
    });
    
    // OR tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: OR 0xF0 | 0x0F = 0xFF".to_string(),
        bytecode: vec![
            0x60, 0xF0, // PUSH1 0xF0
            0x60, 0x0F, // PUSH1 0x0F
            0x17,       // OR
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0xFF)],
        expected_gas_used: Some(21024),
    });
    
    // XOR tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: XOR 0xFF ^ 0xF0 = 0x0F".to_string(),
        bytecode: vec![
            0x60, 0xFF, // PUSH1 0xFF
            0x60, 0xF0, // PUSH1 0xF0
            0x18,       // XOR
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0x0F)],
        expected_gas_used: Some(21024),
    });
    
    // NOT tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: NOT ~0 = MAX".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x19,       // NOT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX],
        expected_gas_used: Some(21023),
    });
    
    // SHL tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SHL 1 << 4 = 16".to_string(),
        bytecode: vec![
            0x60, 0x04, // PUSH1 4
            0x60, 0x01, // PUSH1 1
            0x1B,       // SHL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(16)],
        expected_gas_used: Some(21024),
    });
    
    // SHR tests
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SHR 16 >> 4 = 1".to_string(),
        bytecode: vec![
            0x60, 0x04, // PUSH1 4
            0x60, 0x10, // PUSH1 16
            0x1C,       // SHR
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],
        expected_gas_used: Some(21024),
    });
    
    // SAR test (arithmetic shift right)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SAR -16 >> 4 = -1".to_string(),
        bytecode: vec![
            0x60, 0x04, // PUSH1 4
            0x7F, // PUSH32
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF,
            0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0xF0, // -16
            0x1D,       // SAR
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::MAX], // -1 (sign extended)
        expected_gas_used: Some(21024),
    });
}

fn generate_stack_tests(tests: &mut Vec<OpcodeTestCase>) {
    // POP test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: POP removes top stack item".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x10, // PUSH1 16
            0x50,       // POP
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: Some(21020),
    });
    
    // MLOAD test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MLOAD loads from memory".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: None,
    });
}

fn generate_memory_tests(tests: &mut Vec<OpcodeTestCase>) {
    // MSTORE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MSTORE stores to memory".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: None,
    });
    
    // MSTORE8 test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MSTORE8 stores single byte".to_string(),
        bytecode: vec![
            0x60, 0xFF, // PUSH1 255
            0x60, 0x1F, // PUSH1 31
            0x53,       // MSTORE8
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0xFF)],
        expected_gas_used: None,
    });
    
    // MSIZE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MSIZE returns memory size".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x59,       // MSIZE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(32)],
        expected_gas_used: None,
    });
}

fn generate_storage_tests(tests: &mut Vec<OpcodeTestCase>) {
    // SLOAD test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SLOAD loads from storage".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x54,       // SLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],
        expected_gas_used: None,
    });
    
    // SSTORE test (will revert in call context, but we can test it reverts correctly)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SSTORE in call context".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x55,       // SSTORE (will revert in call)
            0x60, 0x01, // PUSH1 1
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],
        expected_gas_used: None,
    });
}

fn generate_control_tests(tests: &mut Vec<OpcodeTestCase>) {
    // JUMP test with valid jumpdest
    tests.push(OpcodeTestCase {
        name: "REVM comparison: JUMP to valid destination".to_string(),
        bytecode: vec![
            0x60, 0x05, // PUSH1 5 (jump destination)
            0x56,       // JUMP
            0x00,       // STOP (should be skipped)
            0x00,       // STOP (padding)
            0x5B,       // JUMPDEST at position 5
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: None,
    });
    
    // JUMPI test (jump taken)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: JUMPI jump taken".to_string(),
        bytecode: vec![
            0x60, 0x01, // PUSH1 1 (condition)
            0x60, 0x08, // PUSH1 8 (destination)
            0x57,       // JUMPI
            0x60, 0x00, // PUSH1 0 (should be skipped)
            0x00,       // STOP
            0x00,       // STOP (padding)
            0x00,       // STOP (padding)
            0x5B,       // JUMPDEST at position 8
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: None,
    });
    
    // PC test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: PC returns program counter".to_string(),
        bytecode: vec![
            0x58,       // PC (at position 0)
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],
        expected_gas_used: None,
    });
    
    // GAS test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: GAS returns remaining gas".to_string(),
        bytecode: vec![
            0x5A,       // GAS
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Gas value varies
        expected_gas_used: None,
    });
}

fn generate_all_push_tests(tests: &mut Vec<OpcodeTestCase>) {
    // PUSH0 test (EIP-3855)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: PUSH0".to_string(),
        bytecode: vec![
            0x5F,       // PUSH0
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],
        expected_gas_used: None,
    });

    // Generate tests for PUSH1 through PUSH32
    for i in 1..=32 {
        let mut bytecode = vec![];
        bytecode.push(0x60 + (i - 1) as u8); // PUSH1 = 0x60, PUSH2 = 0x61, etc.
        
        // Create test data pattern for this PUSH size
        let mut push_data = vec![];
        for j in 0..i {
            push_data.push((j % 256) as u8);
        }
        bytecode.extend_from_slice(&push_data);
        
        // Store and return
        bytecode.extend_from_slice(&[
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ]);
        
        // Calculate expected value
        let mut expected_bytes = vec![0u8; 32];
        let start = if i < 32 { 32 - i } else { 0 };
        for (idx, &byte) in push_data.iter().enumerate() {
            if start + idx < 32 {
                expected_bytes[start + idx] = byte;
            }
        }
        
        tests.push(OpcodeTestCase {
            name: format!("REVM comparison: PUSH{}", i),
            bytecode,
            expected_stack: vec![U256::from_be_slice(&expected_bytes)],
            expected_gas_used: None,
        });
    }
}

fn generate_all_dup_tests(tests: &mut Vec<OpcodeTestCase>) {
    // Generate tests for DUP1 through DUP16
    for i in 1..=16 {
        let mut bytecode = vec![];
        
        // Push i values onto stack (bottom to top)
        for j in (1..=i).rev() {
            bytecode.push(0x60);
            bytecode.push(j as u8);
        }
        
        // DUP operation
        bytecode.push(0x80 + (i - 1) as u8); // DUP1 = 0x80, DUP2 = 0x81, etc.
        
        // Return top value (should be duplicated value from position i)
        bytecode.extend_from_slice(&[
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ]);
        
        tests.push(OpcodeTestCase {
            name: format!("REVM comparison: DUP{}", i),
            bytecode,
            expected_stack: vec![U256::from(i)], // Should duplicate the value at position i
            expected_gas_used: None,
        });
    }
}

fn generate_all_swap_tests(tests: &mut Vec<OpcodeTestCase>) {
    // Generate tests for SWAP1 through SWAP16
    for i in 1..=16 {
        let mut bytecode = vec![];
        
        // Push i+1 values onto stack
        for j in 0..=i {
            bytecode.push(0x60);
            bytecode.push(j as u8);
        }
        
        // SWAP operation
        bytecode.push(0x90 + (i - 1) as u8); // SWAP1 = 0x90, SWAP2 = 0x91, etc.
        
        // Return top value
        bytecode.extend_from_slice(&[
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ]);
        
        tests.push(OpcodeTestCase {
            name: format!("REVM comparison: SWAP{}", i),
            bytecode,
            expected_stack: vec![U256::from(0)], // After swap, top should be value from position i+1
            expected_gas_used: None,
        });
    }
}

fn generate_all_log_tests(tests: &mut Vec<OpcodeTestCase>) {
    // Generate tests for LOG0 through LOG4
    for i in 0..=4 {
        let mut bytecode = vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
        ];
        
        // Push topics for LOG1-LOG4
        for _ in 0..i {
            bytecode.push(0x60);
            bytecode.push(0xAA); // Topic value
        }
        
        bytecode.extend_from_slice(&[
            0x60, 0x20, // PUSH1 32 (size)
            0x60, 0x00, // PUSH1 0 (offset)
            0xA0 + i,   // LOG0 = 0xA0, LOG1 = 0xA1, etc.
            0x60, 0x01, // PUSH1 1
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ]);
        
        tests.push(OpcodeTestCase {
            name: format!("REVM comparison: LOG{}", i),
            bytecode,
            expected_stack: vec![U256::from(1)],
            expected_gas_used: None,
        });
    }
}

fn generate_system_tests(tests: &mut Vec<OpcodeTestCase>) {
    // RETURN test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: RETURN".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 42
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(42)],
        expected_gas_used: None,
    });
    
    // REVERT test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: REVERT".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x60, 0x00, // PUSH1 0
            0xFD,       // REVERT
        ],
        expected_stack: vec![],
        expected_gas_used: None,
    });
}

fn generate_environment_tests(tests: &mut Vec<OpcodeTestCase>) {
    // CODECOPY test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CODECOPY copies code to memory".to_string(),
        bytecode: vec![
            0x60, 0x03, // PUSH1 3 (length)
            0x60, 0x00, // PUSH1 0 (code offset)
            0x60, 0x00, // PUSH1 0 (memory offset)
            0x39,       // CODECOPY
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from_be_slice(&[
            0x60, 0x03, 0x60, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
            0, 0, 0, 0, 0, 0, 0, 0,
        ])], // First 3 bytes of bytecode
        expected_gas_used: None,
    });
    
    // ADDRESS test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ADDRESS".to_string(),
        bytecode: vec![
            0x30,       // ADDRESS
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Address varies
        expected_gas_used: None,
    });
    
    // CALLER test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLER".to_string(),
        bytecode: vec![
            0x33,       // CALLER
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Caller varies
        expected_gas_used: None,
    });
    
    // CALLVALUE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLVALUE".to_string(),
        bytecode: vec![
            0x34,       // CALLVALUE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],  // No value sent
        expected_gas_used: None,
    });
    
    // CALLDATASIZE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLDATASIZE".to_string(),
        bytecode: vec![
            0x36,       // CALLDATASIZE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],  // No calldata
        expected_gas_used: None,
    });
    
    // CODESIZE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CODESIZE".to_string(),
        bytecode: vec![
            0x38,       // CODESIZE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(9)],  // Size of this bytecode
        expected_gas_used: None,
    });
    
    // GASPRICE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: GASPRICE".to_string(),
        bytecode: vec![
            0x3A,       // GASPRICE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Gas price varies
        expected_gas_used: None,
    });
}

fn generate_block_tests(tests: &mut Vec<OpcodeTestCase>) {
    // BLOCKHASH test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BLOCKHASH".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x40,       // BLOCKHASH
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],  // Block 0 hash
        expected_gas_used: None,
    });
    
    // COINBASE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: COINBASE".to_string(),
        bytecode: vec![
            0x41,       // COINBASE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Coinbase varies
        expected_gas_used: None,
    });
    
    // TIMESTAMP test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: TIMESTAMP".to_string(),
        bytecode: vec![
            0x42,       // TIMESTAMP
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Timestamp varies
        expected_gas_used: None,
    });
    
    // NUMBER test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: NUMBER".to_string(),
        bytecode: vec![
            0x43,       // NUMBER
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Block number varies
        expected_gas_used: None,
    });
    
    // DIFFICULTY/PREVRANDAO test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: DIFFICULTY".to_string(),
        bytecode: vec![
            0x44,       // DIFFICULTY
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Difficulty varies
        expected_gas_used: None,
    });
    
    // GASLIMIT test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: GASLIMIT".to_string(),
        bytecode: vec![
            0x45,       // GASLIMIT
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Gas limit varies
        expected_gas_used: None,
    });
    
    // CHAINID test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CHAINID".to_string(),
        bytecode: vec![
            0x46,       // CHAINID
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)],  // Default chain ID
        expected_gas_used: None,
    });
    
    // SELFBALANCE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SELFBALANCE".to_string(),
        bytecode: vec![
            0x47,       // SELFBALANCE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)],  // No balance
        expected_gas_used: None,
    });
    
    // BASEFEE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BASEFEE".to_string(),
        bytecode: vec![
            0x48,       // BASEFEE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![],  // Base fee varies
        expected_gas_used: None,
    });
}

fn generate_crypto_tests(tests: &mut Vec<OpcodeTestCase>) {
    // KECCAK256 test - hash of empty data
    tests.push(OpcodeTestCase {
        name: "REVM comparison: KECCAK256 empty".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (size)
            0x60, 0x00, // PUSH1 0 (offset)
            0x20,       // KECCAK256
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Will be filled by REVM
        expected_gas_used: None,
    });
    
    // KECCAK256 test - hash of "hello"
    tests.push(OpcodeTestCase {
        name: "REVM comparison: KECCAK256 hello".to_string(),
        bytecode: vec![
            // Store "hello" in memory
            0x68, 0x68, 0x65, 0x6c, 0x6c, 0x6f, 0x00, 0x00, 0x00, 0x00, // PUSH9 "hello"
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x05, // PUSH1 5 (size)
            0x60, 0x00, // PUSH1 0 (offset) 
            0x20,       // KECCAK256
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Will be filled by REVM
        expected_gas_used: None,
    });
}

fn run_revm_test(test: &OpcodeTestCase) -> Result<Vec<U256>, String> {
    let mut db = CacheDB::new(EmptyDB::default());
    let caller = Address::from([0x11; 20]);
    let contract_address = Address::from([0x33; 20]);
    
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
            code: Some(revm::primitives::Bytecode::LegacyRaw(Bytes::from(test.bytecode.clone()))),
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
                    } else if data.is_empty() {
                        Ok(vec![])
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

fn generate_call_tests(tests: &mut Vec<OpcodeTestCase>) {
    // CALL test - basic call with no value transfer
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALL basic".to_string(),
        bytecode: vec![
            // Setup call parameters
            0x60, 0x00, // PUSH1 0 (retSize)
            0x60, 0x00, // PUSH1 0 (retOffset)
            0x60, 0x00, // PUSH1 0 (argsSize)
            0x60, 0x00, // PUSH1 0 (argsOffset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x00, // PUSH1 0 (address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // DELEGATECALL test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: DELEGATECALL".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (retSize)
            0x60, 0x00, // PUSH1 0 (retOffset)
            0x60, 0x00, // PUSH1 0 (argsSize)
            0x60, 0x00, // PUSH1 0 (argsOffset)
            0x60, 0x00, // PUSH1 0 (address)
            0x5A,       // GAS
            0xF4,       // DELEGATECALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // STATICCALL test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: STATICCALL".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (retSize)
            0x60, 0x00, // PUSH1 0 (retOffset)
            0x60, 0x00, // PUSH1 0 (argsSize)
            0x60, 0x00, // PUSH1 0 (argsOffset)
            0x60, 0x00, // PUSH1 0 (address)
            0x5A,       // GAS
            0xFA,       // STATICCALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // CALLCODE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLCODE".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (retSize)
            0x60, 0x00, // PUSH1 0 (retOffset)
            0x60, 0x00, // PUSH1 0 (argsSize)
            0x60, 0x00, // PUSH1 0 (argsOffset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x00, // PUSH1 0 (address)
            0x5A,       // GAS
            0xF2,       // CALLCODE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });
}

fn generate_create_tests(tests: &mut Vec<OpcodeTestCase>) {
    // CREATE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CREATE".to_string(),
        bytecode: vec![
            // Simple contract creation bytecode: PUSH1 0x42 PUSH1 0 MSTORE PUSH1 32 PUSH1 0 RETURN
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x0A, // PUSH1 10 (bytecode size)
            0x60, 0x16, // PUSH1 22 (bytecode offset in memory)
            0x52,       // MSTORE
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x16, // PUSH1 22 (offset)
            0x60, 0x0A, // PUSH1 10 (size)
            0xF0,       // CREATE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Address of created contract
        expected_gas_used: None,
    });

    // CREATE2 test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CREATE2".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (salt)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x00, // PUSH1 0 (offset)
            0x60, 0x00, // PUSH1 0 (size)
            0xF5,       // CREATE2
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // 0 for failed creation
        expected_gas_used: None,
    });
}

fn generate_data_tests(tests: &mut Vec<OpcodeTestCase>) {
    // CALLDATALOAD test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLDATALOAD".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x35,       // CALLDATALOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No calldata
        expected_gas_used: None,
    });

    // CALLDATACOPY test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: CALLDATACOPY".to_string(),
        bytecode: vec![
            0x60, 0x20, // PUSH1 32 (size)
            0x60, 0x00, // PUSH1 0 (offset)
            0x60, 0x00, // PUSH1 0 (destOffset)
            0x37,       // CALLDATACOPY
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No calldata
        expected_gas_used: None,
    });

    // RETURNDATASIZE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: RETURNDATASIZE".to_string(),
        bytecode: vec![
            0x3D,       // RETURNDATASIZE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No return data yet
        expected_gas_used: None,
    });

    // RETURNDATACOPY test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: RETURNDATACOPY empty".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (size)
            0x60, 0x00, // PUSH1 0 (offset)
            0x60, 0x00, // PUSH1 0 (destOffset)
            0x3E,       // RETURNDATACOPY
            0x60, 0x01, // PUSH1 1
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Success marker
        expected_gas_used: None,
    });
}

fn generate_external_tests(tests: &mut Vec<OpcodeTestCase>) {
    // EXTCODESIZE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: EXTCODESIZE".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (address)
            0x3B,       // EXTCODESIZE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No code at address 0
        expected_gas_used: None,
    });

    // EXTCODECOPY test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: EXTCODECOPY".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (size)
            0x60, 0x00, // PUSH1 0 (offset)
            0x60, 0x00, // PUSH1 0 (destOffset)
            0x60, 0x00, // PUSH1 0 (address)
            0x3C,       // EXTCODECOPY
            0x60, 0x01, // PUSH1 1
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Success marker
        expected_gas_used: None,
    });

    // EXTCODEHASH test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: EXTCODEHASH".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (address)
            0x3F,       // EXTCODEHASH
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Hash varies
        expected_gas_used: None,
    });

    // BALANCE test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BALANCE".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (address)
            0x31,       // BALANCE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No balance at address 0
        expected_gas_used: None,
    });

    // ORIGIN test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: ORIGIN".to_string(),
        bytecode: vec![
            0x32,       // ORIGIN
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Origin varies
        expected_gas_used: None,
    });
}

fn generate_eip_tests(tests: &mut Vec<OpcodeTestCase>) {
    // MCOPY test (EIP-5656)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: MCOPY".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32 (size)
            0x60, 0x00, // PUSH1 0 (src)
            0x60, 0x20, // PUSH1 32 (dst)
            0x5E,       // MCOPY
            0x60, 0x20, // PUSH1 32
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(66)], // Copied value
        expected_gas_used: None,
    });

    // TLOAD test (EIP-1153)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: TLOAD".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x5C,       // TLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // Empty transient storage
        expected_gas_used: None,
    });

    // TSTORE test (EIP-1153)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: TSTORE".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x5D,       // TSTORE
            0x60, 0x00, // PUSH1 0
            0x5C,       // TLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(66)], // Stored value
        expected_gas_used: None,
    });

    // BLOBHASH test (EIP-4844)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BLOBHASH".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0
            0x49,       // BLOBHASH
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(0)], // No blob
        expected_gas_used: None,
    });

    // BLOBBASEFEE test (EIP-4844)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: BLOBBASEFEE".to_string(),
        bytecode: vec![
            0x4A,       // BLOBBASEFEE
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Fee varies
        expected_gas_used: None,
    });
}

fn generate_misc_tests(tests: &mut Vec<OpcodeTestCase>) {
    // STOP test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: STOP".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x00,       // STOP
        ],
        expected_stack: vec![], // No return data with STOP
        expected_gas_used: None,
    });

    // INVALID test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: INVALID".to_string(),
        bytecode: vec![
            0xFE,       // INVALID
        ],
        expected_stack: vec![], // Should revert
        expected_gas_used: None,
    });

    // JUMPDEST test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: JUMPDEST".to_string(),
        bytecode: vec![
            0x5B,       // JUMPDEST (does nothing by itself)
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(66)],
        expected_gas_used: None,
    });

    // SELFDESTRUCT test
    tests.push(OpcodeTestCase {
        name: "REVM comparison: SELFDESTRUCT".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (beneficiary)
            0xFF,       // SELFDESTRUCT
        ],
        expected_stack: vec![], // Contract destroyed
        expected_gas_used: None,
    });
}

fn generate_precompile_tests(tests: &mut Vec<OpcodeTestCase>) {
    // Precompile 1: ecrecover
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile ecrecover".to_string(),
        bytecode: vec![
            // Setup empty calldata for ecrecover
            0x60, 0x80, // PUSH1 128 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x01, // PUSH1 1 (ecrecover address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // Precompile 2: SHA256
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile SHA256".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x02, // PUSH1 2 (sha256 address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // SHA256 of empty
        expected_gas_used: None,
    });

    // Precompile 3: RIPEMD160
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile RIPEMD160".to_string(),
        bytecode: vec![
            0x60, 0x00, // PUSH1 0 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x03, // PUSH1 3 (ripemd160 address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // RIPEMD160 of empty
        expected_gas_used: None,
    });

    // Precompile 4: identity
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile identity".to_string(),
        bytecode: vec![
            0x60, 0x42, // PUSH1 66
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0x20, // PUSH1 32 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x04, // PUSH1 4 (identity address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x20, // PUSH1 32
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(66)], // Identity returns input
        expected_gas_used: None,
    });

    // Precompile 5: modexp
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile modexp".to_string(),
        bytecode: vec![
            // Simple modexp: 2^3 mod 5 = 3
            // Input format: base_len(32) | exp_len(32) | mod_len(32) | base | exp | mod
            0x60, 0x01, // PUSH1 1 (base_len)
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE at 0
            0x60, 0x01, // PUSH1 1 (exp_len)
            0x60, 0x20, // PUSH1 32
            0x52,       // MSTORE at 32
            0x60, 0x01, // PUSH1 1 (mod_len)
            0x60, 0x40, // PUSH1 64
            0x52,       // MSTORE at 64
            0x60, 0x02, // PUSH1 2 (base)
            0x60, 0x60, // PUSH1 96
            0x52,       // MSTORE at 96
            0x60, 0x03, // PUSH1 3 (exp)
            0x60, 0x80, // PUSH1 128
            0x52,       // MSTORE at 128
            0x60, 0x05, // PUSH1 5 (mod)
            0x60, 0xA0, // PUSH1 160
            0x52,       // MSTORE at 160
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0xC0, // PUSH1 192 (output offset)
            0x60, 0xC0, // PUSH1 192 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x05, // PUSH1 5 (modexp address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0xC0, // PUSH1 192
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Result of 2^3 mod 5
        expected_gas_used: None,
    });

    // Precompile 6: ecAdd (BN254)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile ecAdd".to_string(),
        bytecode: vec![
            // Input: two points (64 bytes each = 128 bytes total)
            0x60, 0x80, // PUSH1 128 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x40, // PUSH1 64 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x06, // PUSH1 6 (ecAdd address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // Precompile 7: ecMul (BN254)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile ecMul".to_string(),
        bytecode: vec![
            // Input: point (64 bytes) + scalar (32 bytes) = 96 bytes
            0x60, 0x60, // PUSH1 96 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x40, // PUSH1 64 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x07, // PUSH1 7 (ecMul address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });

    // Precompile 8: ecPairing (BN254)
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile ecPairing".to_string(),
        bytecode: vec![
            // Empty pairing check (should return 1)
            0x60, 0x00, // PUSH1 0 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x20, // PUSH1 32 (output size)
            0x60, 0x00, // PUSH1 0 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x08, // PUSH1 8 (ecPairing address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x51,       // MLOAD
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![], // Pairing result
        expected_gas_used: None,
    });

    // Precompile 9: blake2f
    tests.push(OpcodeTestCase {
        name: "REVM comparison: Precompile blake2f".to_string(),
        bytecode: vec![
            // Blake2f requires exactly 213 bytes of input
            // Setup minimal valid input (rounds=1, h, m, t, f)
            0x60, 0x01, // PUSH1 1 (rounds, byte 3)
            0x60, 0x03, // PUSH1 3
            0x53,       // MSTORE8
            // The rest needs to be 212 bytes (8*8 for h + 16*8 for m + 2*8 for t + 1 for f)
            0x61, 0x00, 0xD5, // PUSH2 213 (input size)
            0x60, 0x00, // PUSH1 0 (input offset)
            0x60, 0x40, // PUSH1 64 (output size)
            0x61, 0x01, 0x00, // PUSH2 256 (output offset)
            0x60, 0x00, // PUSH1 0 (value)
            0x60, 0x09, // PUSH1 9 (blake2f address)
            0x5A,       // GAS
            0xF1,       // CALL
            0x60, 0x00, // PUSH1 0
            0x52,       // MSTORE
            0x60, 0x20, // PUSH1 32
            0x60, 0x00, // PUSH1 0
            0xF3,       // RETURN
        ],
        expected_stack: vec![U256::from(1)], // Call success
        expected_gas_used: None,
    });
}