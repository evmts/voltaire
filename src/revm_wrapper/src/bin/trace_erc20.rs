use revm::{
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytes, ExecutionResult, TransactTo, U256, B256,
        Env, TxEnv, BlockEnv, CfgEnv,
    },
    Evm,
};
use std::fs;

fn read_hex_file(path: &str) -> Vec<u8> {
    let content = fs::read_to_string(path).expect("Failed to read file");
    let hex_str = content.trim();
    let hex_str = if hex_str.starts_with("0x") {
        &hex_str[2..]
    } else {
        hex_str
    };
    hex::decode(hex_str).expect("Failed to decode hex")
}

fn main() {
    // Read bytecode
    let path = std::env::args().nth(1).unwrap_or_else(|| "../../test/evm/erc20_mint.hex".to_string());
    let bytecode = read_hex_file(&path);
    println!("Loaded ERC20 bytecode: {} bytes", bytecode.len());
    
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

    // Create EVM with debug logging
    let mut evm = Evm::builder()
        .with_db(db)
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
    println!("\n=== Starting REVM execution of ERC20 deployment ===");
    let result = evm.transact().expect("Transaction failed");
    
    match result.result {
        ExecutionResult::Success { output, gas_used, .. } => {
            println!("\n=== REVM: Deployment successful ===");
            println!("Gas used: {}", gas_used);
            match output {
                revm::primitives::Output::Create(_, Some(addr)) => {
                    println!("Contract deployed at: {:?}", addr);
                }
                _ => println!("No deployment address returned"),
            }
        }
        ExecutionResult::Revert { output, gas_used, .. } => {
            println!("\n=== REVM: Deployment reverted ===");
            println!("Gas used: {}", gas_used);
            println!("Revert data length: {}", output.len());
            println!("Revert data: {:?}", output);
            
            if output.len() >= 4 {
                let selector = u32::from_be_bytes([output[0], output[1], output[2], output[3]]);
                println!("Revert selector: 0x{:08x}", selector);
                if selector == 0x4e487b71 && output.len() >= 36 {
                    let panic_code = u32::from_be_bytes([output[32], output[33], output[34], output[35]]);
                    println!("Solidity panic code: 0x{:02x} ({})", panic_code, match panic_code {
                        0x01 => "Assertion failed",
                        0x11 => "Arithmetic overflow/underflow",
                        0x12 => "Division by zero",
                        0x21 => "Invalid enum value",
                        0x22 => "Storage byte array encode error",
                        0x31 => "Pop empty array",
                        0x32 => "Array index out of bounds",
                        0x41 => "Allocate too much memory or array too large",
                        0x51 => "Call invalid internal function",
                        _ => "Unknown panic code",
                    });
                }
            }
        }
        ExecutionResult::Halt { reason, gas_used } => {
            println!("\n=== REVM: Deployment halted ===");
            println!("Reason: {:?}", reason);
            println!("Gas used: {}", gas_used);
        }
    }
}