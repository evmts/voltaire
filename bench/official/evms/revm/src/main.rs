use std::{env, fs, str::FromStr};

use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{specification::PRAGUE, Address, Bytes, TxKind, U256, AccountInfo},
    Evm,
    inspector_handle_register,
    inspectors::TracerEip3155,
};

const CALLER_ADDRESS: &str = "0x1000000000000000000000000000000000000001";

fn main() {
    let args: Vec<String> = env::args().collect();
    
    // Fast argument parsing without validation
    let mut contract_code_path = String::new();
    let mut calldata_hex = String::new();
    let mut num_runs: u8 = 1;
    let mut trace_path: Option<String> = None;
    
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
            "--trace" => {
                trace_path = Some(args[i + 1].clone());
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
    
    // Deploy the contract first to get runtime code
    let contract_address = Address::from_str("0x5FbDB2315678afecb367f032d93F642f64180aa3").unwrap();
    
    // Deploy in a separate scope to release the database borrow
    let runtime_code = {
        // First, deploy the contract using CREATE
        let mut deploy_evm = Evm::builder()
            .with_db(&mut db)
            .with_spec_id(PRAGUE)
            .modify_tx_env(|tx| {
                tx.caller = caller_address;
                tx.transact_to = TxKind::Create;
                tx.value = U256::ZERO;
                tx.data = contract_code.clone();
                tx.gas_limit = 10_000_000;
                tx.gas_price = U256::from(10u64);
            })
            .modify_block_env(|block| {
                block.basefee = U256::from(7u64);
            })
            .build();
        
        let deploy_result = deploy_evm.transact().unwrap();
        
        // Extract the deployed runtime code
        if deploy_result.result.is_success() {
            match deploy_result.result {
                revm::primitives::ExecutionResult::Success { output, .. } => {
                    match output {
                        revm::primitives::Output::Create(bytes, _) => bytes,
                        _ => panic!("Unexpected output type from CREATE"),
                    }
                }
                _ => panic!("Contract deployment failed"),
            }
        } else {
            panic!("Contract deployment failed: {:?}", deploy_result.result);
        }
    }; // deploy_evm is dropped here, releasing the borrow on db
    
    // Now set the runtime code at the contract address
    let contract_info = AccountInfo {
        balance: U256::ZERO,
        nonce: 1, // Nonce incremented after deployment
        code_hash: revm::primitives::keccak256(&runtime_code),
        code: Some(revm::primitives::Bytecode::new_raw(runtime_code)),
    };
    db.insert_account_info(contract_address, contract_info);
    
    // Create EVM instance with optional tracing
    if let Some(trace_path) = trace_path {
        // Open trace file
        let trace_file = fs::File::create(&trace_path).unwrap();
        let mut tracer = TracerEip3155::new(Box::new(trace_file));
        
        {
            let mut evm = Evm::builder()
                .with_db(&mut db)
                .with_spec_id(PRAGUE)
                .with_external_context(&mut tracer)
                .append_handler_register(inspector_handle_register)
                .modify_tx_env(|tx| {
                    tx.caller = caller_address;
                    tx.transact_to = TxKind::Call(contract_address);
                    tx.value = U256::ZERO;
                    tx.data = calldata.clone();
                    tx.gas_limit = 1_000_000_000; // 1B gas
                    tx.gas_price = U256::from(10u64);
                })
                .modify_block_env(|block| {
                    block.basefee = U256::from(7u64);
                })
                .build();
            
            // Run once with tracing
            let result = evm.transact().unwrap();
            if !result.result.is_success() {
                panic!("Contract execution failed: {:?}", result.result);
            }
        }
        // EVM is dropped here, releasing the borrow on tracer
        
        // Ensure tracer is dropped to flush output
        drop(tracer);
    } else {
        // Normal benchmark execution without tracing
        let mut evm = Evm::builder()
            .with_db(&mut db)
            .with_spec_id(PRAGUE)
            .modify_tx_env(|tx| {
                tx.caller = caller_address;
                tx.transact_to = TxKind::Call(contract_address);
                tx.value = U256::ZERO;
                tx.data = calldata.clone();
                tx.gas_limit = 1_000_000_000; // 1B gas
                tx.gas_price = U256::from(10u64);
            })
            .modify_block_env(|block| {
                block.basefee = U256::from(7u64);
            })
            .build();
        
        // Run the benchmark num_runs times
        for _ in 0..num_runs {
            let start = std::time::Instant::now();
            
            let result = evm.transact().unwrap();
            
            let duration = start.elapsed();
            let duration_ms = duration.as_secs_f64() * 1000.0;
            
            if !result.result.is_success() {
                panic!("Contract execution failed: {:?}", result.result);
            }
            
            // Output timing in milliseconds (one per line as expected by orchestrator)
            println!("{:.6}", duration_ms);
        }
    }
}

