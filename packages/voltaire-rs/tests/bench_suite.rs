//! Release-mode benchmark suite for voltaire-rs primitives and cryptography.
//!
//! Run individual suites via:
//!   cargo test --release --test bench_suite <suite_name> -- --nocapture

use std::hint::black_box;
use std::time::Instant;
use voltaire::crypto::{blake2b, blake2s, hash_message, hmac_sha256, keccak256, ripemd160, sha256, P256};
use voltaire::primitives::{
    abi, blob, bytecode, rlp, AccessList, Address, Hash, Hex, TransactionType, U256,
};

struct Metric {
    name: &'static str,
    mean_ns: f64,
    min_ns: f64,
    max_ns: f64,
    samples: usize,
}

fn measure<F: FnMut()>(name: &'static str, mut f: F) -> Metric {
    // Warmup
    for _ in 0..200 {
        f();
    }
    // Calibrate iterations per sample (~1ms per sample, 15 samples)
    let cal_start = Instant::now();
    let mut cal_iters = 0usize;
    while cal_start.elapsed().as_nanos() < 2_000_000 && cal_iters < 200_000 {
        f();
        cal_iters += 1;
    }
    let batch = (cal_iters / 2).max(1);
    let samples = 15usize;
    let mut times = Vec::with_capacity(samples);
    for _ in 0..samples {
        let start = Instant::now();
        for _ in 0..batch {
            f();
        }
        let elapsed_ns = start.elapsed().as_nanos() as f64 / batch as f64;
        times.push(elapsed_ns);
    }
    let sum: f64 = times.iter().sum();
    let mean_ns = sum / samples as f64;
    let min_ns = times.iter().cloned().fold(f64::INFINITY, f64::min);
    let max_ns = times.iter().cloned().fold(0.0_f64, f64::max);
    Metric {
        name,
        mean_ns,
        min_ns,
        max_ns,
        samples,
    }
}

fn emit_report(suite: &str, metrics: &[Metric]) {
    let entries: Vec<String> = metrics
        .iter()
        .map(|m| {
            let ops = if m.mean_ns > 0.0 {
                (1_000_000_000.0 / m.mean_ns).round() as u64
            } else {
                0
            };
            format!(
                r#"{{"name":"{}","unit":"ns/op","value":{:.3},"lowerIsBetter":true,"meanNs":{:.3},"minNs":{:.3},"maxNs":{:.3},"opsPerSec":{},"samples":{}}}"#,
                m.name, m.mean_ns, m.mean_ns, m.min_ns, m.max_ns, ops, m.samples
            )
        })
        .collect();
    println!(
        r#"SMTHRS_BENCH_JSON:{{"suite":"{}","runtime":"rust","metrics":[{}]}}"#,
        suite,
        entries.join(",")
    );
}

#[test]
fn bench_primitives_core() {
    let addr_hex = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
    let addr: Address = addr_hex.parse().unwrap();
    let hash_hex = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
    let hash: Hash = hash_hex.parse().unwrap();
    let raw_1kb = vec![0xabu8; 1024];
    let hex_1kb = Hex::encode(&raw_1kb);
    let u_a = U256::from(1_000_000_000_000_000_000u64);
    let u_b = U256::from(42_000_000_000u64);

    let metrics = vec![
        measure("Address::parse", || {
            black_box(black_box(addr_hex).parse::<Address>().unwrap());
        }),
        measure("Address::to_checksum", || {
            black_box(black_box(&addr).to_checksum());
        }),
        measure("Hash::parse", || {
            black_box(black_box(hash_hex).parse::<Hash>().unwrap());
        }),
        measure("Hash::to_hex", || {
            black_box(black_box(&hash).to_hex());
        }),
        measure("Hex::encode_1kb", || {
            black_box(Hex::encode(black_box(&raw_1kb)));
        }),
        measure("Hex::decode_1kb", || {
            black_box(Hex::decode(black_box(&hex_1kb)).unwrap());
        }),
        measure("U256::checked_add", || {
            black_box(black_box(u_a).checked_add(black_box(u_b)));
        }),
        measure("U256::checked_mul", || {
            black_box(black_box(u_a).checked_mul(black_box(u_b)));
        }),
    ];
    emit_report("voltaire-rs:primitives-core", &metrics);
}

#[test]
fn bench_primitives_encoding() {
    let short_bytes = [0xde, 0xad, 0xbe, 0xef];
    let long_bytes = vec![0xcd; 1024];
    let encoded_long = rlp::encode_bytes(&long_bytes);
    let code = vec![0x60, 0x80, 0x60, 0x40, 0x52, 0x5b, 0x00, 0x5b, 0x61, 0x00, 0x05, 0x56];
    let tx_bytes = [0x02u8, 0xf8, 0x50];
    let access_list = AccessList::new(vec![]);
    let blob_data = vec![0x42u8; 4096];

    let metrics = vec![
        measure("rlp::encode_bytes_4b", || {
            black_box(rlp::encode_bytes(black_box(&short_bytes)));
        }),
        measure("rlp::encode_bytes_1kb", || {
            black_box(rlp::encode_bytes(black_box(&long_bytes)));
        }),
        measure("rlp::decode_bytes_1kb", || {
            black_box(rlp::decode_bytes(black_box(&encoded_long)).unwrap());
        }),
        measure("abi::function_selector", || {
            black_box(abi::function_selector(black_box("transfer(address,uint256)")));
        }),
        measure("bytecode::analyze_jumpdests", || {
            black_box(bytecode::analyze_jumpdests(black_box(&code)));
        }),
        measure("TransactionType::detect", || {
            black_box(TransactionType::detect(black_box(&tx_bytes)));
        }),
        measure("AccessList::gas_cost", || {
            black_box(black_box(&access_list).gas_cost());
        }),
        measure("blob::blob_from_data_4kb", || {
            black_box(blob::blob_from_data(black_box(&blob_data)).unwrap());
        }),
    ];
    emit_report("voltaire-rs:primitives-encoding", &metrics);
}

#[test]
fn bench_crypto() {
    let data_32 = [0x11u8; 32];
    let data_1kb = vec![0x22u8; 1024];
    let key = [0x33u8; 32];
    let p256_sk = [0x07u8; 32];
    let p256_pk = P256::derive_public_key(&p256_sk).unwrap();
    let p256_sig = P256::sign(&data_32, &p256_sk).unwrap();

    let metrics = vec![
        measure("keccak256_32b", || {
            black_box(keccak256(black_box(&data_32)));
        }),
        measure("keccak256_1kb", || {
            black_box(keccak256(black_box(&data_1kb)));
        }),
        measure("sha256_32b", || {
            black_box(sha256(black_box(&data_32)));
        }),
        measure("sha256_1kb", || {
            black_box(sha256(black_box(&data_1kb)));
        }),
        measure("ripemd160_32b", || {
            black_box(ripemd160(black_box(&data_32)));
        }),
        measure("blake2b_32b", || {
            black_box(blake2b(black_box(&data_32), 32));
        }),
        measure("blake2s_32b", || {
            black_box(blake2s(black_box(&data_32), 32));
        }),
        measure("hmac_sha256_32b", || {
            black_box(hmac_sha256(black_box(&key), black_box(&data_32)));
        }),
        measure("eip191_hash_message", || {
            black_box(hash_message(black_box(b"Hello, Ethereum!")));
        }),
        measure("p256_sign", || {
            black_box(P256::sign(black_box(&data_32), black_box(&p256_sk)).unwrap());
        }),
        measure("p256_verify", || {
            black_box(P256::verify(black_box(&data_32), black_box(&p256_sig), black_box(&p256_pk)).unwrap());
        }),
    ];
    emit_report("voltaire-rs:crypto", &metrics);
}
