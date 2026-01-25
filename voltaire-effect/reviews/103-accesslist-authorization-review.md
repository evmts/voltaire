# Review 103: AccessList (EIP-2930) and Authorization (EIP-7702) Primitives

<issue>
<metadata>
priority: P1
files: [
  "voltaire-effect/src/primitives/AccessList/index.ts",
  "voltaire-effect/src/primitives/AccessList/Rpc.ts",
  "voltaire-effect/src/primitives/Authorization/index.ts",
  "voltaire-effect/src/primitives/Authorization/Rpc.ts",
  "src/primitives/AccessList/AccessList.js",
  "src/primitives/AccessList/AccessList.test.ts",
  "src/primitives/Authorization/Authorization.js",
  "src/primitives/Authorization/Authorization.test.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
EIP-2930 Access Lists for gas optimization and EIP-7702 Authorization tuples for account abstraction. AccessList specifies storage slots for reduced gas costs. Authorization enables externally-owned accounts (EOAs) to delegate to smart contract code.
</purpose>
<current_status>
**EIP COMPLIANT** for both standards. AccessList format `[{address, storageKeys}...]` and Authorization tuple `[chainId, address, nonce, yParity, r, s]` are correct. **Critical gap**: No tests exist in voltaire-effect for either module. **Issues**: hexToBytes lacks validation, yParity not constrained to 0/1, duplicate utility functions.
</current_status>
</module_overview>

<findings>
<critical>
### 1. No Test Coverage in voltaire-effect (P0)

**Location**: `voltaire-effect/src/primitives/AccessList/`, `Authorization/`

**NO TESTS EXIST** for the Effect Schema wrappers:

| Module | Base Tests | Effect Tests |
|--------|------------|--------------|
| AccessList | ✅ `AccessList.test.ts` | ❌ Missing |
| Authorization | ✅ `Authorization.test.ts` | ❌ Missing |

**Impact**: Schema validation, RPC parsing, and Effect error handling untested.

</critical>
<high>
### 2. hexToBytes Lacks Character Validation (P1)

**Location**: `AccessList/Rpc.ts:107-119`

```typescript
function hexToBytes(hex: string, expectedLength: number): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (cleanHex.length !== expectedLength * 2) {
    throw new Error(`Expected ${expectedLength} bytes...`);
  }
  // ❌ No validation that characters are valid hex!
  for (let i = 0; i < expectedLength; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);  // NaN on invalid
  }
}
```

`parseInt("zz", 16)` returns `NaN` which becomes `0` when stored in Uint8Array.

### 3. yParity Not Constrained (P1)

**Location**: `Authorization/Rpc.ts:74`

```typescript
// Current - accepts any number
yParity: S.Number,

// EIP-7702 requires 0 or 1
yParity: S.Union(S.Literal(0), S.Literal(1)),
```

### 4. Duplicate Utility Functions (P1)

**Location**: `AccessList/Rpc.ts`, `Authorization/Rpc.ts`

Both files define identical `hexToBytes` and `toHexString` functions. Should extract to shared module.

</high>
<medium>
### 5. No Address Checksum Validation (P2)

**Location**: `AccessList/Rpc.ts`, `Authorization/Rpc.ts`

EIP-55 checksummed addresses accepted but not validated:
```typescript
"0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"  // Valid checksum - OK
"0x742d35CC6634C0532925A3B844BC9E7595F251E3"  // Bad checksum - SHOULD warn
```

### 6. Imperative Decode Instead of Schema Composition (P2)

**Location**: `AccessList/Rpc.ts:77-80`

```typescript
// Current - try/catch with imperative parsing
decode: (input, _options, ast) => {
  try {
    const items: Item[] = input.map((item) => ({
      address: parseAddress(item.address),
      storageKeys: item.storageKeys.map(parseHash),
    }));
    return ParseResult.succeed(AccessList.from(items));
  } catch (e) {
    return ParseResult.fail(new ParseResult.Type(ast, input, (e as Error).message));
  }
}

// Better - compose with existing schemas
const AccessListItemSchema = S.Struct({
  address: Address.Hex,
  storageKeys: S.Array(Hash.Hex),
});
```

### 7. Missing EIP-7702 Delegation Indicator (P2)

**Location**: `Authorization/`

EIP-7702 defines `0xef0100 || address` delegation indicator format. No helper to create/detect this.

</medium>
</findings>

<effect_improvements>
### Add Hex Character Validation

```typescript
// shared/hexToBytes.ts
const HEX_REGEX = /^[0-9a-fA-F]+$/;

export function hexToBytes(hex: string, expectedLength: number): Uint8Array {
  const cleanHex = hex.startsWith("0x") ? hex.slice(2) : hex;
  
  if (cleanHex.length !== expectedLength * 2) {
    throw new Error(`Expected ${expectedLength} bytes, got ${cleanHex.length / 2}`);
  }
  
  if (!HEX_REGEX.test(cleanHex)) {
    throw new Error(`Invalid hex characters in: ${cleanHex}`);
  }
  
  const bytes = new Uint8Array(expectedLength);
  for (let i = 0; i < expectedLength; i++) {
    bytes[i] = parseInt(cleanHex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
```

### Constrain yParity

```typescript
// Authorization/Rpc.ts
const AuthorizationInputSchema = S.Struct({
  chainId: S.Union(S.String, S.Number, S.BigIntFromSelf),
  address: S.String,
  nonce: S.Union(S.String, S.Number, S.BigIntFromSelf),
  yParity: S.Union(S.Literal(0), S.Literal(1)),  // Constrained!
  r: S.String,
  s: S.String,
});
```

### Use Schema Composition for AccessList

```typescript
import * as Address from "../Address/index.js";
import * as Hash from "../Hash/index.js";

const AccessListItemSchema = S.Struct({
  address: Address.Hex,
  storageKeys: S.Array(Hash.Hex),
});

const AccessListRpcSchema = S.Array(AccessListItemSchema).pipe(
  S.transform(
    AccessListTypeSchema,
    {
      decode: (items) => AccessList.from(items),
      encode: (accessList) => accessList.map((item) => ({
        address: Address.toHex(item.address),
        storageKeys: item.storageKeys.map((k) => Hash.toHex(k)),
      })),
    },
  ),
);
```

### Add Delegation Indicator Helper

```typescript
// Authorization/delegation.ts
const DELEGATION_MAGIC = new Uint8Array([0xef, 0x01, 0x00]);

export const createDelegationIndicator = (address: AddressType): Uint8Array => {
  const result = new Uint8Array(23);  // 3 + 20
  result.set(DELEGATION_MAGIC, 0);
  result.set(address, 3);
  return result;
};

export const isDelegationIndicator = (code: Uint8Array): boolean => {
  if (code.length !== 23) return false;
  return code[0] === 0xef && code[1] === 0x01 && code[2] === 0x00;
};

export const extractDelegateAddress = (code: Uint8Array): AddressType | null => {
  if (!isDelegationIndicator(code)) return null;
  return code.slice(3) as AddressType;
};
```
</effect_improvements>

<viem_comparison>
**viem AccessList**:
- Types in `src/types/transaction.ts`
- `parseAccessList()` for validation
- Full RPC encoding/decoding

**viem Authorization (EIP-7702)**:
- `SignAuthorizationReturnType` with signature components
- `signAuthorization()` for signing
- `recoverAuthorizationAddress()` for recovery

**voltaire-effect Advantages**:
- Effect Schema validation with typed errors
- Clean RPC transform schemas
- Branded AccessList type

**voltaire-effect Gaps**:
- Missing test coverage
- No delegation indicator helpers
- yParity not constrained
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Create AccessList.test.ts** - Test RPC decode/encode, round-trips
2. **Create Authorization.test.ts** - Test tuple parsing, signature validation
3. **Add hex character validation** - Extract to shared utility
4. **Constrain yParity to 0|1** - Use S.Literal union
5. **Extract shared utilities** - hexToBytes, toHexString
6. **Use Schema composition** - Compose with Address.Hex, Hash.Hex
7. **Add delegation indicator helpers** - Create, detect, extract
8. **Add optional checksum validation** - Warn on bad checksums
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Schema composition for RPC types
const AccessListRpcSchema = S.Array(
  S.Struct({
    address: Address.Hex,
    storageKeys: S.Array(Hash.Hex),
  }),
).pipe(
  S.transform(AccessListTypeSchema, {
    decode: (items) => AccessList.from(items),
    encode: (al) => AccessList.toRpc(al),
  }),
);

// Pattern: Strict yParity validation
const YParitySchema = S.Union(S.Literal(0), S.Literal(1));

// Pattern: Authorization with validation
const AuthorizationSchema = S.Struct({
  chainId: ChainId.BigInt,
  address: Address.Bytes,
  nonce: S.BigIntFromSelf.pipe(S.filter((n) => n >= 0n)),
  yParity: YParitySchema,
  r: Hash.Bytes,
  s: Hash.Bytes.pipe(S.filter((s) => s <= SECP256K1_HALF_N, { message: () => "s too high" })),
});
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- AccessList.Rpc decode valid access list
- AccessList.Rpc encode back to RPC format
- AccessList.Rpc round-trip correctness
- AccessList.Rpc fails on invalid address length
- AccessList.Rpc fails on invalid storage key length
- AccessList.Rpc fails on missing 0x prefix
- AccessList.Rpc fails on invalid hex characters
- AccessList.Rpc handles empty access list
- AccessList.Rpc handles empty storageKeys array
- Authorization.Rpc decode valid authorization
- Authorization.Rpc encode back to RPC format
- Authorization.Rpc accepts chainId as string/number/bigint
- Authorization.Rpc accepts nonce as string/number/bigint
- Authorization.Rpc fails on invalid yParity (not 0 or 1)
- Authorization.Rpc accepts chainId 0 (cross-chain)
- Authorization signature s ≤ N/2 (malleability)
</missing_coverage>
<test_code>
```typescript
// AccessList.test.ts
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import { Rpc as AccessListRpc } from "./index.js";

describe("AccessList.Rpc", () => {
  const validInput = [
    {
      address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
      storageKeys: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001",
      ],
    },
  ];

  it("decodes valid access list", () => {
    const result = S.decodeSync(AccessListRpc)(validInput);
    expect(result.length).toBe(1);
    expect(result[0].address.length).toBe(20);
    expect(result[0].storageKeys.length).toBe(2);
  });

  it("encodes back to RPC format", () => {
    const decoded = S.decodeSync(AccessListRpc)(validInput);
    const encoded = S.encodeSync(AccessListRpc)(decoded);
    expect(encoded[0].address.toLowerCase()).toBe(validInput[0].address.toLowerCase());
  });

  it("round-trips correctly", () => {
    const decoded = S.decodeSync(AccessListRpc)(validInput);
    const encoded = S.encodeSync(AccessListRpc)(decoded);
    const redecoded = S.decodeSync(AccessListRpc)(encoded);
    expect(redecoded).toEqual(decoded);
  });

  it("handles empty access list", () => {
    const result = S.decodeSync(AccessListRpc)([]);
    expect(result.length).toBe(0);
  });

  it("handles empty storageKeys", () => {
    const input = [{ address: "0x" + "ab".repeat(20), storageKeys: [] }];
    const result = S.decodeSync(AccessListRpc)(input);
    expect(result[0].storageKeys.length).toBe(0);
  });

  it("fails on invalid address length", () => {
    const invalid = [{ address: "0x1234", storageKeys: [] }];
    expect(() => S.decodeSync(AccessListRpc)(invalid)).toThrow();
  });

  it("fails on invalid hex characters", () => {
    const invalid = [{ address: "0x" + "zz".repeat(20), storageKeys: [] }];
    expect(() => S.decodeSync(AccessListRpc)(invalid)).toThrow();
  });
});

// Authorization.test.ts
describe("Authorization.Rpc", () => {
  const validInput = {
    chainId: "0x1",
    address: "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3",
    nonce: "0x0",
    yParity: 0,
    r: "0x" + "ab".repeat(32),
    s: "0x" + "cd".repeat(32),
  };

  it("decodes valid authorization", () => {
    const result = S.decodeSync(AuthorizationRpc)(validInput);
    expect(result.chainId).toBe(1n);
    expect(result.address.length).toBe(20);
    expect(result.yParity).toBe(0);
  });

  it("accepts chainId as number", () => {
    const input = { ...validInput, chainId: 1 };
    const result = S.decodeSync(AuthorizationRpc)(input);
    expect(result.chainId).toBe(1n);
  });

  it("accepts chainId 0 for cross-chain", () => {
    const input = { ...validInput, chainId: 0 };
    const result = S.decodeSync(AuthorizationRpc)(input);
    expect(result.chainId).toBe(0n);
  });

  it("fails on invalid yParity", () => {
    const invalid = { ...validInput, yParity: 2 };
    expect(() => S.decodeSync(AuthorizationRpc)(invalid)).toThrow();
  });
});
```
</test_code>
</tests>

<docs>
- Document EIP-2930 access list gas savings
- Document EIP-7702 authorization flow
- Add delegation indicator usage example
- Document cross-chain authorization (chainId=0)
- Add security notes about s malleability
</docs>

<api>
<changes>
1. `yParity` - Constrain to `S.Union(S.Literal(0), S.Literal(1))`
2. `hexToBytes` - Extract to shared module with validation
3. `toHexString` - Extract to shared module
4. `createDelegationIndicator()` - New export
5. `isDelegationIndicator()` - New export
6. `extractDelegateAddress()` - New export
7. Add AccessList.test.ts
8. Add Authorization.test.ts
</changes>
</api>

<references>
- [EIP-2930: Optional access lists](https://eips.ethereum.org/EIPS/eip-2930)
- [EIP-7702: Set EOA account code](https://eips.ethereum.org/EIPS/eip-7702)
- [Effect Schema documentation](https://effect.website/docs/schema)
- [viem AccessList types](https://github.com/wevm/viem/blob/main/src/types/transaction.ts)
</references>
</issue>

## EIP Compliance Matrix

| EIP | Section | Status |
|-----|---------|--------|
| EIP-2930 | Access list format `[[addr, keys],...]` | ✅ |
| EIP-2930 | Address 20 bytes | ✅ |
| EIP-2930 | Storage key 32 bytes | ✅ |
| EIP-2930 | Gas costs (2400/1900) | ⚠️ Defined in base lib |
| EIP-7702 | Authorization tuple | ✅ |
| EIP-7702 | MAGIC = 0x05 | ✅ (in base lib) |
| EIP-7702 | chainId=0 for cross-chain | ✅ |
| EIP-7702 | yParity 0 or 1 | ❌ Not validated |
| EIP-7702 | s ≤ N/2 (malleability) | ✅ (via validate()) |
| EIP-7702 | Delegation indicator format | ❌ Not implemented |

## Access List Gas Savings

```
┌──────────────────────────────────────────────────────────┐
│ Without Access List:                                      │
│   Cold SLOAD:  2100 gas                                   │
│   Cold SSTORE: 2900 gas (first write)                     │
│                                                           │
│ With Access List:                                         │
│   Declared slot: 1900 gas SLOAD / 2600 gas SSTORE         │
│   Access list cost: 2400 per address + 1900 per key       │
│                                                           │
│ Break-even: Access list helps if you access declared      │
│ slots multiple times in the transaction.                  │
└──────────────────────────────────────────────────────────┘
```
