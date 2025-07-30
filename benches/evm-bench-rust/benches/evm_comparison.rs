use criterion::{black_box, criterion_group, criterion_main, Criterion};
use guillotine_rs::{Evm, EvmBuilder, address_from_hex};
use alloy_primitives::{Address, U256};
use revm::{
    primitives::{
        Address as RevmAddress, U256 as RevmU256, TransactTo, TxEnv, Env, SpecId, ExecutionResult,
    },
    Evm as RevmEvm, InMemoryDB,
};

fn setup_guillotine() -> Evm {
    let mut evm = EvmBuilder::new().build().expect("Failed to create Guillotine EVM");
    
    // Setup test accounts
    let sender = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
    let receiver = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
    
    evm.set_balance(sender, U256::from(1_000_000_000u64)).unwrap();
    evm.set_balance(receiver, U256::from(0)).unwrap();
    
    evm
}

fn setup_revm() -> RevmEvm<'static, (), InMemoryDB> {
    let mut evm = RevmEvm::builder()
        .with_db(InMemoryDB::default())
        .with_spec_id(SpecId::LONDON)
        .build();
    
    // Setup test accounts
    let sender = RevmAddress::from([0x11; 20]);
    let receiver = RevmAddress::from([0x22; 20]);
    
    evm.database_mut().insert_account_info(
        sender,
        revm::primitives::AccountInfo {
            balance: RevmU256::from(1_000_000_000u64),
            nonce: 0,
            code_hash: revm::primitives::KECCAK_EMPTY,
            code: None,
        },
    );
    
    evm.database_mut().insert_account_info(
        receiver,
        revm::primitives::AccountInfo {
            balance: RevmU256::from(0),
            nonce: 0,
            code_hash: revm::primitives::KECCAK_EMPTY,
            code: None,
        },
    );
    
    evm
}

fn bench_simple_transfer(c: &mut Criterion) {
    let mut group = c.benchmark_group("simple_transfer");
    
    // Guillotine benchmark
    group.bench_function("guillotine", |b| {
        b.iter(|| {
            let mut evm = setup_guillotine();
            let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
            let to = address_from_hex("0x2222222222222222222222222222222222222222").unwrap();
            
            let result = evm.execute(
                black_box(from),
                black_box(Some(to)),
                black_box(U256::from(1000)),
                black_box(&[]),
                black_box(21000),
            ).unwrap();
            
            assert!(result.success);
            result
        });
    });
    
    // revm benchmark
    group.bench_function("revm", |b| {
        b.iter(|| {
            let mut evm = setup_revm();
            
            evm.env_mut().tx = TxEnv {
                caller: RevmAddress::from([0x11; 20]),
                transact_to: TransactTo::Call(RevmAddress::from([0x22; 20])),
                value: RevmU256::from(1000),
                data: Default::default(),
                gas_limit: 21000,
                gas_price: RevmU256::from(1),
                gas_priority_fee: None,
                nonce: Some(0),
                chain_id: Some(1),
                access_list: Vec::new(),
                blob_hashes: Vec::new(),
                max_fee_per_blob_gas: None,
                authorization_list: None,
            };
            
            let result = evm.transact_commit().unwrap();
            
            match result {
                ExecutionResult::Success { .. } => {},
                _ => panic!("Transaction should succeed"),
            }
            
            result
        });
    });
    
    group.finish();
}

fn bench_arithmetic_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("arithmetic_operations");
    
    // Bytecode for arithmetic operations (ADD, MUL, SUB)
    let arithmetic_bytecode = vec![
        0x60, 0x05, // PUSH1 5
        0x60, 0x03, // PUSH1 3
        0x01,       // ADD
        0x60, 0x02, // PUSH1 2
        0x02,       // MUL
        0x60, 0x01, // PUSH1 1
        0x03,       // SUB
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE
        0x60, 0x20, // PUSH1 32
        0x60, 0x00, // PUSH1 0
        0xf3,       // RETURN
    ];
    
    // Guillotine benchmark
    group.bench_function("guillotine", |b| {
        b.iter(|| {
            let mut evm = setup_guillotine();
            let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
            let contract_addr = address_from_hex("0x3333333333333333333333333333333333333333").unwrap();
            
            // Deploy contract
            evm.set_code(contract_addr, &arithmetic_bytecode).unwrap();
            
            let result = evm.execute(
                black_box(from),
                black_box(Some(contract_addr)),
                black_box(U256::ZERO),
                black_box(&[]),
                black_box(100000),
            ).unwrap();
            
            assert!(result.success);
            result
        });
    });
    
    group.finish();
}

fn bench_memory_operations(c: &mut Criterion) {
    let mut group = c.benchmark_group("memory_operations");
    
    // Bytecode for memory operations
    let memory_bytecode = vec![
        0x60, 0xff, // PUSH1 0xff
        0x60, 0x00, // PUSH1 0
        0x52,       // MSTORE (store 0xff at memory position 0)
        0x60, 0x00, // PUSH1 0
        0x51,       // MLOAD (load from memory position 0)
        0x60, 0x20, // PUSH1 32
        0x52,       // MSTORE (store loaded value at position 32)
        0x60, 0x20, // PUSH1 32
        0x60, 0x20, // PUSH1 32
        0xf3,       // RETURN
    ];
    
    // Guillotine benchmark
    group.bench_function("guillotine", |b| {
        b.iter(|| {
            let mut evm = setup_guillotine();
            let from = address_from_hex("0x1111111111111111111111111111111111111111").unwrap();
            let contract_addr = address_from_hex("0x4444444444444444444444444444444444444444").unwrap();
            
            // Deploy contract
            evm.set_code(contract_addr, &memory_bytecode).unwrap();
            
            let result = evm.execute(
                black_box(from),
                black_box(Some(contract_addr)),
                black_box(U256::ZERO),
                black_box(&[]),
                black_box(100000),
            ).unwrap();
            
            assert!(result.success);
            result
        });
    });
    
    group.finish();
}

criterion_group!(
    benches,
    bench_simple_transfer,
    bench_arithmetic_operations,
    bench_memory_operations
);
criterion_main!(benches);