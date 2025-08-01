use std::{env, fs, str::FromStr, time::Instant};

use revm::{
    primitives::{Address, Bytes, ExecutionResult, TxKind, U256},
    db::{CacheDB, EmptyDB},
    Evm, DatabaseCommit,
};

const CALLER_ADDRESS: &str = "0x1000000000000000000000000000000000000001";

fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Fast argument parsing without validation
    let mut contract_code_path = String::new();
    let mut calldata_hex = String::new();
    let mut num_runs: u8 = 1;
    
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--contract-code-path" => {
                contract_code_path = args[i + 1].clone();
                i += 2;
            }
            "--calldata" => {
                calldata_hex = args[i + 1].clone();
                i += 2;
            }
            "--num-runs" => {
                num_runs = args[i + 1].parse().unwrap();
                i += 2;
            }
            _ => i += 1,
        }
    }
    
    let caller_address = Address::from_str(CALLER_ADDRESS).unwrap();
    
    // Read and decode without error handling for performance
    let contract_code_hex = fs::read_to_string(&contract_code_path).unwrap().trim().to_string();
    let contract_code: Bytes = hex::decode(contract_code_hex.trim_start_matches("0x")).unwrap().into();
    let calldata: Bytes = hex::decode(calldata_hex.trim_start_matches("0x")).unwrap().into();
    
    let mut db = CacheDB::new(EmptyDB::default());
    
    // Set up caller with large balance
    let caller_info = revm::primitives::AccountInfo {
        balance: U256::MAX,
        nonce: 0,
        code_hash: revm::primitives::KECCAK_EMPTY,
        code: None,
    };
    db.insert_account_info(caller_address, caller_info);
    
    // Deploy the contract first
    let contract_address = deploy_contract(&mut db, caller_address, &contract_code).unwrap();
    
    // Create EVM instance once - outside the loop (like Zig does)
    let mut evm = Evm::builder()
        .with_db(&mut db)
        .modify_tx_env(|tx| {
            tx.caller = caller_address;
            tx.transact_to = TxKind::Call(contract_address);
            tx.value = U256::ZERO;
            tx.data = calldata.clone();
            tx.gas_limit = 1_000_000_000; // 1B gas
            tx.gas_price = U256::from(0u64);
        })
        .build();
    
    // Run the benchmark num_runs times
    for _ in 0..num_runs {
        let timer = Instant::now();
        
        // Execute without error handling for performance
        let result = evm.transact().unwrap();
        let dur = timer.elapsed();
        
        // Commit the state changes (similar to how Zig's vm.call_contract works)
        evm.context.evm.db.commit(result.state);
        
        println!("{}", dur.as_micros() as f64 / 1e3);
    }
}

fn deploy_contract(
    db: &mut CacheDB<EmptyDB>,
    caller: Address,
    bytecode: &[u8],
) -> Result<Address, String> {
    let mut evm = Evm::builder()
        .with_db(db)
        .modify_tx_env(|tx| {
            tx.caller = caller;
            tx.transact_to = TxKind::Create;
            tx.value = U256::ZERO;
            tx.data = Bytes::from(bytecode.to_vec());
            tx.gas_limit = 10_000_000;
            tx.gas_price = U256::from(1u64);
        })
        .build();
        
    // Fast path - assume success
    if let Ok(ExecutionResult::Success { output, .. }) = evm.transact_commit() {
        if let revm::primitives::Output::Create(_, Some(address)) = output {
            return Ok(address);
        }
    }
    Err("Contract creation failed".to_string())
}