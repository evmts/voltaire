use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, U256, TxKind, SpecId,
    },
    Evm,
};

fn main() {
    // Test ADD: 1 + 2 = 3
    let bytecode = vec![
        0x60, 0x01, // PUSH1 1
        0x60, 0x02, // PUSH1 2  
        0x01,       // ADD
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    ];

    let mut db = CacheDB::new(EmptyDB::default());
    
    let caller = Address::from([0x11; 20]);
    let contract = Address::from([0x33; 20]);
    
    // Set up accounts
    db.insert_account_info(caller, revm::primitives::AccountInfo {
        balance: U256::MAX,
        nonce: 0,
        code_hash: revm::primitives::KECCAK_EMPTY,
        code: None,
    });
    
    db.insert_account_info(contract, revm::primitives::AccountInfo {
        balance: U256::ZERO,
        nonce: 0,
        code_hash: revm::primitives::keccak256(&bytecode),
        code: Some(revm::primitives::Bytecode::new_raw(Bytes::from(bytecode.clone()))),
    });

    // Execute as a CALL (not a transaction)
    let mut evm = Evm::builder()
        .with_db(&mut db)
        .with_spec_id(SpecId::LATEST)
        .modify_tx_env(|tx| {
            tx.caller = caller;
            tx.transact_to = TxKind::Call(contract);
            tx.value = U256::ZERO;
            tx.data = Bytes::new();
            tx.gas_limit = 1_000_000;
            tx.gas_price = U256::from(1);
        })
        .build();

    println!("Running REVM with bytecode: {:?}", bytecode);
    
    match evm.transact() {
        Ok(result) => {
            match result.result {
                ExecutionResult::Success { output, gas_used, logs, .. } => {
                    println!("Success! Gas used: {}", gas_used);
                    println!("Logs emitted: {}", logs.len());
                    match output {
                        revm::primitives::Output::Call(bytes) => {
                            println!("Output bytes: {:?}", bytes);
                            if bytes.len() >= 32 {
                                let mut buf = [0u8; 32];
                                buf.copy_from_slice(&bytes[0..32]);
                                let value = U256::from_be_bytes(buf);
                                println!("Result value: {}", value);
                            }
                        }
                        revm::primitives::Output::Create(bytes, addr) => {
                            println!("Contract created at {:?} with code: {:?}", addr, bytes);
                        }
                    }
                }
                ExecutionResult::Revert { output, gas_used } => {
                    println!("Reverted! Gas used: {}", gas_used);
                    println!("Output: {:?}", output);
                }
                ExecutionResult::Halt { reason, gas_used } => {
                    println!("Halted! Gas used: {}", gas_used);
                    println!("Reason: {:?}", reason);
                }
            }
        }
        Err(e) => println!("Error: {:?}", e),
    }
}