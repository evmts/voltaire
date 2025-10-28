# Event Log Decoding - Quick Reference Guide

## The Algorithm (Core Pattern)

```
INPUT: abi[], topics[], data

1. signature = topics[0]
2. event = findEventInAbi(abi, signature)  // Match by keccak256 hash
3. indexed = event.inputs.filter(p => p.indexed)
4. nonIndexed = event.inputs.filter(p => !p.indexed)
5. decodedIndexed = topics[1:].map((t, i) => decodeTopic(indexed[i], t))
6. decodedNonIndexed = decodeData(nonIndexed, data)
7. RECONSTRUCT in original parameter order
8. RETURN { eventName, args }
```

---

## Key Concepts

### Topic[0] = Event Signature Hash
```
signature = keccak256("EventName(type1,type2,...)")
e.g.: Transfer(address,address,uint256)
      -> 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

### Topics vs Data
| Aspect | Topics | Data |
|--------|--------|------|
| Contains | Indexed parameters | Non-indexed parameters |
| Encoding | One topic per indexed param | All packed together |
| Lookup | Fast (indexed in Bloom filter) | Requires full scan |
| topic[0] | Always event signature | N/A |
| topic[1-3] | Indexed params (up to 3) | N/A |

### Dynamic Type Handling
- **Indexed strings/bytes/tuples/arrays** → Stored as keccak256 hash, NOT actual value
- **Non-indexed strings/bytes** → Stored as ABI-encoded values in data
- **Static types (uint, address, bool)** → Stored as-is in topics or data

---

## Library Comparison

### ethers.js
```typescript
const iface = new ethers.Interface(ABI)
const result = iface.parseLog({ topics: log.topics, data: log.data })
// Returns: LogDescription { name, args, fragment }
```
- Always strict
- Returns null on signature mismatch
- Wrapped indexed values in `Indexed` class

### viem
```typescript
const result = decodeEventLog({
  abi: ABI,
  topics: log.topics,
  data: log.data,
  strict: true  // Optional; default true
})
// Returns: { eventName, args }
```
- Configurable strict mode
- Throws on signature mismatch (strict) or silent failure (non-strict)
- Clean return object

### ox
```typescript
const event = AbiEvent.from('event Transfer(address indexed from, address indexed to, uint256 value)')
const result = AbiEvent.decode(event, log)
// Returns: { from: '0x...', to: '0x...', value: 100n }
```
- Always strict
- Unopinionated; delegates to primitives
- Compact API

---

## Implementation Checklist

### Step 1: Topic[0] Verification
- [ ] Extract topic[0]
- [ ] Compute event selector: `keccak256(formatEvent(abiEvent))`
- [ ] Match: `topics[0] == computedSelector`
- [ ] Throw if mismatch (or return null in ethers.js)

### Step 2: Separate Parameters
- [ ] Iterate event.inputs
- [ ] Split into `indexed` and `nonIndexed` arrays
- [ ] Track original order (via index or name)

### Step 3: Decode Indexed (from topics[1:])
```
FOR each indexedParam at index i:
  - topic = topics[1 + i]
  - IF isDynamicType(param.type):
    - value = topic  // Hash; can't decode further
  - ELSE:
    - value = decodeAbiParameters([param], topic)
  - args[param.name] = value
```

### Step 4: Decode Non-Indexed (from data)
```
IF data != '0x':
  - decodedData = decodeAbiParameters(nonIndexedParams, data)
  - FOR each nonIndexedParam at index i:
    - args[param.name] = decodedData[i]
ELSE IF nonIndexedParams.length > 0 AND strict:
  - throw DecodeLogDataMismatch
```

### Step 5: Reconstruct
```
result = {}
FOR each input in event.inputs (original order):
  - IF input.indexed:
    - result[input.name] = decodedIndexed[indexedIdx++]
  - ELSE:
    - result[input.name] = decodedNonIndexed[nonIndexedIdx++]
RETURN result
```

### Step 6: Handle Named/Unnamed
```
IF all inputs have names:
  - Use object: { from: 0x..., to: 0x... }
ELSE:
  - Use array: [0x..., 0x...]
```

---

## Common Patterns

### Pattern 1: ERC20 Transfer
```typescript
// Input log
{
  topics: [
    "0xddf252ad...",  // Transfer selector
    "0x0000...1111",  // from (indexed)
    "0x0000...2222"   // to (indexed)
  ],
  data: "0x0000...0064"  // value = 100
}

// Decoded
{
  from: 0x1111...,
  to: 0x2222...,
  value: 100n
}
```

### Pattern 2: Dynamic Indexed Type
```typescript
// Event: event Log(string indexed message, bytes data)
// Input:
{
  topics: [
    "0x...",  // Log selector
    "0x1234567890..."  // keccak256("hello")
  ],
  data: "0x..."  // bytes data
}

// Problem: topics[1] is hash; can't recover "hello"
// Solution: Query contract history or use indexing service
```

### Pattern 3: Multiple Indexed Parameters
```typescript
// Event: event Swap(address indexed from, uint amount, address indexed to)
{
  topics: [
    "0x...",  // Swap selector
    "0x...",  // from
    "0x..."   // to
  ],
  data: "0x..."  // amount
}

// Decoded (in original order):
{
  from: 0x...,    // topics[1]
  amount: 100n,   // data
  to: 0x...       // topics[2]
}
```

---

## Error Cases

| Scenario | ethers.js | viem (strict) | viem (non-strict) | ox |
|----------|-----------|---------------|-------------------|-----|
| Topic[0] not in ABI | returns null | throws | throws | throws |
| Topic count mismatch | throws | throws | throws | throws |
| Data size mismatch | throws | throws | silent | throws |
| Dynamic indexed param | returns hash | returns hash | returns hash | returns hash |
| Empty data with non-indexed params | throws | throws | silent | throws |

---

## Performance Tips

1. **Cache event selectors** - Don't recompute keccak256 per log
2. **Index ABI by signature** - Single scan instead of per-log lookup
3. **Single-pass reconstruction** - Iterate inputs once, assign directly
4. **Batch decode** - Process multiple logs with shared ABI index
5. **Lazy decode** - Don't decode if you only need event name

---

## Topic[0] Selector Database

Common event selectors (topic[0] values):

| Event | Selector |
|-------|----------|
| `Transfer(address,address,uint256)` | `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` |
| `Approval(address,address,uint256)` | `0x8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925` |
| `Transfer(address,uint256)` (ERC721) | `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef` |
| `Swap(address,uint256,uint256,uint256,uint256,address)` | `0xd78ad95fa46ab8c894c8a3d0b169b02dbaec83f0c7e05d3ce2f0ac8df0c6c4d1` |

See: https://github.com/wmitsuda/topic0 for a database

---

## Decision Tree

```
START: Have log (topics[], data)

1. Do I have the ABI?
   NO -> Can't decode; need ABI or topic[0] signature database
   YES -> Continue

2. Can I compute event selector for topic[0]?
   NO -> Need human-readable event signature
   YES -> Continue

3. Does topic[0] match an event in ABI?
   NO -> Event not in this ABI; check other contracts
   YES -> Continue

4. Are there indexed parameters?
   YES -> Extract from topics[1:]
   NO -> Skip

5. Are there non-indexed parameters?
   YES -> Extract from data field
   NO -> Skip

6. Do I need original parameter names?
   YES -> Check if ABI has parameter names
   NO -> Use array format

7. Can I recover indexed dynamic type values?
   NO -> Values are keccak256 hashes; can't recover
   YES -> Only if stored in contract state

END: Return decoded { eventName, args }
```

---

## Pseudo-Code Template

```typescript
function decodeEventLog(abi: Abi[], topics: string[], data: string) {
  // 1. Validate and extract selector
  const [signature, ...argTopics] = topics
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

  // 4. Decode indexed from topics
  const decodedIndexed = indexed.map((p, i) => {
    if (isDynamic(p.type)) return argTopics[i]  // Hash
    return decodeAbiParameters([p], argTopics[i])
  })

  // 5. Decode non-indexed from data
  const decodedNonIndexed = data !== '0x'
    ? decodeAbiParameters(nonIndexed, data)
    : []

  // 6. Reconstruct result
  const result = {}
  let idxI = 0, nonIdxI = 0
  for (const input of event.inputs) {
    if (input.indexed) {
      result[input.name] = decodedIndexed[idxI++]
    } else {
      result[input.name] = decodedNonIndexed[nonIdxI++]
    }
  }

  return { eventName: event.name, args: result }
}
```

---

## References

- **ethers.js source**: https://github.com/ethers-io/ethers.js/blob/main/src.ts/abi/interface.ts
- **viem source**: https://github.com/wevm/viem/blob/main/src/utils/abi/decodeEventLog.ts
- **ox source**: https://github.com/wevm/ox
- **Topic[0] database**: https://github.com/wmitsuda/topic0
- **EVM specs**: https://docs.ethers.org/v5/concepts/events/
