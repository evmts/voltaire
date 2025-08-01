use std::{env, fs, process, str::FromStr, time::Instant};

use revm::{
    primitives::{Address, Bytes, ExecutionResult, TxKind, U256},
    db::{CacheDB, EmptyDB},
    Evm,
};

const CALLER_ADDRESS: &str = "0x1000000000000000000000000000000000000001";

fn main() {
    let args: Vec<String> = env::args().collect();
    
    if args.len() < 5 {
        eprintln!("Usage: {} --contract-code-path <path> --calldata <hex> [--num-runs <n>]", args[0]);
        eprintln!("Example: {} --contract-code-path bytecode.txt --calldata 0x12345678", args[0]);
        process::exit(1);
    }
    
    let mut contract_code_path = String::new();
    let mut calldata_hex = String::new();
    let mut num_runs: u8 = 1;
    
    let mut i = 1;
    while i < args.len() {
        match args[i].as_str() {
            "--contract-code-path" => {
                if i + 1 >= args.len() {
                    eprintln!("Error: --contract-code-path requires a value");
                    process::exit(1);
                }
                contract_code_path = args[i + 1].clone();
                i += 2;
            }
            "--calldata" => {
                if i + 1 >= args.len() {
                    eprintln!("Error: --calldata requires a value");
                    process::exit(1);
                }
                calldata_hex = args[i + 1].clone();
                i += 2;
            }
            "--num-runs" => {
                if i + 1 >= args.len() {
                    eprintln!("Error: --num-runs requires a value");
                    process::exit(1);
                }
                num_runs = args[i + 1].parse().unwrap_or_else(|_| {
                    eprintln!("Error: --num-runs must be a number");
                    process::exit(1);
                });
                i += 2;
            }
            _ => {
                eprintln!("Error: Unknown argument {}", args[i]);
                process::exit(1);
            }
        }
    }
    
    if contract_code_path.is_empty() || calldata_hex.is_empty() {
        eprintln!("Error: --contract-code-path and --calldata are required");
        process::exit(1);
    }
    
    let caller_address = Address::from_str(CALLER_ADDRESS).unwrap();
    
    let contract_code_hex = fs::read_to_string(&contract_code_path)
        .unwrap_or_else(|e| {
            eprintln!("Error reading contract code file: {}", e);
            process::exit(1);
        })
        .trim()
        .to_string();
    
    let contract_code: Bytes = hex::decode(&contract_code_hex)
        .unwrap_or_else(|e| {
            eprintln!("Error decoding contract code hex: {}", e);
            process::exit(1);
        })
        .into();
    
    let calldata: Bytes = hex::decode(&calldata_hex)
        .unwrap_or_else(|e| {
            eprintln!("Error decoding calldata hex: {}", e);
            process::exit(1);
        })
        .into();
    
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
    let contract_address = deploy_contract(&mut db, caller_address, &contract_code)
        .expect("Failed to deploy contract");
    
    // Run the benchmark num_runs times
    for _ in 0..num_runs {
        let timer = Instant::now();
        
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
            
        let exec_result = evm.transact_commit();
        let dur = timer.elapsed();
        
        match exec_result {
            Ok(ExecutionResult::Success { .. }) => {
                println!("{}", dur.as_micros() as f64 / 1e3);
            }
            Ok(ExecutionResult::Revert { output, .. }) => {
                let reason = if output.len() > 4 {
                    String::from_utf8_lossy(&output[4..])
                } else {
                    std::borrow::Cow::Borrowed("Execution reverted")
                };
                panic!("Execution reverted: {}", reason);
            }
            Ok(ExecutionResult::Halt { reason, .. }) => {
                panic!("Execution halted: {:?}", reason);
            }
            Err(e) => {
                panic!("Execution failed: {:?}", e);
            }
        }
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
        
    match evm.transact_commit() {
        Ok(ExecutionResult::Success { output, .. }) => {
            match output {
                revm::primitives::Output::Create(_, Some(address)) => Ok(address),
                _ => Err("Contract creation failed - no address returned".to_string()),
            }
        }
        Ok(ExecutionResult::Revert { output, .. }) => {
            let reason = if output.len() > 4 {
                String::from_utf8_lossy(&output[4..]).to_string()
            } else {
                "Contract creation reverted".to_string()
            };
            Err(reason)
        }
        Ok(ExecutionResult::Halt { reason, .. }) => {
            Err(format!("Contract creation halted: {:?}", reason))
        }
        Err(e) => Err(format!("Contract creation failed: {:?}", e)),
    }
}