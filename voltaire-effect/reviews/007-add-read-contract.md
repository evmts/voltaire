# Review: Add readContract Action

## Priority: 🔴 CRITICAL

## Summary

Add `readContract` as a standalone action for type-safe contract reads without creating a Contract instance.

## Current State

Currently must use Contract factory:
```typescript
const contract = yield* Contract(address, abi);
const balance = yield* contract.read.balanceOf(account);
```

Viem allows standalone calls:
```typescript
const balance = await publicClient.readContract({
  address,
  abi,
  functionName: 'balanceOf',
  args: [account]
});
```

## Implementation

### 1. Create standalone action

```typescript
// src/services/Provider/actions/readContract.ts
import { Abi, BrandedAbi } from '@tevm/voltaire';
import * as Effect from 'effect/Effect';
import { ProviderService, ProviderError } from '../ProviderService.js';

export interface ReadContractParams<
  TAbi extends Abi,
  TFunctionName extends string
> {
  address: AddressInput;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  blockTag?: BlockTag;
}

export const readContract = <
  TAbi extends Abi,
  TFunctionName extends string
>(
  params: ReadContractParams<TAbi, TFunctionName>
): Effect.Effect<
  ContractFunctionReturnType<TAbi, TFunctionName>,
  ProviderError,
  ProviderService
> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    
    // Encode function call
    const data = BrandedAbi.encodeFunction(
      params.abi,
      params.functionName,
      params.args ?? []
    );
    
    // Execute call
    const result = yield* provider.call(
      { to: params.address, data },
      params.blockTag
    );
    
    // Decode result
    return BrandedAbi.decodeFunction(
      params.abi,
      params.functionName,
      result
    );
  });
```

### 2. Add to ProviderShape

```typescript
export type ProviderShape = {
  // ... existing methods
  
  readonly readContract: <TAbi extends Abi, TFunctionName extends string>(
    params: ReadContractParams<TAbi, TFunctionName>
  ) => Effect.Effect<ContractFunctionReturnType<TAbi, TFunctionName>, ProviderError>;
};
```

### 3. Export from index

```typescript
export { readContract } from './actions/readContract.js';
```

## Type Safety

Leverage voltaire's ABI types for full inference:
- Function name autocomplete
- Argument type checking
- Return type inference

## Testing

- Test with ERC-20 balanceOf
- Test with multi-return functions
- Test with no args
- Test with complex args (arrays, tuples)
- Test error decoding
