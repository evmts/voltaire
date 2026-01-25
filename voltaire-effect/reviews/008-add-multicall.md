# Review: Add Multicall Support

## Priority: 🔴 CRITICAL

## Summary

Implement `multicall` to batch multiple contract reads into a single RPC call, reducing network overhead by 10-100x.

## Implementation Options

### Option 1: Multicall3 Contract (Preferred)

Use the deployless Multicall3 at `0xcA11bde05977b3631167028862bE2a173976CA11`.

```typescript
// src/services/Provider/actions/multicall.ts
export interface MulticallParams<TContracts extends readonly ContractCall[]> {
  contracts: TContracts;
  allowFailure?: boolean;
  blockTag?: BlockTag;
  batchSize?: number;
}

export interface ContractCall {
  address: AddressInput;
  abi: Abi;
  functionName: string;
  args?: readonly unknown[];
}

const MULTICALL3_ADDRESS = '0xcA11bde05977b3631167028862bE2a173976CA11';
const MULTICALL3_ABI = [
  {
    name: 'aggregate3',
    type: 'function',
    inputs: [{ name: 'calls', type: 'tuple[]', components: [...] }],
    outputs: [{ name: 'results', type: 'tuple[]', components: [...] }]
  }
] as const;

export const multicall = <TContracts extends readonly ContractCall[]>(
  params: MulticallParams<TContracts>
): Effect.Effect<MulticallResults<TContracts>, ProviderError, ProviderService> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    
    // Encode each call
    const calls = params.contracts.map(contract => ({
      target: contract.address,
      allowFailure: params.allowFailure ?? true,
      callData: BrandedAbi.encodeFunction(
        contract.abi,
        contract.functionName,
        contract.args ?? []
      )
    }));
    
    // Execute multicall
    const data = BrandedAbi.encodeFunction(
      MULTICALL3_ABI,
      'aggregate3',
      [calls]
    );
    
    const result = yield* provider.call(
      { to: MULTICALL3_ADDRESS, data },
      params.blockTag
    );
    
    // Decode results
    const decoded = BrandedAbi.decodeFunction(
      MULTICALL3_ABI,
      'aggregate3',
      result
    );
    
    // Decode individual results
    return params.contracts.map((contract, i) => {
      const { success, returnData } = decoded[i];
      if (!success && !params.allowFailure) {
        throw new Error(`Call ${i} failed`);
      }
      return success
        ? BrandedAbi.decodeFunction(contract.abi, contract.functionName, returnData)
        : null;
    });
  });
```

### Option 2: Effect Request Batching

Use Effect's DataLoader pattern for automatic batching:

```typescript
import * as Request from 'effect/Request';
import * as RequestResolver from 'effect/RequestResolver';

// Define request type
interface ReadContractRequest extends Request.Request<unknown, ProviderError> {
  readonly _tag: 'ReadContractRequest';
  readonly address: string;
  readonly data: string;
}

// Create batched resolver
const ReadContractResolver = RequestResolver.makeBatched(
  (requests: ReadContractRequest[]) =>
    Effect.gen(function* () {
      const multicallResult = yield* multicall({
        contracts: requests.map(r => ({ ... }))
      });
      // Complete each request with its result
    })
);
```

## Benefits

- 10-100x fewer RPC calls
- Consistent block view across all reads
- Works with any Multicall3-deployed chain

## Testing

- Test basic multicall
- Test allowFailure modes
- Test batch size chunking
- Test type inference
