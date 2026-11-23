---
"@tevm/voltaire": minor
"@tevm/zig": minor
---

Implement Fusaka/Osaka consensus core across TypeScript and Zig:

- **EIP-7951 (`P256VERIFY` precompile at `0x0100`, Osaka+)**: 6900 fixed gas cost, strict 160-byte input (`h || r || s || qx || qy`), accepts high-s signatures (`n/2 < s < n`), raw 32-byte digest with `h mod n == 0` support, `R.x mod n == r` reduction, canonical field/curve/infinity validation, non-reverting empty output on invalid input/signature, Out-of-Gas halt when `gasLimit < 6900`, Osaka+ hardfork gating, and full 782-vector go-ethereum/Wycheproof conformance suite in both TS and Zig.
- **EIP-7691 / EIP-7892 / EIP-7918 Blob Fee Market & BPO Schedules**: Added `BlobSchedule` presets (`cancun`, `prague`, `osaka`, `bpo1` at `1765290071`, `bpo2` at `1767747671`), hardfork and mainnet timestamp lookups, overflow-safe exact exponential blob base fee calculation (`u512` in Zig, early-exit threshold bound in TS and Zig), and EIP-7918 execution-bounded reserve-price `calculateExcessBlobGas` with 100% backwards compatibility for the 2-argument Cancun API.
