# Review: Add simulateContract Action

## Priority: 🔴 CRITICAL

## Summary

Add `simulateContract` to simulate write functions before sending, returning both the result and a prepared transaction request.

## Current State

The Contract factory has `simulate` but:
1. Only returns the result, not a prepared request
2. Doesn't support account simulation
3. No state overrides

## Implementation

```typescript
// src/services/Provider/actions/simulateContract.ts
export interface SimulateContractParams<
  TAbi extends Abi,
  TFunctionName extends string
> {
  address: AddressInput;
  abi: TAbi;
  functionName: TFunctionName;
  args?: readonly unknown[];
  account?: AddressInput;
  value?: bigint;
  gas?: bigint;
  gasPrice?: bigint;
  maxFeePerGas?: bigint;
  maxPriorityFeePerGas?: bigint;
  blockTag?: BlockTag;
  stateOverride?: StateOverride[];
}

export interface SimulateContractResult<
  TAbi extends Abi,
  TFunctionName extends string
> {
  result: ContractFunctionReturnType<TAbi, TFunctionName>;
  request: {
    address: AddressType;
    abi: TAbi;
    functionName: TFunctionName;
    args: readonly unknown[];
    to: AddressType;
    data: HexType;
    value?: bigint;
    gas?: bigint;
  };
}

export const simulateContract = <
  TAbi extends Abi,
  TFunctionName extends string
>(
  params: SimulateContractParams<TAbi, TFunctionName>
): Effect.Effect<
  SimulateContractResult<TAbi, TFunctionName>,
  ProviderError,
  ProviderService
> =>
  Effect.gen(function* () {
    const provider = yield* ProviderService;
    
    const data = BrandedAbi.encodeFunction(
      params.abi,
      params.functionName,
      params.args ?? []
    );
    
    // Build call request
    const callRequest: CallRequest = {
      to: params.address,
      from: params.account,
      data,
      value: params.value,
      gas: params.gas
    };
    
    // Execute simulation
    const rawResult = yield* provider.call(callRequest, params.blockTag);
    
    // Decode result
    const result = BrandedAbi.decodeFunction(
      params.abi,
      params.functionName,
      rawResult
    );
    
    return {
      result,
      request: {
        address: params.address,
        abi: params.abi,
        functionName: params.functionName,
        args: params.args ?? [],
        to: params.address,
        data,
        value: params.value,
        gas: params.gas
      }
    };
  });
```

## Usage Pattern

```typescript
const { result, request } = yield* simulateContract({
  address: tokenAddress,
  abi: erc20Abi,
  functionName: 'transfer',
  args: [recipient, amount],
  account: senderAddress
});

// Check result
if (result === false) {
  throw new Error('Transfer would fail');
}

// Send the transaction
const hash = yield* signer.sendTransaction({
  to: request.to,
  data: request.data,
  value: request.value
});
```

## State Overrides

Support eth_call state overrides for testing:
```typescript
stateOverride: [
  {
    address: '0x...',
    balance: parseEther('100'),
    nonce: 5n,
    code: '0x...',
    stateDiff: { [slot]: value }
  }
]
```
