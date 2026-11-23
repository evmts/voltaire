# BLAKE2

RFC 7693 BLAKE2b and BLAKE2s hash functions in `voltaire::crypto` with variable output lengths and both one-shot and streaming interfaces.

## Variants

| Algorithm | Word Size | Output Range | One-shot Function | Streaming Type |
|-----------|-----------|--------------|-------------------|----------------|
| BLAKE2b | 64-bit | `1`..`64` bytes | `blake2b(data: &[u8], output_len: usize) -> Vec<u8>` | `Blake2b` |
| BLAKE2s | 32-bit | `1`..`32` bytes | `blake2s(data: &[u8], output_len: usize) -> Vec<u8>` | `Blake2s` |

## Usage

```rust
use voltaire::crypto::{blake2b, blake2s, Blake2b, Blake2s};

// One-shot BLAKE2b (1..=64 bytes)
let digest_32: Vec<u8> = blake2b(b"hello", 32);
let digest_64: Vec<u8> = blake2b(b"hello", 64);
assert_eq!(digest_32.len(), 32);
assert_eq!(digest_64.len(), 64);

// Streaming BLAKE2b
let mut b = Blake2b::new(32);
b.update(b"hello");
b.update(b" world");
assert_eq!(b.finalize(), blake2b(b"hello world", 32));

// One-shot and streaming BLAKE2s (1..=32 bytes)
let s_16: Vec<u8> = blake2s(b"hello", 16);
assert_eq!(s_16.len(), 16);

let mut s = Blake2s::new(32);
s.update(b"hello");
s.update(b" world");
assert_eq!(s.finalize(), blake2s(b"hello world", 32));
```

## Notes

- Passing `output_len` outside `1..=64` (BLAKE2b) or `1..=32` (BLAKE2s) is clamped or rejected by the implementation; always pass a valid digest length in range.
- Both implementations are pure Rust and work in `no_std` (with `alloc`).
