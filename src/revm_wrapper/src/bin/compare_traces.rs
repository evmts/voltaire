use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, TransactTo, U256, B256,
        Env, TxEnv, BlockEnv, CfgEnv,
    },
    Evm,
    inspector_handle_register,
    inspectors::TracerEip3155,
};
use std::fs;
use std::io::{Write, BufReader, BufRead};
use serde_json::Value;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    if args.len() < 3 {
        eprintln!("Usage: {} <erc20_bytecode.bin> <zig_trace.json>", args[0]);
        std::process::exit(1);
    }

    // Read the ERC20 bytecode
    let bytecode_hex = fs::read_to_string(&args[1])
        .expect("Failed to read bytecode file");
    let bytecode = hex::decode(bytecode_hex.trim()).expect("Failed to decode bytecode");

    // Create REVM trace file
    let mut revm_trace_file = fs::File::create("revm_trace_for_comparison.json")
        .expect("Failed to create REVM trace file");
    
    // Run REVM with tracer
    run_revm_with_trace(&bytecode, &mut revm_trace_file);
    revm_trace_file.flush().unwrap();
    
    // Now compare the traces
    println!("\n=== Comparing traces ===");
    compare_traces("revm_trace_for_comparison.json", &args[2]);
}

fn run_revm_with_trace(bytecode: &[u8], trace_file: &mut fs::File) {
    // Create database
    let mut db = CacheDB::new(EmptyDB::default());
    
    // Set up caller with balance
    let caller = Address::from([0x10, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]);
    db.insert_account_info(
        caller,
        revm::primitives::AccountInfo {
            balance: U256::MAX,
            nonce: 0,
            code_hash: B256::ZERO,
            code: None,
        }
    );
    
    // Create tracer
    let mut tracer = TracerEip3155::new(Box::new(trace_file.try_clone().unwrap()));
    
    // Create EVM with tracer
    let mut evm = Evm::builder()
        .with_db(db)
        .with_external_context(&mut tracer)
        .append_handler_register(inspector_handle_register)
        .build();
    
    // Set up environment
    *evm.context.evm.env = Env {
        cfg: CfgEnv::default(),
        block: BlockEnv {
            number: U256::from(1),
            timestamp: U256::from(1),
            gas_limit: U256::from(1_000_000_000),
            ..Default::default()
        },
        tx: TxEnv {
            caller,
            gas_limit: 1_000_000_000,
            data: Bytes::from(bytecode.to_vec()),
            transact_to: TransactTo::Create,
            ..Default::default()
        },
    };
    
    // Execute
    let result = evm.transact().expect("Transaction failed");
    
    match result.result {
        ExecutionResult::Success { gas_used, .. } => {
            println!("REVM: Success, gas used: {}", gas_used);
        }
        ExecutionResult::Revert { gas_used, .. } => {
            println!("REVM: Reverted, gas used: {}", gas_used);
        }
        ExecutionResult::Halt { reason, gas_used } => {
            println!("REVM: Halted ({:?}), gas used: {}", reason, gas_used);
        }
    }
}

fn compare_traces(revm_trace_path: &str, zig_trace_path: &str) {
    let revm_file = fs::File::open(revm_trace_path).expect("Failed to open REVM trace");
    let zig_file = fs::File::open(zig_trace_path).expect("Failed to open Zig trace");
    
    let revm_reader = BufReader::new(revm_file);
    let zig_reader = BufReader::new(zig_file);
    
    let mut revm_lines = revm_reader.lines();
    let mut zig_lines = zig_reader.lines();
    
    let mut line_num = 0;
    let mut last_matching_lines: Vec<(String, String)> = Vec::new();
    
    loop {
        line_num += 1;
        
        let revm_line = revm_lines.next();
        let zig_line = zig_lines.next();
        
        match (revm_line, zig_line) {
            (None, None) => {
                println!("✅ Both traces ended at the same point");
                break;
            }
            (Some(_), None) => {
                println!("❌ Zig trace ended early at line {}", line_num);
                break;
            }
            (None, Some(_)) => {
                println!("❌ REVM trace ended early at line {}", line_num);
                break;
            }
            (Some(Ok(revm)), Some(Ok(zig))) => {
                // Parse JSON
                let revm_json: Value = serde_json::from_str(&revm).expect("Invalid REVM JSON");
                let zig_json: Value = serde_json::from_str(&zig).expect("Invalid Zig JSON");
                
                // Compare key fields
                let revm_pc = revm_json["pc"].as_u64().unwrap();
                let zig_pc = zig_json["pc"].as_u64().unwrap();
                
                if revm_pc != zig_pc {
                    println!("\n❌ PC divergence at line {}:", line_num);
                    println!("  REVM PC: {}", revm_pc);
                    println!("  Zig PC:  {}", zig_pc);
                    show_context(&last_matching_lines);
                    break;
                }
                
                let revm_op = revm_json["op"].as_u64().unwrap();
                let zig_op = zig_json["op"].as_u64().unwrap();
                
                if revm_op != zig_op {
                    println!("\n❌ Opcode divergence at line {} (PC {}):", line_num, revm_pc);
                    println!("  REVM op: {} ({})", revm_op, revm_json["opName"].as_str().unwrap_or("?"));
                    println!("  Zig op:  {} ({})", zig_op, zig_json["opName"].as_str().unwrap_or("?"));
                    show_context(&last_matching_lines);
                    break;
                }
                
                // Compare stacks
                let revm_stack = revm_json["stack"].as_array().unwrap();
                let zig_stack = zig_json["stack"].as_array().unwrap();
                
                if revm_stack.len() != zig_stack.len() {
                    println!("\n❌ Stack size divergence at line {} (PC {}):", line_num, revm_pc);
                    println!("  REVM stack size: {}", revm_stack.len());
                    println!("  Zig stack size:  {}", zig_stack.len());
                    println!("  REVM: {}", revm);
                    println!("  Zig:  {}", zig);
                    show_context(&last_matching_lines);
                    break;
                }
                
                // Compare stack values
                let mut stack_differs = false;
                for (i, (revm_val, zig_val)) in revm_stack.iter().zip(zig_stack.iter()).enumerate() {
                    if revm_val != zig_val {
                        println!("\n❌ Stack divergence at line {} (PC {}):", line_num, revm_pc);
                        println!("  Opcode: {} ({})", revm_op, revm_json["opName"].as_str().unwrap_or("?"));
                        println!("  Stack position {} differs:", i);
                        println!("    REVM: {}", revm_val);
                        println!("    Zig:  {}", zig_val);
                        println!("\n  Full stacks:");
                        println!("    REVM: {:?}", revm_stack);
                        println!("    Zig:  {:?}", zig_stack);
                        show_context(&last_matching_lines);
                        stack_differs = true;
                        break;
                    }
                }
                
                if stack_differs {
                    break;
                }
                
                // Keep last few matching lines for context
                last_matching_lines.push((revm.clone(), zig.clone()));
                if last_matching_lines.len() > 10 {
                    last_matching_lines.remove(0);
                }
                
                // Also print progress for key operations
                if revm_pc == 277 && revm_json["opName"].as_str() == Some("SUB") {
                    println!("\n=== SUB operation at PC 277 ===");
                    println!("REVM stack: {:?}", revm_stack);
                    println!("Zig stack:  {:?}", zig_stack);
                }
            }
            _ => {
                println!("Error reading traces at line {}", line_num);
                break;
            }
        }
    }
}

fn show_context(last_lines: &[(String, String)]) {
    println!("\n  Context (last {} matching operations):", last_lines.len());
    for (i, (revm, _)) in last_lines.iter().enumerate() {
        let json: Value = serde_json::from_str(revm).unwrap();
        println!("    {}: PC {} - {} ({})", 
            i + 1,
            json["pc"].as_u64().unwrap(),
            json["opName"].as_str().unwrap_or("?"),
            json["op"].as_u64().unwrap()
        );
    }
}