# AccessListConstructor

TypeScript interface defining AccessList constructor signatures, prototype methods, and static methods.

## Constructor Signatures

```typescript
(value: readonly Item[] | Uint8Array): AccessListPrototype
```

Factory function syntax. Accepts items array or RLP bytes.

## AccessListPrototype

Extends `BrandedAccessList` with instance methods:

**Query Methods:**
- `gasCost()` - Calculate gas cost
- `gasSavings()` - Calculate savings
- `hasSavings()` - Check if beneficial
- `includesAddress(address)` - Check address presence
- `includesStorageKey(address, key)` - Check key presence
- `keysFor(address)` - Get keys for address
- `addressCount()` - Count addresses
- `storageKeyCount()` - Count keys
- `isEmpty()` - Check if empty

**Manipulation Methods:**
- `deduplicate()` - Remove duplicates
- `withAddress(address)` - Add address
- `withStorageKey(address, key)` - Add key

**Validation & Conversion:**
- `assertValid()` - Validate structure
- `toBytes()` - Encode to RLP

## Static Methods

**Constructors:**
- `from(value: readonly Item[] | Uint8Array)` - Universal constructor
- `fromBytes(value: Uint8Array)` - From RLP bytes
- `create()` - Empty list

**Type Guards:**
- `is(value)` - Type guard
- `isItem(value)` - Item type guard
- `assertValid(list)` - Validate with throws

**Queries:**
- `includesAddress(list, address)` - Check address
- `includesStorageKey(list, address, key)` - Check key
- `keysFor(list, address)` - Get keys
- `addressCount(list)` - Count addresses
- `storageKeyCount(list)` - Count keys
- `isEmpty(list)` - Check empty

**Manipulation:**
- `withAddress(list, address)` - Add address
- `withStorageKey(list, address, key)` - Add key
- `deduplicate(list)` - Remove duplicates
- `merge(...lists)` - Combine lists

**Gas Analysis:**
- `gasCost(list)` - Calculate cost
- `gasSavings(list)` - Calculate savings
- `hasSavings(list)` - Check beneficial

**Conversions:**
- `toBytes(list)` - Encode to RLP

**Constants:**
- `ADDRESS_COST` - 2400n gas per address
- `STORAGE_KEY_COST` - 1900n gas per key
- `COLD_ACCOUNT_ACCESS_COST` - 2600n gas
- `COLD_STORAGE_ACCESS_COST` - 2100n gas
- `WARM_STORAGE_ACCESS_COST` - 100n gas

## Pattern

Static methods operate on data passed as first arg. Instance methods operate on `this`. All methods tree-shakable via namespace pattern.
