use revm::{
    Database,
    db::{CacheDB, EmptyDB},
    primitives::{
        Address, Bytecode, Bytes, ExecutionResult, TransactTo, U256, B256,
        Env, TxEnv, BlockEnv, CfgEnv, CfgEnvWithHandlerCfg,
    },
    Evm,
    inspector_handle_register,
    inspectors::TracerEip3155,
};
use std::fs::File;
use std::io::Write;

/// Test function to trace ERC20 deployment with REVM
pub fn trace_erc20_deployment(bytecode: &[u8]) -> Result<(), Box<dyn std::error::Error>> {
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

    // Create EVM with tracer
    let mut tracer = TracerEip3155::new(Box::new(std::io::stdout()));
    
    let mut evm = Evm::builder()
        .with_db(db)
        .with_external_context(&mut tracer)
        .append_handler_register(inspector_handle_register)
        .build();

    // Set up environment
    evm.context.evm.env = Env {
        cfg: CfgEnv::default(),
        block: BlockEnv {
            number: U256::from(1),
            timestamp: U256::from(1),
            gas_limit: U256::from(30_000_000),
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

    // Execute and capture trace
    println!("=== Starting REVM trace of ERC20 deployment ===");
    let result = evm.transact()?;
    
    match result.result {
        ExecutionResult::Success { output, gas_used, .. } => {
            println!("\n=== Deployment successful ===");
            println!("Gas used: {}", gas_used);
            match output {
                revm::primitives::Output::Create(_, Some(addr)) => {
                    println!("Contract deployed at: {:?}", addr);
                }
                _ => println!("No deployment address returned"),
            }
        }
        ExecutionResult::Revert { output, gas_used, .. } => {
            println!("\n=== Deployment reverted ===");
            println!("Gas used: {}", gas_used);
            println!("Revert data: {:?}", output);
            if output.len() >= 4 {
                let selector = u32::from_be_bytes([output[0], output[1], output[2], output[3]]);
                println!("Revert selector: 0x{:08x}", selector);
                if selector == 0x4e487b71 && output.len() >= 36 {
                    let panic_code = u32::from_be_bytes([output[32], output[33], output[34], output[35]]);
                    println!("Solidity panic code: 0x{:02x}", panic_code);
                }
            }
        }
        ExecutionResult::Halt { reason, gas_used } => {
            println!("\n=== Deployment halted ===");
            println!("Reason: {:?}", reason);
            println!("Gas used: {}", gas_used);
        }
    }
    
    Ok(())
}

/// Alternative: trace to file
pub fn trace_erc20_to_file(bytecode: &[u8], output_path: &str) -> Result<(), Box<dyn std::error::Error>> {
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

    // Create output file
    let mut file = File::create(output_path)?;
    
    // Create EVM with tracer that writes to file
    let mut tracer = TracerEip3155::new(Box::new(file));
    
    let mut evm = Evm::builder()
        .with_db(db)
        .with_external_context(&mut tracer)
        .append_handler_register(inspector_handle_register)
        .build();

    // Set up environment
    evm.context.evm.env = Env {
        cfg: CfgEnv::default(),
        block: BlockEnv {
            number: U256::from(1),
            timestamp: U256::from(1),
            gas_limit: U256::from(30_000_000),
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
    println!("Tracing ERC20 deployment to file: {}", output_path);
    let result = evm.transact()?;
    
    match result.result {
        ExecutionResult::Success { .. } => {
            println!("Deployment successful - trace written to {}", output_path);
        }
        ExecutionResult::Revert { output, .. } => {
            println!("Deployment reverted - trace written to {}", output_path);
            if output.len() >= 36 && u32::from_be_bytes([output[0], output[1], output[2], output[3]]) == 0x4e487b71 {
                let panic_code = u32::from_be_bytes([output[32], output[33], output[34], output[35]]);
                println!("Solidity panic code: 0x{:02x}", panic_code);
            }
        }
        ExecutionResult::Halt { reason, .. } => {
            println!("Deployment halted: {:?} - trace written to {}", reason, output_path);
        }
    }
    
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
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
    
    #[test]
    fn test_trace_erc20() {
        let bytecode = read_hex_file("../../test/evm/erc20_mint.hex");
        trace_erc20_to_file(&bytecode, "revm_erc20_trace.json").expect("Failed to trace");
    }
}