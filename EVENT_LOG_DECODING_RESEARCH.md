# Event Log Decoding: ethers.js, viem, and ox Implementation Research

## Overview

Event log decoding is the process of converting raw blockchain event logs (topics and data fields) into readable, structured event objects with decoded parameters. All three libraries follow similar architectural patterns while differing in implementation details.

---

## 1. Core Concepts

### Event Log Structure
```
Log = {
  topics: [topic0, topic1, topic2, topic3],   // Indexed parameters
  data: "0x...",                               // Non-indexed parameters
  address: "0x...",
  blockNumber: 123456
}
```

### Topics vs Data Split
- **topic[0]**: Event signature (keccak256 hash of event name + parameter types)
- **topic[1-3]**: Indexed parameter values (can hold up to 3)
- **data**: ABI-encoded non-indexed parameters

### Topic[0] Signature Hash
For event `Transfer(address indexed from, address indexed to, uint256 value)`:
- Signature string: `"Transfer(address,address,uint256)"`
- topic[0] = keccak256("Transfer(address,address,uint256)")
- Result: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

---

## 2. ethers.js Implementation

### Location
`src.ts/abi/interface.ts` in ethers.js repository

### High-Level API: `Interface.parseLog()`

```typescript
parseLog(log: { topics: ReadonlyArray<string>, data: string}): null | LogDescription {
    const fragment = this.getEvent(log.topics[0]);

    if (!fragment || fragment.anonymous) { return null; }

    return new LogDescription(fragment, fragment.topicHash,
        this.decodeEventLog(fragment, log.data, log.topics));
}
```

**Steps:**
1. Retrieve event fragment from topic[0] hash
2. Validate fragment exists and isn't anonymous
3. Call `decodeEventLog()` with fragment
4. Return `LogDescription` object

### Core Decoding: `Interface.decodeEventLog()`

```typescript
decodeEventLog(fragment: EventFragment | string, data: BytesLike, topics?: ReadonlyArray<string>): Result {
    if (typeof(fragment) === "string") {
        const f = this.getEvent(fragment);
        assertArgument(f, "unknown event", "eventFragment", fragment);
        fragment = f;
    }

    if (topics != null && !fragment.anonymous) {
        const eventTopic = fragment.topicHash;
        assertArgument(isHexString(topics[0], 32) && topics[0].toLowerCase() === eventTopic,
            "fragment/topic mismatch", "topics[0]", topics[0]);
        topics = topics.slice(1);
    }

    const indexed: Array<ParamType> = [];
    const nonIndexed: Array<ParamType> = [];
    const dynamic: Array<boolean> = [];

    // Separate indexed and non-indexed parameters
    fragment.inputs.forEach((param, index) => {
        if (param.indexed) {
            if (param.type === "string" || param.type === "bytes" || param.baseType === "tuple" || param.baseType === "array") {
                indexed.push(ParamType.from({ type: "bytes32", name: param.name }));
                dynamic.push(true);
            } else {
                indexed.push(param);
                dynamic.push(false);
            }
        } else {
            nonIndexed.push(param);
            dynamic.push(false);
        }
    });

    // Decode indexed and non-indexed separately
    const resultIndexed = (topics != null) ? this.#abiCoder.decode(indexed, concat(topics)) : null;
    const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);

    // Reconstruct result with proper parameter positioning
    const values: Array<any> = [];
    const keys: Array<null | string> = [];
    let nonIndexedIndex = 0, indexedIndex = 0;

    fragment.inputs.forEach((param, index) => {
        let value: null | Indexed | Error = null;
        if (param.indexed) {
            if (resultIndexed == null) {
                value = new Indexed(null);
            } else if (dynamic[index]) {
                value = new Indexed(resultIndexed[indexedIndex++]);
            } else {
                try {
                    value = resultIndexed[indexedIndex++];
                } catch (error: any) {
                    value = error;
                }
            }
        } else {
            try {
                value = resultNonIndexed[nonIndexedIndex++];
            } catch (error: any) {
                value = error;
            }
        }
        values.push(value);
        keys.push(param.name || null);
    });

    return Result.fromItems(values, keys);
}
```

### Key Implementation Patterns

1. **Topic[0] Verification**: Compares topic[0] with event signature hash
2. **Dynamic Type Handling**: Strings/bytes/tuples in topics stored as bytes32 hashes, not actual values
3. **Separate Decoding Paths**: Topics and data decoded independently via ABI coder
4. **Reconstruction**: Iterates fragment.inputs to maintain original parameter order, merging decoded values
5. **Error Handling**: Wraps decode errors and preserves parameter positions

### Return Type: LogDescription
```typescript
{
  name: string,           // Event name
  fragment: EventFragment,
  args: Result,           // Decoded parameters (array or object)
  topics: string[],
  data: string
}
```

---

## 3. Viem Implementation

### Location
`src/utils/abi/decodeEventLog.ts` in viem repository

### Complete Implementation

```typescript
export function decodeEventLog<
  const abi extends Abi | readonly unknown[],
  eventName extends ContractEventName<abi> | undefined = undefined,
  topics extends Hex[] = Hex[],
  data extends Hex | undefined = undefined,
  strict extends boolean = true,
>(
  parameters: DecodeEventLogParameters<abi, eventName, topics, data, strict>,
): DecodeEventLogReturnType<abi, eventName, topics, data, strict> {
  const {
    abi,
    data,
    strict: strict_,
    topics,
  } = parameters as DecodeEventLogParameters

  const strict = strict_ ?? true
  const [signature, ...argTopics] = topics
  if (!signature) throw new AbiEventSignatureEmptyTopicsError({ docsPath })

  const abiItem = abi.find(
    (x) =>
      x.type === 'event' &&
      signature === toEventSelector(formatAbiItem(x) as EventDefinition),
  )

  if (!(abiItem && 'name' in abiItem) || abiItem.type !== 'event')
    throw new AbiEventSignatureNotFoundError(signature, { docsPath })

  const { name, inputs } = abiItem
  const isUnnamed = inputs?.some((x) => !('name' in x && x.name))

  const args: any = isUnnamed ? [] : {}

  // Decode topics (indexed args).
  const indexedInputs = inputs
    .map((x, i) => [x, i] as const)
    .filter(([x]) => 'indexed' in x && x.indexed)
  for (let i = 0; i < indexedInputs.length; i++) {
    const [param, argIndex] = indexedInputs[i]
    const topic = argTopics[i]
    if (!topic)
      throw new DecodeLogTopicsMismatch({
        abiItem,
        param: param as AbiParameter & { indexed: boolean },
      })
    args[isUnnamed ? argIndex : param.name || argIndex] = decodeTopic({
      param,
      value: topic,
    })
  }

  // Decode data (non-indexed args).
  const nonIndexedInputs = inputs.filter((x) => !('indexed' in x && x.indexed))
  if (nonIndexedInputs.length > 0) {
    if (data && data !== '0x') {
      try {
        const decodedData = decodeAbiParameters(nonIndexedInputs, data)
        if (decodedData) {
          if (isUnnamed)
            for (let i = 0; i < inputs.length; i++)
              args[i] = args[i] ?? decodedData.shift()
          else
            for (let i = 0; i < nonIndexedInputs.length; i++)
              args[nonIndexedInputs[i].name!] = decodedData[i]
        }
      } catch (err) {
        if (strict) {
          if (
            err instanceof AbiDecodingDataSizeTooSmallError ||
            err instanceof PositionOutOfBoundsError
          )
            throw new DecodeLogDataMismatch({
              abiItem,
              data: data,
              params: nonIndexedInputs,
              size: size(data),
            })
          throw err
        }
      }
    } else if (strict) {
      throw new DecodeLogDataMismatch({
        abiItem,
        data: '0x',
        params: nonIndexedInputs,
        size: 0,
      })
    }
  }

  return {
    eventName: name,
    args: Object.values(args).length > 0 ? args : undefined,
  } as unknown as DecodeEventLogReturnType<abi, eventName, topics, data, strict>
}

function decodeTopic({ param, value }: { param: AbiParameter; value: Hex }) {
  if (
    param.type === 'string' ||
    param.type === 'bytes' ||
    param.type === 'tuple' ||
    param.type.match(/^(.*)\[(\d+)?\]$/)
  )
    return value
  const decodedArg = decodeAbiParameters([param], value) || []
  return decodedArg[0]
}
```

### Key Implementation Patterns

1. **Topic[0] Lookup**: Uses `toEventSelector()` to find matching event in ABI
2. **Array vs Object Args**: Checks for named parameters; uses array if unnamed, object if named
3. **Indexed Parameter Decoding**:
   - `decodeTopic()` handles dynamic types (string, bytes, tuple, array) specially—returns hash value as-is
   - Static types decoded via `decodeAbiParameters()`
4. **Non-Indexed Decoding**: Uses `decodeAbiParameters()` for all non-indexed params together
5. **Strict Mode**:
   - `strict: true` (default): Throws on data/topic mismatch
   - `strict: false`: Silently ignores mismatches, allows partial decoding
6. **Merge Strategy**: Uses array/object merge to combine indexed and non-indexed

### Return Type
```typescript
{
  eventName: string,
  args?: Record<string, any> | any[]  // undefined if empty
}
```

---

## 4. Ox Implementation

### Location
`src/core/AbiEvent.ts` in ox repository

### Core Concept
Ox provides `AbiEvent.decode()` which decodes log topics and data according to an ABI Event's parameter types.

### High-Level Usage Example

```typescript
import { AbiEvent, RpcTransport } from 'ox'

// 1. Define event
const transfer = AbiEvent.from(
  'event Transfer(address indexed from, address indexed to, uint256 value)'
)

// 2. Encode to get selector for filtering
const { topics } = AbiEvent.encode(transfer, {
  from: '0x9f1fdab6458c5fc642fa0f4c5af7473c46837357'
})

// 3. Get logs
const transport = RpcTransport.fromHttp('https://1.rpc.thirdweb.com')
const logs = await transport.request({
  method: 'eth_getLogs',
  params: [{ topics }]
})

// 4. Decode logs
const decoded = logs.map(log => AbiEvent.decode(transfer, log))
// Result: { from: '0x...', to: '0x...', value: 1n }
```

### Decode Implementation Pattern

```typescript
export function decode(
  ...parameters: [abi, name, log] | [abiEvent, log]
): decode.ReturnType {
  const [abiEvent, log] = (() => {
    if (Array.isArray(parameters[0])) {
      const [abi, name, log] = parameters
      return [fromAbi(abi, name), log]
    }
    return parameters
  })()

  const { data, topics } = log
  const [selector_, ...argTopics] = topics

  // 1. Validate selector/topic[0] matches
  const selector = getSelector(abiEvent)
  if (selector_ !== selector)
    throw new SelectorTopicMismatchError({...})

  // 2. Initialize args container
  const isUnnamed = inputs.some(x => !x.name)
  let args = isUnnamed ? [] : {}

  // 3. Decode indexed parameters from topics
  const indexedInputs = inputs.filter(x => x.indexed)
  for (let i = 0; i < indexedInputs.length; i++) {
    const param = indexedInputs[i]
    const topic = argTopics[i]

    if (!topic) throw new TopicsMismatchError({...})

    args[key] = decodeTopicValue(param, topic)
  }

  // 4. Decode non-indexed parameters from data
  const nonIndexedInputs = inputs.filter(x => !x.indexed)
  if (nonIndexedInputs.length > 0) {
    if (data && data !== '0x') {
      const decodedData = AbiParameters.decode(nonIndexedInputs, data)
      // Merge decoded data into args
    }
  }

  return Object.values(args).length > 0 ? args : undefined
}
```

### Key Implementation Patterns

1. **Flexible Input**: Accepts either `(abi, name, log)` or `(abiEvent, log)`
2. **Selector Validation**: Topic[0] must match computed event selector
3. **Separate Decode Paths**: Indexed from topics, non-indexed from data
4. **Unopinionated Design**: Uses foundational `AbiParameters.decode()` primitive
5. **Type Safety**: Built on TypeScript for compile-time parameter validation

---

## 5. Decoding Algorithm: Unified Pattern

All three libraries implement the same core algorithm with minor variations:

### Algorithm Pseudocode

```
function decodeEventLog(abi, topics, data):
  1. EXTRACT signature = topics[0]

  2. LOOKUP event fragment in abi matching signature
     - Compute: eventSelector = keccak256("EventName(type1,type2,...)")
     - Find: abiEvent where getSelector(abiEvent) == signature
     - If not found: throw AbiEventSignatureNotFoundError

  3. VALIDATE signature matches
     - If not anonymous: assert signature == fragment.topicHash

  4. SEPARATE parameters by indexed flag
     - indexedParams = [p for p in fragment.inputs if p.indexed]
     - nonIndexedParams = [p for p in fragment.inputs if !p.indexed]

  5. DECODE indexed parameters
     - FOR each indexedParam IN indexedParams:
       - topic = topics[1 + i]
       - IF param is dynamic (string/bytes/tuple/array):
         - value = topic  // Store hash, not decoded
       - ELSE:
         - value = decodeAbiParameters([param], topic)
       - args[paramName] = value

  6. DECODE non-indexed parameters
     - IF data != '0x':
       - decodedData = decodeAbiParameters(nonIndexedParams, data)
       - FOR each nonIndexedParam IN nonIndexedParams:
         - args[paramName] = decodedData[i]
     - ELSE IF strict mode:
       - throw DecodeLogDataMismatch

  7. RECONSTRUCT result object
     - Return { eventName, args }
     - OR { eventName, name, fragment, args } (varies by library)
```

### Key Decision Points

#### Topic[0] Verification
- **Why**: Ensures log matches intended event (signature collision protection)
- **How**: Compute event selector from fragment, compare with topics[0]
- **Failure**: Returns null (ethers.js) or throws (viem/ox)

#### Dynamic Type Handling
Dynamic types (string, bytes, tuple, array) in indexed parameters are stored as keccak256 hashes:
```
event Event(string indexed text) => topics[1] = keccak256("text"), not actual string
event Event(bytes indexed data) => topics[1] = keccak256(data), not actual bytes
```
Solution: Keep hash value as-is in decoded args; applications can't recover original.

#### Parameter Reconstruction
Must merge indexed and non-indexed parameters while maintaining original order:
```
Event(address indexed from, uint256 amount, address indexed to)
inputs: [from, amount, to]
topics: [selector, from_value, to_value]
data:   [amount_value]

Result must be: { from: from_value, amount: amount_value, to: to_value }
```

#### Array vs Object Return
- **Named parameters** → Return object: `{ from: '0x...', to: '0x...' }`
- **Unnamed parameters** → Return array: `['0x...', '0x...']`
- **Mixed** → Ethers.js returns special Result object with both array and object access

#### Strict Mode
- **Strict = true** (default in viem): Throw on data/topic mismatch
- **Strict = false**: Attempt partial decode, silent failures
- **Ethers.js**: No strict mode; always strict
- **Ox**: Not exposed; always strict

---

## 6. Topic/Data Combination Logic

### How Topics and Data are Combined

```
Raw Log:
{
  topics: [
    "0xddf252ad...",  // topic[0] = event signature
    "0x000000...1111", // topic[1] = indexed param 1
    "0x000000...2222"  // topic[2] = indexed param 2
  ],
  data: "0x0000000000000000000000000000000000000000000000000000000000000064"
}

Event Definition:
event Transfer(address indexed from, address indexed to, uint256 value)

Decoding Process:
1. topics[0] "0xddf252ad..." => matches Transfer event signature ✓
2. topics[1] "0x000000...1111" => decode as address => from: 0x1111...
3. topics[2] "0x000000...2222" => decode as address => to: 0x2222...
4. data "0x000000...0064" => decode as uint256 => value: 100n

Result: { from: 0x1111..., to: 0x2222..., value: 100n }
```

### Combination Strategy

1. **Filter topics for indexed params**: `argTopics = topics.slice(1)` (skip selector)
2. **Filter inputs for indexed/non-indexed**: Two separate arrays
3. **Decode indexed**: For each indexed param, use corresponding topic
4. **Decode non-indexed**: All non-indexed params packed in data field
5. **Merge**: Iterate original inputs in order, pulling from indexed or non-indexed decoded arrays

### No Ambiguity Rules
- Indexed params cannot be in data
- Non-indexed params cannot be in topics
- Each indexed param gets exactly one topic slot
- All non-indexed params packed in data (standard ABI encoding)

---

## 7. Named Parameter Mapping

### Mapping Strategy

All libraries maintain parameter names from the ABI:

```typescript
// ABI Input with names
{ name: "from", type: "address", indexed: true }
{ name: "amount", type: "uint256", indexed: false }

// Named result object
{
  from: 0x1234...,
  amount: 100n
}
```

### Unnamed Parameter Handling

If ABI has unnamed parameters:
```typescript
// ABI Input without names
{ type: "address", indexed: true }
{ type: "uint256", indexed: false }

// Array result
[0x1234..., 100n]
```

### Fallback Logic

- **Primary**: Use `param.name` if present
- **Fallback**: Use parameter index
- **Result**: Object with string/number keys, or array

---

## 8. Performance Considerations

### Imperative Approaches (All Three Libraries)

1. **Single-pass iteration**: No multiple ABI scans; find event once
2. **Index management**: Track indexed/non-indexed array positions separately
3. **Minimal allocation**: Reuse arrays/objects; avoid unnecessary copying
4. **Error early**: Validate selector before decoding
5. **Lazy decoding**: Don't decode non-indexed data if not requested (optional in some)

### Computational Complexity

```
Time: O(n) where n = number of input parameters
  - 1x ABI scan to find event: O(m) where m = ABI size
  - 1x parameter iteration: O(n)
  - 1x decode call: O(data size)
  - Overall: O(m + n + d)

Space: O(n)
  - Result object: O(n)
  - Temporary arrays: O(n)
```

### Optimization Patterns Observed

1. **Topic[0] hash lookup**: Cache selector computations
2. **AbiParameters.decode()**: Batches non-indexed decoding (not param-by-param)
3. **Separate topic/data paths**: Avoids unnecessary concatenation
4. **Exit early**: Throw on selector mismatch before decoding

---

## 9. Implementation Comparison Table

| Feature | ethers.js | viem | ox |
|---------|-----------|------|-----|
| **API** | `interface.parseLog()` | `decodeEventLog()` | `AbiEvent.decode()` |
| **Topic[0] Check** | Yes (required) | Yes (required) | Yes (required) |
| **Strict Mode** | Always strict | Configurable | Strict only |
| **Dynamic Type Hash** | Wrapped in `Indexed` | Returned as-is | Returned as-is |
| **Return Format** | `LogDescription` object | `{ eventName, args }` | Typed args object |
| **Error on Mismatch** | Throws | Throws (strict) / silent (non-strict) | Throws |
| **Parameter Order** | Preserved | Preserved | Preserved |
| **Named/Unnamed** | Yes / Yes | Yes / Array fallback | Yes / Array fallback |

---

## 10. Code Patterns for Implementation

### Pattern: Topic[0] Selector Verification

```typescript
// ethers.js
const eventTopic = fragment.topicHash;
assertArgument(topics[0].toLowerCase() === eventTopic,
  "fragment/topic mismatch", "topics[0]", topics[0]);

// viem
const abiItem = abi.find((x) =>
  x.type === 'event' &&
  signature === toEventSelector(formatAbiItem(x) as EventDefinition)
);

// ox
const selector = getSelector(abiEvent);
if (selector_ !== selector)
  throw new SelectorTopicMismatchError({...})
```

### Pattern: Indexed Parameter Extraction

```typescript
// ethers.js
const indexed: Array<ParamType> = [];
fragment.inputs.forEach((param) => {
  if (param.indexed) {
    if (isDynamic(param.type)) {
      indexed.push(ParamType.from({ type: "bytes32" }));
    } else {
      indexed.push(param);
    }
  }
});
const resultIndexed = this.#abiCoder.decode(indexed, concat(topics));

// viem
const indexedInputs = inputs.filter((x) => 'indexed' in x && x.indexed);
for (let i = 0; i < indexedInputs.length; i++) {
  args[key] = decodeTopic({ param: indexedInputs[i], value: argTopics[i] });
}

// ox
const indexedInputs = inputs.filter(x => x.indexed);
for (let i = 0; i < indexedInputs.length; i++) {
  args[key] = decodeTopicValue(indexedInputs[i], argTopics[i]);
}
```

### Pattern: Non-Indexed Parameter Extraction

```typescript
// ethers.js
const nonIndexed: Array<ParamType> = [];
fragment.inputs.forEach((param) => {
  if (!param.indexed) nonIndexed.push(param);
});
const resultNonIndexed = this.#abiCoder.decode(nonIndexed, data, true);

// viem
const nonIndexedInputs = inputs.filter((x) => !('indexed' in x && x.indexed));
if (nonIndexedInputs.length > 0 && data && data !== '0x') {
  const decodedData = decodeAbiParameters(nonIndexedInputs, data);
  for (let i = 0; i < nonIndexedInputs.length; i++) {
    args[nonIndexedInputs[i].name!] = decodedData[i];
  }
}

// ox
const nonIndexedInputs = inputs.filter(x => !x.indexed);
if (nonIndexedInputs.length > 0 && data && data !== '0x') {
  const decodedData = AbiParameters.decode(nonIndexedInputs, data);
  // merge into args
}
```

---

## 11. Error Handling Patterns

### Topic Mismatch
- **Scenario**: topics[0] doesn't match any event in ABI
- **ethers.js**: Returns null
- **viem**: Throws `AbiEventSignatureNotFoundError`
- **ox**: Throws `SelectorTopicMismatchError`

### Data Mismatch
- **Scenario**: Non-indexed data size doesn't match ABI expectations
- **ethers.js**: Throws parsing error
- **viem** (strict): Throws `DecodeLogDataMismatch`
- **viem** (non-strict): Silently allows partial decode
- **ox**: Throws error

### Topic Count Mismatch
- **Scenario**: Fewer topics than indexed parameters
- **All**: Throw error (`DecodeLogTopicsMismatch`, etc.)

---

## 12. Real-World Example

### Complete Decoding Example: ERC20 Transfer

**Event Definition:**
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```

**Raw Log (from eth_getLogs):**
```json
{
  "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  "topics": [
    "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef",
    "0x0000000000000000000000008ba1f109551bD432803012645Ac136ddd64DBA72",
    "0x000000000000000000000000283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75"
  ],
  "data": "0x0000000000000000000000000000000000000000000000000000000000000064"
}
```

**Decoding (viem):**
```typescript
const result = decodeEventLog({
  abi: ERC20_ABI,
  topics: logs[0].topics,
  data: logs[0].data
})

// Result:
// {
//   eventName: "Transfer",
//   args: {
//     from: "0x8ba1f109551bD432803012645Ac136ddd64DBA72",
//     to: "0x283Af0B28c0e6D7eAA3e130c4CfA147e163A7e75",
//     value: 100n
//   }
// }
```

**Step-by-Step Breakdown:**
1. **topics[0]**: `0xddf252ad...` matches Transfer(address,address,uint256) ✓
2. **topics[1]**: Address from indexed param → decode as address
3. **topics[2]**: Address to indexed param → decode as address
4. **data**: `0x...0064` → decode as uint256 → 100

---

## Summary

### Key Takeaways

1. **All three libraries implement identical core algorithm**: Topic[0] verification → parameter separation → indexed/non-indexed decoding → reconstruction

2. **Topic[0] is non-recoverable hash**: Applications must have ABI to decode; can't reverse the hash

3. **Dynamic types in topics are hashes**: Only decoded if they're non-indexed in data

4. **Parameter order preserved**: Iterate original ABI inputs to reconstruct result object

5. **Performance is O(n)**: Where n = number of parameters; single-pass iteration

6. **Error handling differs**: ethers.js returns null on mismatch; viem/ox throw errors

7. **Strict mode critical**: viem allows non-strict mode for partial decoding

8. **Named parameters supported**: Falls back to array indexing if unnamed

### Implementation Pattern (Generic)

```typescript
function decodeEventLog(abi, topics, data) {
  // 1. Extract selector and validate
  const signature = topics[0]
  const event = findEventInAbi(abi, signature)

  // 2. Separate parameters
  const indexed = event.inputs.filter(p => p.indexed)
  const nonIndexed = event.inputs.filter(p => !p.indexed)

  // 3. Decode indexed from topics[1:]
  const decodedIndexed = indexed.map((p, i) =>
    decodeTopic(p, topics[1 + i])
  )

  // 4. Decode non-indexed from data
  const decodedNonIndexed = data ? decodeData(nonIndexed, data) : []

  // 5. Reconstruct in original order
  const result = {}
  let idxIdx = 0, nonIdxIdx = 0
  for (const input of event.inputs) {
    if (input.indexed) {
      result[input.name] = decodedIndexed[idxIdx++]
    } else {
      result[input.name] = decodedNonIndexed[nonIdxIdx++]
    }
  }

  return result
}
```

---

## References

- **ethers.js**: https://github.com/ethers-io/ethers.js/blob/main/src.ts/abi/interface.ts
- **viem**: https://github.com/wevm/viem/blob/main/src/utils/abi/decodeEventLog.ts
- **Ox**: https://github.com/wevm/ox & https://oxlib.sh/guides/abi
- **Ethereum Events**: https://docs.ethers.org/v5/concepts/events/
- **Topic[0] Database**: https://github.com/wmitsuda/topic0
