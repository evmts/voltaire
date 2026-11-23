#!/usr/bin/env python3
"""
Voltaire Python bindings performance benchmark runner.
Supports per-module incremental execution via --module <name> and emits
canonical SMTHRS_BENCH_JSON output for Smithers Bench targets.
"""

from __future__ import annotations

import argparse
import json
import statistics
import time
from typing import Callable, List, Dict, Any

import voltaire


def measure(name: str, fn: Callable[[], Any], samples: int = 15) -> Dict[str, Any]:
    for _ in range(50):
        fn()
    t0 = time.perf_counter_ns()
    cal = 0
    while (time.perf_counter_ns() - t0) < 2_000_000 and cal < 100_000:
        fn()
        cal += 1
    batch = max(1, cal // 2)
    results: List[float] = []
    for _ in range(samples):
        start = time.perf_counter_ns()
        for _ in range(batch):
            fn()
        elapsed = (time.perf_counter_ns() - start) / batch
        results.append(elapsed)
    mean_ns = statistics.mean(results)
    median_ns = statistics.median(results)
    min_ns = min(results)
    max_ns = max(results)
    return {
        "name": name,
        "unit": "ns/op",
        "value": round(mean_ns, 3),
        "lowerIsBetter": True,
        "meanNs": round(mean_ns, 3),
        "medianNs": round(median_ns, 3),
        "minNs": round(min_ns, 3),
        "maxNs": round(max_ns, 3),
        "opsPerSec": round(1_000_000_000 / mean_ns) if mean_ns > 0 else 0,
        "samples": samples,
    }


def bench_address() -> List[Dict[str, Any]]:
    from voltaire import Address
    hex_addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0"
    addr = Address.from_hex(hex_addr)
    raw = bytes(range(20))
    return [
        measure("Address.from_hex", lambda: Address.from_hex(hex_addr)),
        measure("Address.from_bytes", lambda: Address.from_bytes(raw)),
        measure("Address.to_hex", lambda: addr.to_hex()),
        measure("Address.to_checksum", lambda: addr.to_checksum()),
        measure("Address.validate_checksum", lambda: Address.validate_checksum(hex_addr)),
    ]


def bench_hex() -> List[Dict[str, Any]]:
    from voltaire import hex_encode, hex_decode
    b32 = bytes(range(32))
    b1k = bytes([0xAB] * 1024)
    h32 = hex_encode(b32)
    h1k = hex_encode(b1k)
    return [
        measure("hex_encode_32b", lambda: hex_encode(b32)),
        measure("hex_encode_1kb", lambda: hex_encode(b1k)),
        measure("hex_decode_32b", lambda: hex_decode(h32)),
        measure("hex_decode_1kb", lambda: hex_decode(h1k)),
    ]


def bench_hash() -> List[Dict[str, Any]]:
    from voltaire import Hash, keccak256, sha256, blake2b, ripemd160, eip191_hash_message
    d32 = bytes([0x42] * 32)
    d1k = bytes([0x42] * 1024)
    hhex = "0x" + "ab" * 32
    return [
        measure("keccak256_32b", lambda: keccak256(d32)),
        measure("keccak256_1kb", lambda: keccak256(d1k)),
        measure("sha256_32b", lambda: sha256(d32)),
        measure("blake2b_32b", lambda: blake2b(d32)),
        measure("ripemd160_32b", lambda: ripemd160(d32)),
        measure("eip191_hash_message", lambda: eip191_hash_message(b"Hello Ethereum")),
        measure("Hash.from_hex", lambda: Hash.from_hex(hhex)),
    ]


def bench_uint256() -> List[Dict[str, Any]]:
    from voltaire import Uint256
    h = "0x" + "0" * 48 + "0de0b6b3a7640000"
    u = Uint256.from_hex(h)
    return [
        measure("Uint256.from_hex", lambda: Uint256.from_hex(h)),
        measure("Uint256.from_int", lambda: Uint256.from_int(10**18)),
        measure("Uint256.to_hex", lambda: u.to_hex()),
        measure("Uint256.to_int", lambda: u.to_int()),
    ]


def bench_rlp() -> List[Dict[str, Any]]:
    from voltaire import rlp_encode
    short = b"\xde\xad\xbe\xef"
    long_b = bytes([0xCD] * 1024)
    return [
        measure("rlp_encode_4b", lambda: rlp_encode(short)),
        measure("rlp_encode_1kb", lambda: rlp_encode(long_b)),
    ]


def bench_abi() -> List[Dict[str, Any]]:
    from voltaire.abi import Abi
    return [
        measure("Abi.compute_selector", lambda: Abi.compute_selector("transfer(address,uint256)")),
    ]


def bench_bytecode() -> List[Dict[str, Any]]:
    from voltaire.bytecode import Bytecode
    code = Bytecode(bytes([0x60, 0x80, 0x60, 0x40, 0x52, 0x5B, 0x00, 0x5B, 0x61, 0x00, 0x05, 0x56]))
    return [
        measure("Bytecode.analyze_jumpdests", lambda: code.analyze_jumpdests()),
    ]


def bench_blob() -> List[Dict[str, Any]]:
    from voltaire.blob import Blob
    data = bytes([0x42] * 4096)
    blob = Blob.from_data(data)
    return [
        measure("Blob.from_data_4kb", lambda: Blob.from_data(data)),
        measure("Blob.to_data_4kb", lambda: blob.to_data()),
    ]


SUITES = {
    "address": bench_address,
    "hex": bench_hex,
    "hash": bench_hash,
    "uint256": bench_uint256,
    "rlp": bench_rlp,
    "abi": bench_abi,
    "bytecode": bench_bytecode,
    "blob": bench_blob,
}


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--module", default="all", choices=["all", *SUITES.keys()])
    args = parser.parse_args()
    metrics: List[Dict[str, Any]] = []
    if args.module == "all":
        for fn in SUITES.values():
            metrics.extend(fn())
    else:
        metrics.extend(SUITES[args.module]())
    report = {"suite": f"voltaire-py:{args.module}", "runtime": "python3", "metrics": metrics}
    print("SMTHRS_BENCH_JSON:" + json.dumps(report))


if __name__ == "__main__":
    main()
