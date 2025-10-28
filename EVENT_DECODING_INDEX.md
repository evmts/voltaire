# Event Log Decoding Research - Complete Index

## Quick Navigation

### For Algorithm Understanding
→ **EVENT_DECODING_QUICK_REFERENCE.md** (8.5KB)
- Core algorithm pseudocode
- Step-by-step implementation checklist
- Common patterns and examples
- Decision trees
- Error cases table

### For Complete Technical Details
→ **EVENT_LOG_DECODING_RESEARCH.md** (25KB)
- Full implementations from ethers.js, viem, ox
- Detailed explanation of each step
- Topic/data combination logic
- Error handling patterns
- Real-world ERC20 example
- Implementation comparison tables

### For Working Code
→ **EVENT_DECODING_CODE_EXAMPLES.ts** (22KB)
- Ethers.js implementation (complete parseLog + decodeEventLog)
- Viem implementation (complete decodeEventLog)
- Ox implementation (conceptual)
- Generic unified algorithm in TypeScript
- Practical examples with error handling
- Performance optimization patterns

### Executive Summary
→ **RESEARCH_SUMMARY.md** (12KB)
- Overview of all three libraries
- Key insights and takeaways
- Implementation comparison matrix
- Performance characteristics
- References and sources

---

## The Algorithm (TL;DR)

```
1. Extract topics[0] (event signature hash)
2. Find matching event in ABI
3. Validate topics[0] matches computed selector
4. Separate parameters: indexed vs non-indexed
5. Decode indexed from topics[1:] (handle dynamic types as hashes)
6. Decode non-indexed from data field
7. Reconstruct in original parameter order
8. Return { eventName, args }
```

---

## File Organization

```
primitives/
├── EVENT_LOG_DECODING_RESEARCH.md (25KB)
│   └── Complete deep-dive with full implementations
├── EVENT_DECODING_CODE_EXAMPLES.ts (22KB)
│   └── Runnable code from all three libraries
├── EVENT_DECODING_QUICK_REFERENCE.md (8.5KB)
│   └── Quick lookup guide & patterns
├── RESEARCH_SUMMARY.md (12KB)
│   └── Executive summary & comparisons
└── EVENT_DECODING_INDEX.md (this file)
    └── Navigation guide
```

---

## Key Findings

### 1. Universal Algorithm
All three libraries (ethers.js, viem, ox) implement the **same core algorithm**:
- Topic[0] verification via keccak256 hash
- Parameter separation (indexed vs non-indexed)
- Independent decoding paths
- Reconstruction in original order

### 2. Topic[0] = Non-Recoverable Hash
```
signature = keccak256("EventName(type1,type2,...)")
e.g., Transfer(address,address,uint256)
   -> 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef

Can't reverse-engineer the hash; must have ABI
```

### 3. Dynamic Types in Topics are Hashes
```
event Log(string indexed text)
  -> topics[1] = keccak256("hello"), NOT "hello" itself
  -> Can't recover original; stored lossy
```

### 4. Parameter Order is Critical
```
Event(address indexed from, uint256 amount, address indexed to)
Must reconstruct as: [from (topics), amount (data), to (topics)]
NOT: [from, to, amount]
```

### 5. Topics vs Data Split
| Field | Contents |
|-------|----------|
| topics[0] | Event selector (always) |
| topics[1-3] | Indexed parameters (up to 3) |
| data | Non-indexed parameters (ABI-encoded) |

### 6. Library Differences

| Feature | ethers.js | viem | ox |
|---------|-----------|------|-----|
| Strict Mode | Always | Configurable | Always |
| On Mismatch | Returns null | Throws/Silent | Throws |
| API | OOP (Interface) | Functional | Functional |
| Return Format | LogDescription | { eventName, args } | Typed args |

---

## Implementation Decision Tree

```
Have an Ethereum event log to decode?

├─ YES, I have the ABI
│  ├─ Extract topics[0]
│  ├─ Find matching event
│  ├─ Validate selector
│  ├─ Decode indexed params from topics[1:]
│  ├─ Decode non-indexed params from data
│  └─ Return { eventName, args }
│
└─ NO, I don't have the ABI
   ├─ Can I look up the contract ABI somewhere?
   │  └─ YES: Fetch ABI, then decode (see above)
   │
   └─ NO, I can't get the ABI
      ├─ I only have topics[0]
      │  └─ Query topic0.eth or topic0 database
      │     → Might find event signature
      │
      └─ Can't decode without ABI
         └─ Only useful for filtering by topics
            (can't extract arguments)
```

---

## Performance Reference

### Time Complexity
- **O(m)** for ABI scan to find event (m = ABI size)
- **O(n)** for parameter iteration (n = number of params)
- **O(d)** for decoding data (d = data field size)
- **Total: O(m + n + d)**
- **Practical: O(1)** if ABI is indexed by signature

### Space Complexity
- **O(n)** for result object/array
- **O(n)** for temporary arrays (indexed/non-indexed params)
- **Total: O(n)** where n = number of parameters

### Optimization Tactics
1. Cache event selectors (don't recompute keccak256)
2. Index ABI by signature for O(1) lookup
3. Single-pass reconstruction (iterate once)
4. Batch decode (share ABI index across logs)

---

## Example: ERC20 Transfer Decoding

### Event Definition
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```

### Raw Log
```json
{
  "topics": [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000008ba1f109551bD432803012645Ac136ddd64DBA72",
    "0x000000000000000000000000283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75"
  ],
  "data": "0x0000000000000000000000000000000000000000000000000000000000000064"
}
```

### Step-by-Step Decoding
1. **topics[0]**: `0xddf252ad...` → Matches Transfer event ✓
2. **topics[1]**: `0x0000...1111` → Decode as address → `0x8ba1f...`
3. **topics[2]**: `0x0000...2222` → Decode as address → `0x283af...`
4. **data**: `0x0000...0064` → Decode as uint256 → `100`

### Decoded Result
```typescript
{
  eventName: "Transfer",
  args: {
    from: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
    to: "0x283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75",
    value: 100n
  }
}
```

---

## Common Pitfalls

### 1. Forgetting Topic[0] Verification
❌ Assuming topics[1] is first param
✓ Always verify topics[0] matches event selector

### 2. Wrong Parameter Order
❌ Reconstructing as [from, to, amount]
✓ Reconstruct in original ABI order [from, amount, to]

### 3. Trying to Recover Indexed Dynamic Types
❌ Expecting to decode topics[1] string
✓ Accept it's a hash; can't recover original

### 4. Not Handling Unnamed Parameters
❌ Only supporting named parameters
✓ Fallback to array format for unnamed

### 5. Silent Failures in Non-Strict Mode
❌ Assuming data always present
✓ Check for mismatches; document partial decode behavior

---

## Testing Checklist

When implementing event decoding, test:

- [ ] Basic ERC20 Transfer decode
- [ ] Event not in ABI (error handling)
- [ ] Topic[0] mismatch (error handling)
- [ ] Dynamic indexed types (string, bytes)
- [ ] Multiple indexed parameters
- [ ] No indexed parameters
- [ ] No non-indexed parameters
- [ ] Empty data field
- [ ] Named and unnamed parameters
- [ ] Mismatched data size (strict/non-strict)

---

## Useful Databases & Tools

### Topic[0] Databases
- **topic0.eth** - on-chain signature database
- **github.com/wmitsuda/topic0** - community database
- **4byte.directory** - function/event signature database

### Event Explorers
- **Etherscan** - Event logs viewer
- **Blockscout** - Event logs viewer
- **Any EVM block explorer** - Raw log viewing

### Libraries
- **ethers.js** - `Interface.parseLog()`
- **viem** - `decodeEventLog()`
- **ox** - `AbiEvent.decode()`
- **web3.js** - Event decoding
- **web3py** - Python event decoding

---

## Pseudo-Code Template for Your Implementation

```typescript
function decodeEventLog(abi, topics, data) {
  // 1. Validate and extract
  const signature = topics[0]
  if (!signature) throw new Error("Missing topics[0]")

  // 2. Find event in ABI
  const event = abi.find(e =>
    e.type === 'event' &&
    keccak256(formatEvent(e)) === signature
  )
  if (!event) throw new Error("Event not found")

  // 3. Separate parameters
  const indexed = event.inputs.filter(p => p.indexed)
  const nonIndexed = event.inputs.filter(p => !p.indexed)

  // 4. Decode indexed
  const decodedIndexed = indexed.map((p, i) => {
    if (isDynamic(p.type)) return topics[1 + i]
    return decodeAbiParameters([p], topics[1 + i])
  })

  // 5. Decode non-indexed
  const decodedNonIndexed = data !== '0x'
    ? decodeAbiParameters(nonIndexed, data)
    : []

  // 6. Reconstruct
  const result = {}
  let idxIdx = 0, nonIdxIdx = 0
  for (const input of event.inputs) {
    if (input.indexed) {
      result[input.name] = decodedIndexed[idxIdx++]
    } else {
      result[input.name] = decodedNonIndexed[nonIdxIdx++]
    }
  }

  return { eventName: event.name, args: result }
}
```

---

## Further Reading

### Ethereum Concepts
- Events: https://docs.soliditylang.org/en/latest/contracts.html#events
- ABI Encoding: https://docs.soliditylang.org/en/latest/abi-spec.html
- Logs: https://eips.ethereum.org/EIPS/eip-3

### Library Documentation
- ethers.js: https://docs.ethers.org/v6/
- viem: https://viem.sh/
- ox: https://oxlib.sh/

### Articles
- "Understanding Event Logs" - MyCrypto
- "Everything You Ever Wanted to Know About Events" - Linum Labs
- "Decode Ethereum Logs" - Coinmonks

---

## Document Sizes

| File | Size | Focus |
|------|------|-------|
| EVENT_LOG_DECODING_RESEARCH.md | 25KB | Complete technical deep-dive |
| EVENT_DECODING_CODE_EXAMPLES.ts | 22KB | Runnable implementations |
| EVENT_DECODING_QUICK_REFERENCE.md | 8.5KB | Quick lookup patterns |
| RESEARCH_SUMMARY.md | 12KB | Executive summary |
| EVENT_DECODING_INDEX.md | This file | Navigation guide |
| **TOTAL** | **~80KB** | **Complete package** |

---

## Questions & Answers

**Q: Can I decode event logs without the ABI?**
A: No. You need either the ABI or a way to look up the event signature from topic[0]. Try the topic0 database.

**Q: Why are indexed strings stored as hashes?**
A: Solidity/EVM limitation. Indexed parameters are restricted to fixed-size types for efficient filtering. Dynamic types are hashed.

**Q: Can I recover the original indexed string?**
A: No, it's a one-way hash (keccak256). Only solution: off-chain indexing or querying contract state.

**Q: What's the maximum number of indexed parameters?**
A: 3 (topics[1], topics[2], topics[3]). topic[0] is always reserved for the event selector.

**Q: Do I need to worry about parameter order?**
A: Yes. You must reconstruct the result in the original ABI parameter order, not topics/data order.

**Q: Which library is fastest?**
A: All three have identical O(n) complexity. Performance depends on ABI indexing strategy (viem has best defaults).

**Q: Can I use strict: false in viem safely?**
A: Yes for partial decoding, but you'll get incomplete args. Better to fix the ABI or data mismatch.

**Q: How do I handle anonymous events?**
A: They don't have a signature in topics[0]. You can't identify them without knowing all indexed parameters.

---

## Research Metadata

- **Date**: October 27, 2025
- **Coverage**: ethers.js v6, viem latest, ox latest
- **Focus**: Production-grade, imperative implementations
- **Total Research**: 80KB of documentation + code
- **Sources**: Official GitHub repositories + documentation

---

**Start here**: Choose your use case above and navigate to the appropriate document.
