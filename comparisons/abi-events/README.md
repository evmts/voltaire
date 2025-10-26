# ABI Events & Errors Benchmarks

Benchmarks for encoding and decoding Ethereum event logs and custom errors across different JavaScript/TypeScript libraries.

## Functions

### encodeEventTopics

Encodes event parameters into a topics array for filtering and log queries.

**Use Cases:**
- Creating event filters for `eth_getLogs` RPC calls
- Building log queries with indexed parameter filters
- Generating event signatures for blockchain monitoring

**Implementations:**
- **Ethers**: `interface.encodeFilterTopics(eventName, values)`
- **Viem**: `encodeEventTopics({ abi, eventName, args })`
- **Guil**: Not available, uses viem as fallback

**Example:**
```typescript
// Encode Transfer(address indexed from, address indexed to, uint256 value)
// Returns: [eventSignature, fromTopic, toTopic]
const topics = encodeEventTopics({
  abi,
  eventName: 'Transfer',
  args: { from: '0x...', to: '0x...' }
});
```

### decodeEventLog

Decodes event log data and topics back to typed values.

**Use Cases:**
- Parsing transaction receipts and event logs
- Extracting structured data from blockchain events
- Processing historical logs from `eth_getLogs`

**Implementations:**
- **Ethers**: `interface.parseLog({ data, topics })`
- **Viem**: `decodeEventLog({ abi, data, topics })`
- **Guil**: Not available, uses viem as fallback

**Example:**
```typescript
// Decode Transfer event log
const decoded = decodeEventLog({
  abi,
  data: '0x...', // uint256 value
  topics: ['0x...', '0x...', '0x...'] // [signature, from, to]
});
// Returns: { from: '0x...', to: '0x...', value: 100n }
```

### encodeErrorResult

Encodes custom error with parameters into revert data format.

**Use Cases:**
- Generating expected revert data for testing
- Creating custom error responses in smart contracts
- Building error handling for contract calls

**Implementations:**
- **Ethers**: `interface.encodeErrorResult(errorName, values)`
- **Viem**: `encodeErrorResult({ abi, errorName, args })`
- **Guil**: Not available, uses viem as fallback

**Example:**
```typescript
// Encode InsufficientBalance(uint256 available, uint256 required)
const encoded = encodeErrorResult({
  abi,
  errorName: 'InsufficientBalance',
  args: [50n, 100n]
});
// Returns: '0xcf479181...' (4-byte selector + encoded args)
```

### decodeErrorResult

Decodes custom error from revert data back to typed values.

**Use Cases:**
- Debugging failed contract calls
- Extracting error details from reverted transactions
- Building user-friendly error messages

**Implementations:**
- **Ethers**: `interface.parseError(data)`
- **Viem**: `decodeErrorResult({ abi, data })`
- **Guil**: Not available, uses viem as fallback

**Example:**
```typescript
// Decode InsufficientBalance error
const decoded = decodeErrorResult({
  abi,
  data: '0xcf479181...'
});
// Returns: { available: 50n, required: 100n }
```

## Implementation Notes

### Guil (@tevm/primitives)

Event and error encoding/decoding utilities are not yet implemented in guil. All benchmarks use viem as a fallback implementation. Future versions may include native implementations optimized for guil's architecture.

### Ethers

Provides comprehensive ABI encoding/decoding through the `Interface` class:
- Supports human-readable ABI format
- Centralized ABI management
- Methods: `encodeFilterTopics`, `parseLog`, `encodeErrorResult`, `parseError`

### Viem

Offers dedicated functions for each operation:
- Individual imports for each function
- Requires typed ABI objects with `as const` assertions
- Strong TypeScript type inference
- Functions: `encodeEventTopics`, `decodeEventLog`, `encodeErrorResult`, `decodeErrorResult`

## Test Data

### Transfer Event

Standard ERC20 Transfer event:
```solidity
event Transfer(address indexed from, address indexed to, uint256 value)
```

Test case: Transfer of 100 wei from address A to address B

**Event Signature**: `0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef`

### InsufficientBalance Error

Custom error for balance checks:
```solidity
error InsufficientBalance(uint256 available, uint256 required)
```

Test case: Attempted transfer with 50 wei available but 100 wei required

**Error Selector**: `0xcf479181`

## Usage

```bash
# Run all ABI events & errors benchmarks
bun run vitest bench comparisons/abi-events/ --run

# Run specific benchmark
bun run vitest bench comparisons/abi-events/decodeEventLog.bench.ts --run
bun run vitest bench comparisons/abi-events/encodeEventTopics.bench.ts --run
bun run vitest bench comparisons/abi-events/encodeErrorResult.bench.ts --run
bun run vitest bench comparisons/abi-events/decodeErrorResult.bench.ts --run
```

## Performance Considerations

### Event Encoding
- Keccak-256 hashing for event signature
- ABI encoding for indexed parameters
- Topic array construction

### Event Decoding
- ABI parsing and validation
- Type reconstruction from raw bytes
- Indexed vs non-indexed parameter handling

### Error Encoding
- 4-byte selector calculation
- ABI encoding for error parameters
- Compact revert data format

### Error Decoding
- Selector matching against ABI
- Parameter extraction and typing
- Error name resolution

## Related Benchmarks

- `comparisons/abi-encoding/` - General ABI encoding/decoding
- `comparisons/abi-function/` - Function call encoding/decoding
- `comparisons/keccak256/` - Hash function used for event signatures
