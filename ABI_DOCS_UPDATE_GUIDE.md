# ABI Documentation Update Guide

## Overview

All ABI documentation needs to be updated from object-oriented constructor pattern to data-first namespace pattern.

## Files Requiring Updates

**Total:** 60 MDX files in `/Users/williamcory/voltaire/docs/primitives/abi/`

**Categories:**
- Function methods: 7 files (function/*.mdx)
- Event methods: 4 files (event/*.mdx)
- Error methods: 4 files (error/*.mdx)
- Constructor methods: 2 files (constructor/*.mdx)
- Parameter methods: 2 files (parameter/*.mdx)
- Top-level files: ~41 files (*.mdx)

## Required Pattern Changes

### 1. Import Statements

**BEFORE:**
```typescript
import { Function } from '@tevm/voltaire'
import { Event } from '@tevm/voltaire'
import { AbiError } from '@tevm/voltaire'
import { Constructor } from '@tevm/voltaire'
import { Keccak256 } from '@tevm/voltaire'
```

**AFTER:**
```typescript
import * as Abi from '@tevm/voltaire/Abi'
import * as Keccak256 from '@tevm/voltaire/Keccak256'
```

### 2. Object Construction

**BEFORE:**
```typescript
const transferFn = new Function({
  type: "function",
  name: "transfer",
  inputs: [
    { type: "address", name: "to" },
    { type: "uint256", name: "amount" }
  ],
  outputs: [{ type: "bool" }]
})
```

**AFTER:**
```typescript
const transferFn = {
  type: "function",
  name: "transfer",
  inputs: [
    { type: "address", name: "to" },
    { type: "uint256", name: "amount" }
  ],
  outputs: [{ type: "bool" }]
} as const
```

**Key changes:**
- Remove `new Function(`
- Remove closing `)`
- Add `} as const` at the end

### 3. Method Calls - Functions

**BEFORE:**
```typescript
const selector = transferFn.getSelector()
const signature = transferFn.getSignature()
const calldata = transferFn.encodeParams([...])
const params = transferFn.decodeParams(data)
const result = transferFn.encodeResult([...])
const decoded = transferFn.decodeResult(data)
```

**AFTER:**
```typescript
const selector = Abi.Function.getSelector(transferFn)
const signature = Abi.Function.getSignature(transferFn)
const calldata = Abi.Function.encodeParams(transferFn, [...])
const params = Abi.Function.decodeParams(transferFn, data)
const result = Abi.Function.encodeResult(transferFn, [...])
const decoded = Abi.Function.decodeResult(transferFn, data)
```

### 4. Method Calls - Events

**BEFORE:**
```typescript
const transferEvent = new Event({
  type: "event",
  name: "Transfer",
  inputs: [...]
})

const selector = transferEvent.getSelector()
const signature = transferEvent.getSignature()
const topics = transferEvent.encodeTopics([...])
const decoded = transferEvent.decodeLog(log)
```

**AFTER:**
```typescript
const transferEvent = {
  type: "event",
  name: "Transfer",
  inputs: [...]
} as const

const selector = Abi.Event.getSelector(transferEvent)
const signature = Abi.Event.getSignature(transferEvent)
const topics = Abi.Event.encodeTopics(transferEvent, [...])
const decoded = Abi.Event.decodeLog(transferEvent, log)
```

### 5. Method Calls - Errors

**BEFORE:**
```typescript
const insufficientBalance = new AbiError({
  type: "error",
  name: "InsufficientBalance",
  inputs: [...]
})

const selector = insufficientBalance.getSelector()
const signature = insufficientBalance.getSignature()
const encoded = insufficientBalance.encodeParams([...])
const decoded = insufficientBalance.decodeParams(data)
```

**AFTER:**
```typescript
const insufficientBalance = {
  type: "error",
  name: "InsufficientBalance",
  inputs: [...]
} as const

const selector = Abi.Error.getSelector(insufficientBalance)
const signature = Abi.Error.getSignature(insufficientBalance)
const encoded = Abi.Error.encodeParams(insufficientBalance, [...])
const decoded = Abi.Error.decodeParams(insufficientBalance, data)
```

### 6. Method Calls - Constructors

**BEFORE:**
```typescript
const constructorDef = new Constructor({
  type: "constructor",
  inputs: [...]
})

const encoded = constructorDef.encodeParams([...])
const decoded = constructorDef.decodeParams(data)
```

**AFTER:**
```typescript
const constructorDef = {
  type: "constructor",
  inputs: [...]
} as const

const encoded = Abi.Constructor.encodeParams(constructorDef, [...])
const decoded = Abi.Constructor.decodeParams(constructorDef, data)
```

### 7. Keccak256 Usage

**BEFORE:**
```typescript
import { Keccak256 } from '@tevm/voltaire'

const hash = Keccak256.hash(signature)
```

**AFTER:**
```typescript
import * as Keccak256 from '@tevm/voltaire/Keccak256'

const hash = Keccak256.hash(signature)
```

(No change to actual usage, just import style)

## Complete Example Transformation

### BEFORE (function/get-selector.mdx excerpt):

```typescript
import { Function } from '@tevm/voltaire'

const balanceOfFn = new Function({
  type: "function",
  name: "balanceOf",
  inputs: [{ type: "address", name: "owner" }],
  outputs: [{ type: "uint256" }]
})

const selector = balanceOfFn.getSelector()
console.log(selector)  // "0x70a08231"

// Check if selector matches
if (calldataSelector === transferFn.getSelector()) {
  console.log("Transfer function called")
}
```

### AFTER (function/get-selector.mdx excerpt):

```typescript
import * as Abi from '@tevm/voltaire/Abi'

const balanceOfFn = {
  type: "function",
  name: "balanceOf",
  inputs: [{ type: "address", name: "owner" }],
  outputs: [{ type: "uint256" }]
} as const

const selector = Abi.Function.getSelector(balanceOfFn)
console.log(selector)  // "0x70a08231"

// Check if selector matches
if (calldataSelector === Abi.Function.getSelector(transferFn)) {
  console.log("Transfer function called")
}
```

## Implementation Strategy

### Option 1: Manual Updates (Recommended for Accuracy)

1. Start with function/*.mdx files (7 files)
2. Then event/*.mdx files (4 files)
3. Then error/*.mdx files (4 files)
4. Then constructor/*.mdx files (2 files)
5. Finally top-level files (~41 files)

### Option 2: Script-Assisted (Faster but Requires Review)

Use the provided `/Users/williamcory/voltaire/update-abi-docs.sh` script:

```bash
chmod +x update-abi-docs.sh
./update-abi-docs.sh
```

**Note:** This script handles:
- ✅ Import statement updates
- ✅ Constructor removal (new Function -> {)
- ✅ Adding "as const"
- ❌ Method call transformations (requires manual work)

After running the script, manually update all method calls following patterns above.

### Option 3: Hybrid Approach (Best Balance)

1. Run the script for mechanical changes (imports, constructors)
2. Use find/replace in editor for common patterns:
   - Find: `(\w+Fn)\.getSelector\(\)`
   - Replace: `Abi.Function.getSelector($1)`
   - Find: `(\w+Event)\.getSelector\(\)`
   - Replace: `Abi.Event.getSelector($1)`
   - Etc.
3. Manually review and fix edge cases

## Testing After Updates

1. Check that all examples compile (TypeScript)
2. Verify no broken references (method calls on undefined)
3. Ensure "as const" is present for type inference
4. Verify imports are correct

## Files Status

### Completed ✅
- (None yet - task in progress)

### In Progress 🔄
- All 60 files pending update

### Not Started ⏳
- All 60 files

## Summary

**Total changes required:** ~200-300 individual edits across 60 files

**Time estimate:**
- Manual: 3-4 hours
- Script + manual review: 1-2 hours
- Hybrid: 1.5-2.5 hours

**Priority files to update first:**
1. /docs/primitives/abi/index.mdx (main entry point)
2. /docs/primitives/abi/function/*.mdx (most commonly used)
3. /docs/primitives/abi/event/*.mdx (second most common)
4. /docs/primitives/abi/fundamentals.mdx (learning resource)
5. All other files

## Next Steps

1. Decide on implementation approach
2. Execute updates systematically
3. Review and test all changes
4. Commit with descriptive message
5. Update any related documentation (README, migration guides, etc.)
