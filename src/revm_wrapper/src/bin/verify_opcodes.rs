use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, U256, B256,
        Output, TxKind, SpecId,
    },
    Evm,
};

fn run_bytecode(name: &str, bytecode: &[u8]) {
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
            code: Some(revm::primitives::Bytecode::LegacyRaw(Bytes::from(bytecode.to_vec()))),
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
    
    println!("\n{}", name);
    println!("{}", "=".repeat(name.len()));
    
    match evm.transact() {
        Ok(result) => {
            match result.result {
                ExecutionResult::Success { output, gas_used, .. } => {
                    println!("Success: true");
                    println!("Gas used: {}", gas_used);
                    match output {
                        Output::Call(data) => {
                            if data.len() == 32 {
                                let mut bytes = [0u8; 32];
                                bytes.copy_from_slice(&data);
                                let value = U256::from_be_bytes(bytes);
                                println!("Output: {}", value);
                                println!("For Zig test: try testing.expectEqual(@as(u256, {}), result_value);", value);
                            } else if data.is_empty() {
                                println!("Output: empty");
                            } else {
                                println!("Output length: {} bytes", data.len());
                            }
                        }
                        _ => println!("Output: not a call output"),
                    }
                }
                ExecutionResult::Revert { output, gas_used, .. } => {
                    println!("Success: false (reverted)");
                    println!("Gas used: {}", gas_used);
                    println!("Revert data: {:?}", output);
                }
                ExecutionResult::Halt { reason, gas_used, .. } => {
                    println!("Success: false (halted)");
                    println!("Gas used: {}", gas_used);
                    println!("Halt reason: {:?}", reason);
                }
            }
        }
        Err(e) => {
            println!("Transaction failed: {:?}", e);
        }
    }
}

fn main() {
    println!("=== REVM Opcode Verification ===");
    
    // MULMOD (10 * 10) % 8
    run_bytecode("MULMOD (10 * 10) % 8", &[
        0x60, 0x0a, 0x60, 0x0a, 0x60, 0x08, 0x09, 0x60, 
        0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // MULMOD 10 * 10 % 0
    run_bytecode("MULMOD 10 * 10 % 0", &[
        0x60, 0x0a, 0x60, 0x0a, 0x60, 0x00, 0x09, 0x60, 
        0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // MULMOD MAX * 2 % 3
    run_bytecode("MULMOD MAX * 2 % 3", &[
        0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0x60, 0x02, 0x60, 0x03, 0x09, 0x60, 0x00, 
        0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // EXP 2 ** 256
    run_bytecode("EXP 2 ** 256", &[
        0x60, 0x02, 0x61, 0x01, 0x00, 0x0a, 0x60, 0x00, 
        0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // EXP 0 ** 0
    run_bytecode("EXP 0 ** 0", &[
        0x60, 0x00, 0x60, 0x00, 0x0a, 0x60, 0x00, 0x52, 
        0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // ADDMOD MAX + MAX % MAX
    run_bytecode("ADDMOD MAX + MAX % MAX", &[
        0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0x7f, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0x7f, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 
        0xff, 0xff, 0xff, 0xff, 0xff, 0x08, 0x60, 0x00, 
        0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
    
    // ADDMOD (10 + 10) % 8
    run_bytecode("ADDMOD (10 + 10) % 8", &[
        0x60, 0x0a, 0x60, 0x0a, 0x60, 0x08, 0x08, 0x60, 
        0x00, 0x52, 0x60, 0x20, 0x60, 0x00, 0xf3, 
    ]);
}