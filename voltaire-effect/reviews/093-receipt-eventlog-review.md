# Review 093: Receipt and EventLog Primitives

<issue>
<metadata>
priority: P0
category: deep-review
files: [
  voltaire-effect/src/primitives/Receipt/ReceiptSchema.ts,
  voltaire-effect/src/primitives/Receipt/index.ts,
  voltaire-effect/src/primitives/EventLog/EventLogSchema.ts,
  voltaire-effect/src/primitives/EventLog/Rpc.ts,
  voltaire-effect/src/primitives/LogFilter/Rpc.ts,
  voltaire-effect/src/primitives/LogIndex/Number.ts
]
reviews: [059-fix-receipt-pre-byzantium-status.md]
</metadata>

<module_overview>
Effect Schema wrappers for transaction receipts, event logs, log filters, and log indices. These handle parsing RPC responses for `eth_getTransactionReceipt`, `eth_getLogs`, and subscription events.

**Severity**: HIGH - Critical schema divergence from base primitives breaks EIP-1559 and EIP-4844 support.
</module_overview>

<viem_reference>
<feature>Transaction Receipt Types</feature>
<location>viem/src/types/transaction.ts</location>
<implementation>
```typescript
type TransactionReceipt = {
  // Required
  blockHash: Hash
  blockNumber: bigint
  contractAddress: Address | null
  cumulativeGasUsed: bigint
  effectiveGasPrice: bigint  // ← Required for EIP-1559
  from: Address
  gasUsed: bigint
  logs: Log[]
  logsBloom: Hex
  transactionHash: Hash
  transactionIndex: number
  type: TransactionType  // ← Required to distinguish tx types
  
  // Pre-Byzantium (one of):
  root?: Hash        // State root (pre-Byzantium)
  status?: 'success' | 'reverted'  // Status (post-Byzantium)
  
  // EIP-4844 (optional)
  blobGasUsed?: bigint
  blobGasPrice?: bigint
}
```
</implementation>
</viem_reference>

<viem_reference>
<feature>Log Type</feature>
<location>viem/src/types/log.ts</location>
<implementation>
```typescript
type Log = {
  address: Address
  blockHash: Hash | null
  blockNumber: bigint | null
  data: Hex
  logIndex: number | null
  transactionHash: Hash | null
  transactionIndex: number | null
  topics: [Hex, ...Hex[]] | []  // Max 4 topics (LOG0-LOG4)
  removed: boolean
}
```
</implementation>
</viem_reference>

<findings>
<critical>
### 1. Receipt Schema Missing EIP Fields (P0)

**Location**: `Receipt/ReceiptSchema.ts#L117-175`

The Effect schema ReceiptType is missing critical fields from base type:

```typescript
// Effect schema (INCOMPLETE):
export interface ReceiptType {
  readonly status: 0 | 1;  // ❌ Required, should be optional
  // ❌ MISSING: effectiveGasPrice
  // ❌ MISSING: type  
  // ❌ MISSING: blobGasUsed
  // ❌ MISSING: blobGasPrice
  // ❌ MISSING: root
}

// Base type (CORRECT):
type ReceiptType = {
  readonly status?: TransactionStatusType;  // Optional!
  readonly root?: HashType;                 // Pre-Byzantium
  readonly effectiveGasPrice: Uint256Type;  // Required for EIP-1559
  readonly type: "legacy" | "eip2930" | "eip1559" | "eip4844" | "eip7702";
  readonly blobGasUsed?: Uint256Type;       // EIP-4844
  readonly blobGasPrice?: Uint256Type;      // EIP-4844
}
```

**Impact**: 
- EIP-1559 receipts missing `effectiveGasPrice` - cannot calculate actual gas paid
- EIP-4844 receipts missing blob gas fields
- Pre-Byzantium receipts rejected (required `status` field)

### 2. Pre-Byzantium Handling Broken (P0)

**Location**: `Receipt/ReceiptSchema.ts#L346`

```typescript
// Current (BROKEN):
status: S.Literal(0, 1),  // Required!

// Should be union:
S.Union(
  S.Struct({ root: HashSchema, status: S.optional(S.Never) }),
  S.Struct({ status: S.Literal(0, 1), root: S.optional(S.Never) })
)
```
</critical>

<high>
### 3. Topics Array No Max Length Validation (P1)

**Location**: `EventLog/Rpc.ts#L46`

```typescript
// Current:
topics: S.Array(HashSchema),

// EVM limit: LOG0-LOG4 = max 4 topics
// Should be:
topics: S.Array(HashSchema).pipe(S.maxItems(4)),
```

### 4. LogFilter blockhash/fromBlock Mutual Exclusivity (P1)

**Location**: `LogFilter/Rpc.ts#L163-167`

JSON-RPC spec requires `blockhash` to be mutually exclusive with `fromBlock/toBlock`. Schema allows both.

```typescript
// Add refinement:
const LogFilterRpc = LogFilterRpcBase.pipe(
  S.filter(
    (f) => !(f.blockhash && (f.fromBlock !== undefined || f.toBlock !== undefined)),
    { message: () => "blockhash cannot be used with fromBlock/toBlock" }
  )
);
```
</high>

<medium>
### 5. LogIndex Accepts BigInt Unnecessarily (P2)

Log indices are always small integers within a block. Accepting `bigint` is overkill and can cause issues.

### 6. Duplicate Type Definitions (P2)

Both `LogType` and `ReceiptType` are redefined locally instead of importing from base primitives, creating drift risk.
</medium>
</findings>

<effect_solution>
```typescript
// Correct Receipt Schema with Union for Pre/Post-Byzantium

const CommonReceiptFields = S.Struct({
  transactionHash: HashSchema,
  blockNumber: BigIntFromHex,
  blockHash: HashSchema,
  transactionIndex: S.Number,
  from: AddressSchema,
  to: S.NullOr(AddressSchema),
  cumulativeGasUsed: BigIntFromHex,
  gasUsed: BigIntFromHex,
  effectiveGasPrice: BigIntFromHex,  // Required for EIP-1559+
  contractAddress: S.NullOr(AddressSchema),
  logs: S.Array(LogSchema),
  logsBloom: HexSchema,
  type: S.Literal('legacy', 'eip2930', 'eip1559', 'eip4844', 'eip7702'),
  
  // EIP-4844 optional fields
  blobGasUsed: S.optional(BigIntFromHex),
  blobGasPrice: S.optional(BigIntFromHex),
})

const PreByzantiumReceiptSchema = S.extend(CommonReceiptFields, S.Struct({
  root: HashSchema,
}))

const PostByzantiumReceiptSchema = S.extend(CommonReceiptFields, S.Struct({
  status: S.transform(
    S.Literal('0x0', '0x1'),
    S.Literal('reverted', 'success'),
    { decode: (s) => s === '0x1' ? 'success' : 'reverted', encode: (s) => s === 'success' ? '0x1' : '0x0' }
  ),
}))

const ReceiptRpcSchema = S.Union(
  PreByzantiumReceiptSchema,
  PostByzantiumReceiptSchema
)

// Log Schema with max topics validation
const LogSchema = S.Struct({
  address: AddressSchema,
  blockHash: S.NullOr(HashSchema),
  blockNumber: S.NullOr(BigIntFromHex),
  data: HexSchema,
  logIndex: S.NullOr(S.Number),
  transactionHash: S.NullOr(HashSchema),
  transactionIndex: S.NullOr(S.Number),
  topics: S.Array(HashSchema).pipe(S.maxItems(4)),
  removed: S.Boolean,
})

// LogFilter with mutual exclusivity
const LogFilterSchema = S.Struct({
  address: S.optional(S.Union(AddressSchema, S.Array(AddressSchema))),
  topics: S.optional(S.Array(S.NullOr(S.Union(HashSchema, S.Array(HashSchema))))),
  fromBlock: S.optional(BlockTagSchema),
  toBlock: S.optional(BlockTagSchema),
  blockhash: S.optional(HashSchema),
}).pipe(
  S.filter(
    (f) => !(f.blockhash && (f.fromBlock !== undefined || f.toBlock !== undefined)),
    { message: () => "blockhash is mutually exclusive with fromBlock/toBlock" }
  )
)
```
</effect_solution>

<implementation>
<refactoring_steps>
1. **Update ReceiptType interface** - Add all missing fields from base type
2. **Create Union for Pre/Post-Byzantium** - Handle root vs status correctly
3. **Add effectiveGasPrice/type** - Required fields for EIP-1559+
4. **Add EIP-4844 fields** - Optional blobGasUsed/blobGasPrice
5. **Add topics maxItems(4)** - Enforce EVM limit
6. **Add LogFilter refinement** - Enforce blockhash mutual exclusivity
7. **Import types from base** - Remove duplicate definitions
</refactoring_steps>

<new_files>
- src/primitives/Receipt/PreByzantiumReceiptSchema.ts
- src/primitives/Receipt/PostByzantiumReceiptSchema.ts
</new_files>
</implementation>

<tests>
```typescript
describe('ReceiptSchema', () => {
  const baseReceipt = {
    transactionHash: '0x' + 'ab'.repeat(32),
    blockNumber: '0x1',
    blockHash: '0x' + 'cd'.repeat(32),
    transactionIndex: 0,
    from: '0x' + '11'.repeat(20),
    to: '0x' + '22'.repeat(20),
    cumulativeGasUsed: '0x5208',
    gasUsed: '0x5208',
    effectiveGasPrice: '0x4a817c800',
    contractAddress: null,
    logs: [],
    logsBloom: '0x' + '00'.repeat(256),
    type: 'eip1559',
  }

  it('parses post-Byzantium receipt with status', () => {
    const receipt = S.decodeSync(ReceiptRpcSchema)({
      ...baseReceipt,
      status: '0x1',
    })
    expect(receipt.status).toBe('success')
  })

  it('parses pre-Byzantium receipt with root', () => {
    const receipt = S.decodeSync(ReceiptRpcSchema)({
      ...baseReceipt,
      root: '0x' + 'ef'.repeat(32),
    })
    expect(receipt.root?.length).toBe(66)
    expect(receipt.status).toBeUndefined()
  })

  it('includes EIP-4844 blob gas fields', () => {
    const receipt = S.decodeSync(ReceiptRpcSchema)({
      ...baseReceipt,
      status: '0x1',
      blobGasUsed: '0x20000',
      blobGasPrice: '0x3b9aca00',
    })
    expect(receipt.blobGasUsed).toBe(131072n)
    expect(receipt.blobGasPrice).toBe(1000000000n)
  })

  it('requires effectiveGasPrice', () => {
    const { effectiveGasPrice, ...noGasPrice } = baseReceipt
    expect(() =>
      S.decodeSync(ReceiptRpcSchema)({ ...noGasPrice, status: '0x1' })
    ).toThrow()
  })
})

describe('LogSchema topics validation', () => {
  it('accepts 0-4 topics', () => {
    for (let i = 0; i <= 4; i++) {
      const topics = Array(i).fill('0x' + 'ab'.repeat(32))
      const log = S.decodeSync(LogSchema)({
        address: '0x' + '11'.repeat(20),
        data: '0x',
        topics,
        blockHash: null,
        blockNumber: null,
        logIndex: null,
        transactionHash: null,
        transactionIndex: null,
        removed: false,
      })
      expect(log.topics).toHaveLength(i)
    }
  })

  it('rejects more than 4 topics', () => {
    const topics = Array(5).fill('0x' + 'ab'.repeat(32))
    expect(() =>
      S.decodeSync(LogSchema)({
        address: '0x' + '11'.repeat(20),
        data: '0x',
        topics,
        blockHash: null,
        blockNumber: null,
        logIndex: null,
        transactionHash: null,
        transactionIndex: null,
        removed: false,
      })
    ).toThrow()
  })
})

describe('LogFilter mutual exclusivity', () => {
  it('allows blockhash alone', () => {
    const filter = S.decodeSync(LogFilterSchema)({
      blockhash: '0x' + 'ab'.repeat(32)
    })
    expect(filter.blockhash).toBeDefined()
  })

  it('allows fromBlock/toBlock without blockhash', () => {
    const filter = S.decodeSync(LogFilterSchema)({
      fromBlock: '0x1',
      toBlock: 'latest'
    })
    expect(filter.fromBlock).toBe('0x1')
  })

  it('rejects blockhash with fromBlock', () => {
    expect(() =>
      S.decodeSync(LogFilterSchema)({
        blockhash: '0x' + 'ab'.repeat(32),
        fromBlock: '0x1'
      })
    ).toThrow('mutually exclusive')
  })
})
```
</tests>

<references>
- [EIP-658: Embedding transaction status code in receipts](https://eips.ethereum.org/EIPS/eip-658)
- [EIP-1559: Fee market change](https://eips.ethereum.org/EIPS/eip-1559)
- [EIP-4844: Shard Blob Transactions](https://eips.ethereum.org/EIPS/eip-4844)
- [Effect Schema docs](https://effect.website/docs/schema)
- [viem TransactionReceipt type](https://github.com/wevm/viem/blob/main/src/types/transaction.ts)
</references>
</issue>
