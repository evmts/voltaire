use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, ExecutionResult, U256, B256,
        Env, TxEnv, BlockEnv, CfgEnv, TxKind,
    },
    Evm,
};

fn main() {
    println!("Testing basic REVM functionality...");
    
    // Create database
    let mut db = CacheDB::new(EmptyDB::default());
    
    // Set up addresses
    let caller = Address::from([0x11; 20]);
    let contract = Address::from([0x33; 20]);
    
    // Set up caller with balance
    db.insert_account_info(
        caller,
        revm::primitives::AccountInfo {
            balance: U256::from(1_000_000_000_000_000_000u64), // 1 ETH
            nonce: 0,
            code_hash: B256::ZERO,
            code: None,
        }
    );
    
    // Simple bytecode: PUSH1 0x42, PUSH1 0x00, MSTORE, PUSH1 0x20, PUSH1 0x00, RETURN
    // Returns 0x42
    let bytecode = vec![
        0x60, 0x42,  // PUSH1 0x42
        0x60, 0x00,  // PUSH1 0x00
        0x52,        // MSTORE
        0x60, 0x20,  // PUSH1 0x20
        0x60, 0x00,  // PUSH1 0x00
        0xf3,        // RETURN
    ];
    
    // Deploy contract
    db.insert_account_info(
        contract,
        revm::primitives::AccountInfo {
            balance: U256::ZERO,
            nonce: 1,
            code_hash: B256::ZERO,
            code: Some(revm::primitives::Bytecode::new_raw(bytecode.clone().into())),
        }
    );
    
    // Create EVM
    let mut evm = Evm::builder()
        .with_db(db)
        .build();
    
    // Set up environment
    evm.context.evm.env = Box::new(Env {
        cfg: CfgEnv::default(),
        block: BlockEnv {
            number: U256::from(1),
            timestamp: U256::from(1),
            gas_limit: U256::from(30_000_000),
            ..Default::default()
        },
        tx: TxEnv {
            caller,
            transact_to: TxKind::Call(contract),
            gas_limit: 100_000,
            gas_price: U256::from(1),
            value: U256::ZERO,
            data: vec![].into(),
            ..Default::default()
        },
    });
    
    // Execute
    println!("Executing contract call...");
    let result = match evm.transact() {
        Ok(res) => res,
        Err(e) => {
            eprintln!("Error executing transaction: {:?}", e);
            return;
        }
    };
    
    // Check result
    match result.result {
        ExecutionResult::Success { gas_used, output, .. } => {
            println!("Success!");
            println!("Gas used: {}", gas_used);
            
            match output {
                revm::primitives::Output::Call(bytes) => {
                    println!("Output: 0x{}", hex::encode(&bytes));
                    
                    // Verify output is 0x42 (padded to 32 bytes)
                    if bytes.len() == 32 && bytes[31] == 0x42 {
                        println!("✓ Output is correct (0x42)");
                    } else {
                        println!("✗ Output is incorrect");
                    }
                }
                _ => println!("Unexpected output type"),
            }
        }
        ExecutionResult::Revert { gas_used, output } => {
            println!("Reverted!");
            println!("Gas used: {}", gas_used);
            println!("Output: 0x{}", hex::encode(&output));
        }
        ExecutionResult::Halt { reason, gas_used } => {
            println!("Halted!");
            println!("Reason: {:?}", reason);
            println!("Gas used: {}", gas_used);
        }
    }
}