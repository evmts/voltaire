# Event Log Decoding Research - Complete Summary

## Overview

Comprehensive research on how **ethers.js**, **viem**, and **ox** implement Ethereum event log decoding. All three libraries decode raw blockchain logs (topics + data) into structured event objects with decoded parameters.

---

## Deliverables

This research package includes:

1. **EVENT_LOG_DECODING_RESEARCH.md** (25KB)
   - Complete implementation details from all three libraries
   - Core concepts and algorithms
   - Topic/data combination logic
   - Error handling and edge cases
   - Real-world examples with code

2. **EVENT_DECODING_CODE_EXAMPLES.ts** (22KB)
   - Full source implementations from ethers.js, viem, ox
   - Generic unified algorithm
   - Practical examples with ERC20, dynamic types, multiple indexed params
   - Error handling patterns
   - Performance optimization strategies

3. **EVENT_DECODING_QUICK_REFERENCE.md** (8.5KB)
   - Quick lookup guide for algorithm
   - Implementation checklist
   - Common patterns
   - Decision trees
   - Pseudo-code template

---

## Core Algorithm (Universal Pattern)

All three libraries implement the same fundamental algorithm:

```
1. EXTRACT signature from topics[0]
2. LOOKUP event in ABI matching signature hash
3. VALIDATE topic[0] matches computed event selector
4. SEPARATE parameters: indexed vs non-indexed
5. DECODE indexed from topics[1:] (with special handling for dynamic types)
6. DECODE non-indexed from data field
7. RECONSTRUCT result in original parameter order
8. RETURN { eventName, args }
```

### Key Implementation Details

#### Topic[0] Verification
- Compute: `selector = keccak256("EventName(type1,type2,...)")`
- Compare: `selector == topics[0]`
- Purpose: Identify which event this log represents
- Non-recoverable: Can't reverse keccak256 hash

#### Dynamic Type Handling (Critical)
Indexed dynamic types (string, bytes, tuple, array) are stored as **keccak256 hashes**, not actual values:
```
event Log(string indexed text)
  -> topics[1] = keccak256("hello")
  -> Can't recover "hello" from hash
```

Non-indexed dynamic types are ABI-encoded in data field and are recoverable.

#### Parameter Reconstruction
Must maintain original parameter order from ABI:
```
Event(address indexed from, uint256 amount, address indexed to)
inputs: [from, amount, to]  <- MUST preserve this order

topics[1]: from value
data: amount value
topics[2]: to value

Result: { from: ..., amount: ..., to: ... }  <- Reconstructed in order
```

#### Array vs Object Return
- **Named parameters** → Object: `{ from: 0x..., to: 0x..., value: 100n }`
- **Unnamed parameters** → Array: `[0x..., 0x..., 100n]`

---

## Library-Specific Implementation

### ethers.js
**Location**: `src.ts/abi/interface.ts`

**API**: `interface.parseLog({ topics, data })`

**Key Characteristics**:
- Always strict (no silent failures)
- Returns `null` on signature mismatch (graceful)
- Wraps indexed values in `Indexed` class for dynamic types
- Separate decode paths for indexed and non-indexed via ABI coder
- Parameter reconstruction via `Result.fromItems()`

**Example**:
```typescript
const iface = new ethers.Interface(ABI)
const result = iface.parseLog({ topics, data })
// { name: "Transfer", args: {...}, fragment: {...} }
```

### viem
**Location**: `src/utils/abi/decodeEventLog.ts`

**API**: `decodeEventLog({ abi, topics, data, strict })`

**Key Characteristics**:
- Configurable strict mode (strict: true | false)
- Throws on signature mismatch in strict mode
- Silently fails in non-strict mode (partial decode)
- Clean return format: `{ eventName, args }`
- Special `decodeTopic()` for dynamic type handling
- Uses `decodeAbiParameters()` for batch decoding

**Example**:
```typescript
const result = decodeEventLog({
  abi: ERC20_ABI,
  topics: log.topics,
  data: log.data,
  strict: true
})
// { eventName: "Transfer", args: { from, to, value } }
```

### ox
**Location**: `src/core/AbiEvent.ts`

**API**: `AbiEvent.decode(abiEvent, log)`

**Key Characteristics**:
- Always strict
- Unopinionated design; delegates to primitives
- Flexible input: `(abi, name, log)` or `(abiEvent, log)`
- Compact, functional API
- Built on `AbiParameters.decode()` primitive

**Example**:
```typescript
const transfer = AbiEvent.from('event Transfer(address indexed from, address indexed to, uint256 value)')
const result = AbiEvent.decode(transfer, log)
// { from: 0x..., to: 0x..., value: 100n }
```

---

## Topic/Data Combination Logic

### Raw Log Structure
```
Log = {
  topics: [selector, indexed1, indexed2, indexed3],
  data: "0x..." // non-indexed params concatenated
}
```

### Separation Strategy
1. **Extract selector**: `topics[0]` (event signature hash)
2. **Indexed parameters**: `topics[1:]` (one topic per indexed param, max 3 total)
3. **Non-indexed parameters**: `data` field (ABI-encoded, all concatenated)

### Combination Process
```
FOR each parameter in event.inputs (original order):
  IF indexed:
    - Get from topics[n++]
    - If dynamic type: return hash as-is
    - If static type: decode via ABI
  ELSE:
    - Extract from data via ABI offset
    - Decode as normal ABI parameter

MERGE indexed + non-indexed results
RETURN in original parameter order
```

### Example: Transfer Event
```
Event: Transfer(address indexed from, address indexed to, uint256 value)

Raw Log:
  topics[0]: 0xddf252ad...  (Transfer selector)
  topics[1]: 0x0000...1111  (from address)
  topics[2]: 0x0000...2222  (to address)
  data:      0x0000...0064  (value = 100)

Decoding:
  from: topics[1] decoded as address    → 0x...1111
  to:   topics[2] decoded as address    → 0x...2222
  value: data decoded as uint256        → 100n

Result: { from: 0x...1111, to: 0x...2222, value: 100n }
```

---

## Named Parameter Mapping

All libraries preserve parameter names from ABI:

```typescript
// ABI definition
{ name: "from", type: "address", indexed: true }
{ name: "to", type: "address", indexed: true }
{ name: "value", type: "uint256", indexed: false }

// Decoded result
{
  from: "0x...",
  to: "0x...",
  value: 100n
}
```

### Fallback for Unnamed Parameters
```typescript
// ABI without names
{ type: "address", indexed: true }
{ type: "uint256", indexed: false }

// Result as array
["0x...", 100n]
```

---

## Error Handling Patterns

### Topic[0] Verification Errors
| Library | Behavior |
|---------|----------|
| ethers.js | Returns `null` |
| viem (strict) | Throws `AbiEventSignatureNotFoundError` |
| viem (non-strict) | Throws (still required for topic[0]) |
| ox | Throws `SelectorTopicMismatchError` |

### Data Size Mismatch Errors
| Library | Behavior |
|---------|----------|
| ethers.js | Throws during ABI decode |
| viem (strict) | Throws `DecodeLogDataMismatch` |
| viem (non-strict) | Silent; returns partial args |
| ox | Throws during decode |

### Topic Count Mismatch Errors
| Library | Behavior |
|---------|----------|
| All | Throws `DecodeLogTopicsMismatch` or similar |

---

## Performance Characteristics

### Time Complexity: O(n)
- Where n = number of input parameters
- Single ABI scan to find event (can be O(m) where m = ABI size)
- Single parameter iteration
- No redundant decoding

### Space Complexity: O(n)
- Result object/array
- Temporary indexed/non-indexed parameter arrays

### Optimization Patterns in Production Code
1. **Cache event selectors** - Avoid recomputing keccak256 per log
2. **Index ABI by signature** - Single scan instead of per-log lookup
3. **Single-pass reconstruction** - Iterate inputs once, assign directly
4. **Batch decoding** - Process logs with shared ABI index
5. **Early exit** - Throw on selector mismatch before decoding

---

## Implementation Comparison

| Aspect | ethers.js | viem | ox |
|--------|-----------|------|-----|
| Topic[0] check | Required | Required | Required |
| Strict mode | Always | Configurable | Always |
| Dynamic type hash | Wrapped in `Indexed` | Raw hex | Raw hex |
| Return format | `LogDescription` | `{ eventName, args }` | Typed object |
| Error on mismatch | Returns null | Throws/Silent | Throws |
| Parameter order | Preserved | Preserved | Preserved |
| Named/unnamed | Both | Object/Array | Object/Array |
| API style | OOP (Interface) | Functional | Functional |

---

## Real-World Examples

### Example 1: ERC20 Transfer
```typescript
// Event: Transfer(address indexed from, address indexed to, uint256 value)

const log = {
  topics: [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000008ba1f109551bD432803012645Ac136ddd64DBA72",
    "0x000000000000000000000000283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75"
  ],
  data: "0x0000000000000000000000000000000000000000000000000000000000000064"
}

// Decoded:
{
  from: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
  to: "0x283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75",
  value: 100n
}
```

### Example 2: Dynamic Indexed Type
```typescript
// Event: Log(string indexed message, bytes data)
// PROBLEM: indexed string is stored as keccak256("message") in topics[1]
// SOLUTION: Can't recover original string; need off-chain indexing or contract state query
```

### Example 3: Multiple Indexed Parameters
```typescript
// Event: Swap(address indexed from, uint amount, address indexed to)
// Decoding order must be: [from (indexed), amount (non-indexed), to (indexed)]
// Not: [from, to, amount]
```

---

## Key Insights

1. **All three libraries use identical algorithm** - Differences only in API style and error handling

2. **Topic[0] is mandatory** - Every event log starts with signature hash; can't decode without ABI

3. **Dynamic types in indexed params are hashes** - Fundamental Solidity limitation; these values are lossy

4. **Parameter order is critical** - Must reconstruct in original ABI order, not topic/data order

5. **Strict mode matters** - viem's non-strict mode allows partial decoding; others always strict

6. **No ambiguity** - Indexed params can only be in topics, non-indexed only in data

7. **Performance is linear** - O(n) complexity; suitable for high-throughput decoding

8. **Named parameters are optional** - Arrays fallback for unnamed parameters

---

## For Implementation

### Minimal Implementation Checklist
- [ ] Parse topic[0] from topics array
- [ ] Find event in ABI by computing selector
- [ ] Validate selector matches
- [ ] Separate indexed/non-indexed parameters
- [ ] Decode indexed from topics[1:] with dynamic type handling
- [ ] Decode non-indexed from data field
- [ ] Reconstruct in original parameter order
- [ ] Return { eventName, args }

### Must Handle
- [ ] Dynamic types in indexed params (strings, bytes, tuples, arrays) → return hash
- [ ] Missing topics for indexed params → error
- [ ] Mismatched data size → error (or silent in non-strict)
- [ ] Event not in ABI → error (or return null)
- [ ] Empty data field with non-indexed params → error (or silent)

### Optional Optimizations
- [ ] Cache event selector computations
- [ ] Index ABI by signature for fast lookup
- [ ] Single-pass parameter reconstruction
- [ ] Batch decoding with shared ABI

---

## References & Sources

### Source Code
- ethers.js: https://github.com/ethers-io/ethers.js/blob/main/src.ts/abi/interface.ts
- viem: https://github.com/wevm/viem/blob/main/src/utils/abi/decodeEventLog.ts
- ox: https://github.com/wevm/ox

### Documentation
- ethers.js Events: https://docs.ethers.org/v5/concepts/events/
- viem decodeEventLog: https://viem.sh/docs/contract/decodeEventLog
- ox ABI Guide: https://oxlib.sh/guides/abi

### Databases & Tools
- Topic[0] Signature Database: https://github.com/wmitsuda/topic0
- Etherscan Event Logs: https://info.etherscan.com/what-is-event-logs/

### Ethereum Specifications
- Solidity Events: https://docs.soliditylang.org/en/latest/contracts.html#events
- EVM Logs: https://eips.ethereum.org/EIPS/eip-3
- ABI Encoding: https://docs.soliditylang.org/en/latest/abi-spec.html

---

## Document Files

All research organized in this repo:

1. **EVENT_LOG_DECODING_RESEARCH.md** - Complete technical deep-dive
2. **EVENT_DECODING_CODE_EXAMPLES.ts** - Full source implementations + examples
3. **EVENT_DECODING_QUICK_REFERENCE.md** - Quick lookup guide + patterns
4. **RESEARCH_SUMMARY.md** - This file

Use these as reference for implementing or understanding event log decoding in Zig, TypeScript, or any other language.

---

**Research completed**: October 27, 2025
**Coverage**: ethers.js v6, viem latest, ox latest
**Focus**: Imperative, performant algorithms for production use
