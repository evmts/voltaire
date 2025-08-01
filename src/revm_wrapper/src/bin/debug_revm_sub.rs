use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, U256, B256,
        Output, TxKind, SpecId,
    },
    Evm,
};

fn main() {
    println!("=== Debugging REVM SUB Operation ===\n");
    
    let mut db = CacheDB::new(EmptyDB::default());
    let caller = Address::from([0x11; 20]);
    let contract_address = Address::from([0x33; 20]);
    
    // SUB test bytecode: 100 - 58 = 42
    let bytecode = vec![
        0x60, 0x64, // PUSH1 100
        0x60, 0x3A, // PUSH1 58
        0x03,       // SUB
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xF3,       // RETURN
    ];
    
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
    
    println!("\nExecuting bytecode...\n");
    
    let result = evm.transact().unwrap();
    
    println!("\n\nExecution result:");
    match result.result {
        ExecutionResult::Success { output, gas_used, .. } => {
            println!("Success! Gas used: {}", gas_used);
            match output {
                Output::Call(data) => {
                    if data.len() == 32 {
                        let mut bytes = [0u8; 32];
                        bytes.copy_from_slice(&data);
                        let value = U256::from_be_bytes(bytes);
                        println!("Returned value: {} (0x{:064x})", value, value);
                        println!("Expected: 42");
                        
                        // Also show as signed interpretation
                        if value > U256::from(1) << 255 {
                            let neg_value = U256::MAX - value + U256::from(1);
                            println!("As signed: -{}", neg_value);
                        }
                    } else {
                        println!("Unexpected output length: {}", data.len());
                    }
                }
                _ => println!("Unexpected output type"),
            }
        }
        ExecutionResult::Revert { output, .. } => {
            println!("Reverted: 0x{}", hex::encode(&output));
        }
        ExecutionResult::Halt { reason, .. } => {
            println!("Halted: {:?}", reason);
        }
    }
}