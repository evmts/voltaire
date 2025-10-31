# ABI Event

Event ABI items represent contract events that are emitted during transaction execution. Events are logged on the blockchain and can be used to track state changes.

## Type Definition

```typescript
import { Abi } from '@tevm/voltaire';

type Abi.Event = {
  type: 'event';
  name: string;
  inputs: readonly Abi.Parameter[];
  anonymous?: boolean;
};
```

Event parameters can be marked as `indexed`, which affects how they are stored in the transaction logs.

## Creating Event Definitions

### Basic Event

```typescript
const Transfer: Abi.Event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
};
```

### Anonymous Event

```typescript
const AnonymousLog: Abi.Event = {
  type: 'event',
  name: 'AnonymousLog',
  anonymous: true,
  inputs: [
    { type: 'bytes32', name: 'data', indexed: false }
  ]
};
```

Anonymous events do not include the event signature as topic[0], allowing for one additional indexed parameter.

### Complex Event with Multiple Indexed Parameters

```typescript
const Approval: Abi.Event = {
  type: 'event',
  name: 'Approval',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
};
```

## Signature Generation

Generate the canonical signature string for an event:

```typescript
const sig = Abi.Event.getSignature.call(Transfer);
// Returns: "Transfer(address,address,uint256)"
```

The signature includes all parameter types, regardless of whether they are indexed.

## Selector Computation

The event selector is the full 32-byte keccak256 hash of the event signature, used as topic[0] in logs:

```typescript
const selector = Abi.Event.getSelector.call(Transfer);
// Returns: 32-byte Uint8Array
// 0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef
```

You can also compute selectors directly from signature strings:

```typescript
const selector = Abi.getEventSelector('Transfer(address,address,uint256)');
// Returns: 32-byte Uint8Array
```

For anonymous events, no selector is computed since they do not have topic[0].

## Indexed vs Non-Indexed Parameters

Event parameters can be either indexed or non-indexed:

- **Indexed parameters**: Stored as topics in the log, enabling efficient filtering. Limited to 3 indexed parameters (4 for anonymous events).
- **Non-indexed parameters**: Stored in the log data, can be any size or complexity.

### Restrictions

| Parameter Type | Can Be Indexed | Storage |
|---------------|----------------|---------|
| address | Yes | topic |
| bool | Yes | topic |
| uintN | Yes | topic |
| intN | Yes | topic |
| bytesN | Yes | topic |
| bytes | No (hash only) | topic (keccak256) |
| string | No (hash only) | topic (keccak256) |
| arrays | No (hash only) | topic (keccak256) |
| tuples | No (hash only) | topic (keccak256) |

When dynamic types (bytes, string, arrays, tuples) are indexed, only their keccak256 hash is stored in the topic.

## Encoding Event Topics

Encode indexed parameters as topics:

```typescript
const from = Address.from('0x0000000000000000000000000000000000000000');
const to = Address.from('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3');

const topics = Abi.Event.encodeTopics.call(Transfer, { from, to });
// Returns: [
//   topic0 (event selector),
//   topic1 (from address),
//   topic2 (to address)
// ]
```

You can provide a partial set of indexed parameters for filtering:

```typescript
// Only filter by 'to' address
const topics = Abi.Event.encodeTopics.call(Transfer, { to });
// Returns: [topic0, null, topic2]
```

## Decoding Event Logs

Decode a complete event log:

```typescript
const log = {
  topics: [
    '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
    '0x0000000000000000000000000000000000000000000000000000000000000000',
    '0x000000000000000000000000742d35cc6634c0532925a3b844bc9e7595f251e3'
  ],
  data: '0x0000000000000000000000000000000000000000000000000de0b6b3a7640000'
};

const decoded = Abi.Event.decodeLog.call(Transfer, log.data, log.topics);
// Returns: {
//   from: Address('0x0000000000000000000000000000000000000000'),
//   to: Address('0x742d35Cc6634C0532925a3b844Bc9e7595f251e3'),
//   value: 1000000000000000000n
// }
```

The result is an object with all event parameters (both indexed and non-indexed).

## Type Inference

Extract TypeScript types from event definitions:

```typescript
type TransferParams = Abi.ParametersToObject<typeof Transfer.inputs>;
// {
//   readonly from: Address;
//   readonly to: Address;
//   readonly value: bigint;
// }
```

## Formatting

### Format Event Definition

```typescript
const formatted = Abi.formatAbiItem(Transfer);
// "event Transfer(address indexed from, address indexed to, uint256 value)"
```

The format includes the `indexed` keyword for indexed parameters.

### Format Event with Arguments

```typescript
const formatted = Abi.formatAbiItemWithArgs(Transfer, [
  '0x0000000000000000000000000000000000000000',
  '0x742d35Cc6634C0532925a3b844Bc9e7595f251e3',
  1000000000000000000n
]);
// "Transfer(0x0000000000000000000000000000000000000000, 0x742d35Cc6634C0532925a3b844Bc9e7595f251e3, 1000000000000000000)"
```

## Complex Parameter Types

### Events with Tuples

```typescript
const OrderCreated: Abi.Event = {
  type: 'event',
  name: 'OrderCreated',
  inputs: [
    { type: 'uint256', name: 'orderId', indexed: true },
    {
      type: 'tuple',
      name: 'order',
      indexed: false,
      components: [
        { type: 'address', name: 'maker' },
        { type: 'address', name: 'token' },
        { type: 'uint256', name: 'amount' }
      ]
    }
  ]
};

type OrderParams = Abi.ParametersToObject<typeof OrderCreated.inputs>;
// {
//   readonly orderId: bigint;
//   readonly order: {
//     readonly maker: Address;
//     readonly token: Address;
//     readonly amount: bigint;
//   };
// }
```

### Events with Arrays

```typescript
const BatchTransfer: Abi.Event = {
  type: 'event',
  name: 'BatchTransfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address[]', name: 'recipients', indexed: false },
    { type: 'uint256[]', name: 'amounts', indexed: false }
  ]
};

type BatchParams = Abi.ParametersToObject<typeof BatchTransfer.inputs>;
// {
//   readonly from: Address;
//   readonly recipients: readonly Address[];
//   readonly amounts: readonly bigint[];
// }
```

## Error Handling

```typescript
import {
  AbiEncodingError,
  AbiDecodingError,
  AbiParameterMismatchError
} from '@tevm/voltaire';

// Topic encoding errors
try {
  const topics = Abi.Event.encodeTopics.call(event, params);
} catch (err) {
  if (err instanceof AbiEncodingError) {
    console.error('Topic encoding failed:', err.message);
  }
  if (err instanceof AbiParameterMismatchError) {
    console.error('Invalid indexed parameters:', err.message);
  }
}

// Log decoding errors
try {
  const decoded = Abi.Event.decodeLog.call(event, data, topics);
} catch (err) {
  if (err instanceof AbiDecodingError) {
    console.error('Log decoding failed:', err.message);
  }
}
```

## Performance

Based on benchmark results:

- **Signature generation**: ~20,000,000 operations/second
- **Selector computation**: ~325,000 operations/second (dominated by keccak256)
- **Topic encoding**: ~2,600,000 operations/second
- **Log decoding**: Varies based on complexity

## Event Log Structure

Ethereum logs have the following structure:

```typescript
interface Log {
  address: Address;      // Contract that emitted the event
  topics: Hex[];         // Indexed parameters (max 4)
  data: Hex;             // Non-indexed parameters
  blockNumber: bigint;   // Block number
  transactionHash: Hex;  // Transaction hash
  logIndex: bigint;      // Log index in block
}
```

### Topic Layout

- **topic[0]**: Event selector (signature hash) for non-anonymous events
- **topic[1]**: First indexed parameter
- **topic[2]**: Second indexed parameter
- **topic[3]**: Third indexed parameter

Anonymous events skip topic[0], allowing 4 indexed parameters instead of 3.

## Filtering Events

Events can be efficiently filtered using topics:

```typescript
// Filter by specific 'from' address
const topics = Abi.Event.encodeTopics.call(Transfer, {
  from: Address.from('0x1234...')
});

// Filter by multiple 'to' addresses (OR logic)
const topics = Abi.Event.encodeTopics.call(Transfer, {
  to: [
    Address.from('0x1234...'),
    Address.from('0x5678...')
  ]
});

// Filter by both 'from' and 'to' (AND logic)
const topics = Abi.Event.encodeTopics.call(Transfer, {
  from: Address.from('0x1234...'),
  to: Address.from('0x5678...')
});
```

## Best Practices

1. **Use indexed parameters for filter criteria**: Mark parameters as indexed if they will be used for filtering.

```typescript
const event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },  // Filterable
    { type: 'address', name: 'to', indexed: true },    // Filterable
    { type: 'uint256', name: 'value', indexed: false } // Not filterable
  ]
} as const satisfies Abi.Event;
```

2. **Limit indexed parameters**: Maximum 3 indexed parameters (4 for anonymous events).

3. **Use anonymous events sparingly**: Anonymous events save gas but are harder to decode since topic[0] is not the event signature.

4. **Handle dynamic type hashing**: Remember that indexed dynamic types only store their keccak256 hash:

```typescript
const event: Abi.Event = {
  type: 'event',
  name: 'Message',
  inputs: [
    { type: 'string', name: 'text', indexed: true }  // Only hash is stored
  ]
};
```

5. **Use `as const satisfies Abi.Event`** for full type inference:

```typescript
const Transfer = {
  type: 'event',
  name: 'Transfer',
  inputs: [{ type: 'address', name: 'from', indexed: true }]
} as const satisfies Abi.Event;
```

## Common Patterns

### ERC-20 Events

```typescript
const Transfer: Abi.Event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
};

const Approval: Abi.Event = {
  type: 'event',
  name: 'Approval',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'spender', indexed: true },
    { type: 'uint256', name: 'value', indexed: false }
  ]
};
```

### ERC-721 Events

```typescript
const Transfer: Abi.Event = {
  type: 'event',
  name: 'Transfer',
  inputs: [
    { type: 'address', name: 'from', indexed: true },
    { type: 'address', name: 'to', indexed: true },
    { type: 'uint256', name: 'tokenId', indexed: true }
  ]
};

const Approval: Abi.Event = {
  type: 'event',
  name: 'Approval',
  inputs: [
    { type: 'address', name: 'owner', indexed: true },
    { type: 'address', name: 'approved', indexed: true },
    { type: 'uint256', name: 'tokenId', indexed: true }
  ]
};
```

## See Also

- [ABI Overview](./abi.md)
- [ABI Functions](./abi.function.md)
- [ABI Errors](./abi.error.md)
- [ABI Types](./abi.types.md)
- [ABI Encoding](./abi.encoding.md)
