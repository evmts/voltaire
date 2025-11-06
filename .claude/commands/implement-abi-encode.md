# Implement ABI Encode/Decode Functions

**Priority: MEDIUM**

ABI type definitions exist but encode/decode functions missing.

## Task
Implement core ABI encoding/decoding functions.

## Functions to Add

### Encoding
```typescript
encodeFunction(abi, functionName, params): Hex
  // Encode function call data (selector + params)

encodeParameters(types, values): Hex
  // Encode parameter values

encodeConstructor(abi, params): Hex
  // Encode constructor call

encodePacked(...values): Hex
  // ABI encodePacked (no padding)
```

### Decoding
```typescript
decodeFunction(abi, data): { name, params }
  // Decode function call data

decodeParameters(types, data): any[]
  // Decode parameter values

decodeLog(abi, log): { event, params }
  // Decode event log data
```

### Utilities
```typescript
getSelector(signature): Hex
  // Get function selector (first 4 bytes of keccak256)

getFunctionBySelector(abi, selector): AbiFunction
  // Find function in ABI by selector

canonicalize(abi): CanonicalAbi
  // Normalize ABI format

validate(abi): void
  // Validate ABI structure
```

## Reference
Study ethers.js or viem ABI encoding implementations.

## Files
`src/primitives/Abi/` namespace

## Verification
```bash
bun run test -- Abi
```
