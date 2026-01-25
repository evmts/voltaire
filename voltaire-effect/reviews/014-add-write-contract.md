# Review: Add writeContract Action

## Priority: 🟠 IMPORTANT

## Summary

Add `writeContract` as a standalone action for type-safe contract writes with ABI encoding.

## Current State

Must use Contract factory:
```typescript
const contract = yield* Contract(address, abi);
const hash = yield* contract.write.transfer(recipient, amount);
```

## Implementation

```typescript
// src/services/Signer/actions/writeContract.ts
export interface WriteContractParams<
  TAbi extends Abi,
  TFunctionName extends string
> {
  address: AddressInput;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  nonce?: bigint;
}

export const writeContract = <
  TAbi extends Abi,
  TFunctionName extends string
>(
  params: WriteContractParams<TAbi, TFunctionName>
): Effect.Effect<HashType, SignerError, SignerService> =>
  Effect.gen(function* () {
    const signer = yield* SignerService;
    
    // Encode function call
    const data = BrandedAbi.encodeFunction(
      params.abi,
      params.functionName,
      params.args ?? []
    );
    
    // Send transaction
    return yield* signer.sendTransaction({
      to: Address.fromHex(params.address),
      data,
      value: params.value,
      gas: params.gas,
      gasPrice: params.gasPrice,
      maxFeePerGas: params.maxFeePerGas,
      maxPriorityFeePerGas: params.maxPriorityFeePerGas,
      nonce: params.nonce
    });
  });
```

## Add to SignerShape

```typescript
export type SignerShape = {
  // ... existing
  
  readonly writeContract: <TAbi extends Abi, TFunctionName extends string>(
    params: WriteContractParams<TAbi, TFunctionName>
  ) => Effect.Effect<HashType, SignerError>;
};
```

## Usage

```typescript
const hash = yield* signer.writeContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'transfer',
  args: [recipient, parseUnits('100', 18)],
  maxFeePerGas: parseGwei('20')
});
```

## Testing

- Test basic write
- Test with value
- Test with custom gas params
- Test ABI encoding for various arg types
