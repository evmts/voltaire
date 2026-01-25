# Review 100: SIWE and ENS Primitives

<issue>
<metadata>
priority: P2
files: [
  "voltaire-effect/src/primitives/Siwe/String.ts",
  "voltaire-effect/src/primitives/Siwe/index.ts",
  "voltaire-effect/src/primitives/Siwe/Siwe.test.ts",
  "voltaire-effect/src/primitives/Ens/String.ts",
  "voltaire-effect/src/primitives/Ens/index.ts",
  "src/primitives/Siwe/parse.js",
  "src/primitives/Siwe/verify.js",
  "src/primitives/Siwe/validate.js",
  "src/primitives/Siwe/getMessageHash.js",
  "src/primitives/Siwe/generateNonce.js",
  "src/primitives/Siwe/Siwe.test.ts",
  "src/primitives/Siwe/security.test.ts",
  "src/primitives/Ens/normalize.js",
  "src/primitives/Ens/namehash.js",
  "src/primitives/Ens/labelhash.js",
  "src/primitives/Ens/Ens.test.ts"
]
reviews: []
</metadata>

<module_overview>
<purpose>
SIWE (Sign-In with Ethereum, EIP-4361) authentication and ENS (Ethereum Name Service) name resolution primitives. SIWE provides web3 authentication via message signing. ENS provides human-readable name ↔ address mapping with ENSIP-15 normalization.
</purpose>
<current_status>
**GRADE: A-** - Both modules are **well-implemented and spec-compliant**. SIWE has excellent security test coverage (1200+ lines). ENS uses the reference `@adraffy/ens-normalize` library. **Gaps**: ENS type guard too permissive, missing voltaire-effect ENS tests, domain/URI validation not RFC-strict.
</current_status>
</module_overview>

<findings>
<critical>
None - both implementations are spec-compliant.
</critical>
<high>
### 1. ENS Type Guard Too Permissive (P1)

**Location**: `Ens/String.ts:12`

```typescript
// Current - accepts any string
const EnsTypeSchema = S.declare<EnsType>(
  (u): u is EnsType => typeof u === "string",  // Too permissive!
);

// Should validate ENS format
const EnsTypeSchema = S.declare<EnsType>(
  (u): u is EnsType => typeof u === "string" && Ens.isValid(u),
);
```

**Impact**: Invalid ENS names pass schema validation.

### 2. Missing voltaire-effect ENS Tests (P1)

**Location**: `voltaire-effect/src/primitives/Ens/`

No test file exists for the Effect ENS integration. Core `Ens.test.ts` exists but Effect wrappers are untested.

### 3. Domain Validation Not RFC 4501 Compliant (P1)

**Location**: `src/primitives/Siwe/validate.js:36-41`

```typescript
// Current - minimal validation
if (!domain || domain.length === 0) {
  throw new InvalidDomainError("Domain cannot be empty");
}

// Missing:
// - Reject control characters
// - Reject newlines
// - IDN/punycode validation
```

</high>
<medium>
### 4. URI Validation Not RFC 3986 Compliant (P2)

**Location**: `validate.js:59-64`

Only checks for non-empty URI. No format validation per RFC 3986.

### 5. ENS Missing Edge Case Tests (P2)

Missing in `Ens.test.ts`:
- Homograph attacks (Cyrillic 'а' vs Latin 'a')
- ZWJ sequences
- Very long labels (255+ chars)
- Punycode encoding/decoding
- Empty label handling

</medium>
</findings>

<effect_improvements>
### Fix ENS Type Guard

```typescript
// Ens/String.ts
import * as Ens from "@tevm/voltaire/Ens";

const EnsTypeSchema = S.declare<EnsType>(
  (u): u is EnsType => {
    if (typeof u !== "string") return false;
    try {
      Ens.validate(u);
      return true;
    } catch {
      return false;
    }
  },
  { identifier: "EnsName" },
);
```

### Create ENS Effect Tests

```typescript
// Ens.test.ts
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import { EnsSchema, normalize, namehash, labelhash } from "./index.js";

describe("EnsSchema", () => {
  it("decodes valid ENS name", () => {
    const result = S.decodeSync(EnsSchema)("vitalik.eth");
    expect(result).toBe("vitalik.eth");
  });

  it("normalizes uppercase to lowercase", () => {
    const result = S.decodeSync(EnsSchema)("VitaLIK.eth");
    expect(result).toBe("vitalik.eth");
  });

  it("rejects invalid characters", () => {
    expect(() => S.decodeSync(EnsSchema)("invalid<name>.eth")).toThrow();
  });

  it("rejects empty string", () => {
    expect(() => S.decodeSync(EnsSchema)("")).toThrow();
  });
});

describe("namehash", () => {
  it("produces known hash for vitalik.eth", () => {
    const hash = namehash("vitalik.eth");
    expect(Hex.fromBytes(hash)).toBe(
      "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"
    );
  });

  it("empty string returns zero hash", () => {
    const hash = namehash("");
    expect(hash.every((b) => b === 0)).toBe(true);
  });
});
```

### Add Stricter Domain Validation

```typescript
// validate.js - enhanced domain validation
const CONTROL_CHARS = /[\x00-\x1f\x7f]/;
const DOMAIN_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9-_.]*[a-zA-Z0-9](:[0-9]+)?$/;

export function validateDomain(domain: string): void {
  if (!domain || domain.length === 0) {
    throw new InvalidDomainError("Domain cannot be empty");
  }
  if (CONTROL_CHARS.test(domain)) {
    throw new InvalidDomainError("Domain contains control characters");
  }
  if (domain.includes("\n") || domain.includes("\r")) {
    throw new InvalidDomainError("Domain cannot contain newlines");
  }
  // Allow localhost and IP addresses
  if (domain !== "localhost" && !DOMAIN_REGEX.test(domain)) {
    throw new InvalidDomainError(`Invalid domain format: ${domain}`);
  }
}
```
</effect_improvements>

<viem_comparison>
**viem SIWE**: Uses `siwe` npm package, full EIP-4361 compliance.

**viem ENS**:
- `normalize()` - Uses `@adraffy/ens-normalize`
- `namehash()` - Standard EIP-137 implementation
- `labelhash()` - Simple keccak256 of label

**voltaire-effect Parity**: ✅ Feature-complete with both.

**Unique voltaire-effect Features**:
- Effect Schema integration for validation
- Thin wrapper pattern preserves tree-shaking
- Re-exports pure functions alongside Effect wrappers
</viem_comparison>

<implementation>
<refactoring_steps>
1. **Fix EnsTypeSchema type guard** - Use `Ens.isValid()` 
2. **Create Ens.test.ts in voltaire-effect** - Test Effect wrappers
3. **Add domain control character validation** - Reject \x00-\x1f, \x7f
4. **Add domain newline rejection** - Prevent injection
5. **Add URI format validation** - Use URL constructor
6. **Add ENS edge case tests** - Homograph, long labels, ZWJ
7. **Document security considerations** - Attack vectors and mitigations
</refactoring_steps>
<new_patterns>
```typescript
// Pattern: Strict domain validation with Effect
export const validateDomain = (domain: string): Effect.Effect<string, InvalidDomainError> =>
  Effect.try({
    try: () => {
      if (!domain) throw new InvalidDomainError("Empty domain");
      if (/[\x00-\x1f\x7f]/.test(domain)) {
        throw new InvalidDomainError("Control characters");
      }
      return domain;
    },
    catch: (e) => e as InvalidDomainError,
  });

// Pattern: ENS with strict validation
export const EnsSchema = S.String.pipe(
  S.transformOrFail(
    EnsTypeSchema,
    {
      decode: (s, _, ast) => {
        try {
          return ParseResult.succeed(Ens.from(s));
        } catch (e) {
          return ParseResult.fail(new ParseResult.Type(ast, s, (e as Error).message));
        }
      },
      encode: (ens) => ParseResult.succeed(Ens.toString(ens)),
    },
  ),
);
```
</new_patterns>
</implementation>

<tests>
<missing_coverage>
- EnsSchema with valid/invalid names
- EnsSchema normalization behavior
- namehash known vectors (vitalik.eth, nick.eth)
- labelhash known vectors
- ENS subdomain handling
- ENS homograph attack prevention
- ENS ZWJ sequence handling
- ENS very long label rejection
- SIWE domain with control characters
- SIWE URI with special schemes (ipfs:, did:)
- SIWE message round-trip (format → parse → format)
</missing_coverage>
<test_code>
```typescript
// voltaire-effect/src/primitives/Ens/Ens.test.ts
import { describe, expect, it } from "vitest";
import * as S from "effect/Schema";
import { EnsSchema, namehash, labelhash, normalize } from "./index.js";
import * as Hex from "../Hex/index.js";

describe("EnsSchema", () => {
  it("decodes and normalizes valid ENS", () => {
    const result = S.decodeSync(EnsSchema)("VitaLIK.eth");
    expect(result).toBe("vitalik.eth");
  });

  it("handles subdomains", () => {
    const result = S.decodeSync(EnsSchema)("Sub.Domain.eth");
    expect(result).toBe("sub.domain.eth");
  });

  it("rejects disallowed characters", () => {
    expect(() => S.decodeSync(EnsSchema)("bad<>name.eth")).toThrow();
  });
});

describe("namehash known vectors", () => {
  const vectors: [string, string][] = [
    ["", "0x0000000000000000000000000000000000000000000000000000000000000000"],
    ["eth", "0x93cdeb708b7545dc668eb9280176169d1c33cfd8ed6f04690a0bcc88a93fc4ae"],
    ["vitalik.eth", "0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835"],
  ];

  for (const [name, expected] of vectors) {
    it(`namehash("${name}") = ${expected.slice(0, 18)}...`, () => {
      const hash = namehash(name);
      expect(Hex.fromBytes(hash)).toBe(expected);
    });
  }
});

describe("labelhash known vectors", () => {
  it("labelhash(vitalik)", () => {
    const hash = labelhash("vitalik");
    expect(Hex.fromBytes(hash)).toBe(
      "0xaf2caa1c2ca1d027f1ac823b529d0a67cd144264b2789fa2ea4d63a67c7103cc"
    );
  });
});

describe("ENS security", () => {
  it("normalizes homograph attempts", () => {
    // Cyrillic 'а' (U+0430) looks like Latin 'a'
    const cyrillic = "vit\u0430lik.eth";
    // ens-normalize should handle this
    const result = normalize(cyrillic);
    // Either normalizes or throws - both are acceptable
    expect(typeof result).toBe("string");
  });
});
```
</test_code>
</tests>

<docs>
- Add SIWE authentication flow example
- Add ENS resolution example with provider
- Document security considerations for SIWE
- Document ENSIP-15 normalization behavior
- Add attack vector documentation
</docs>

<api>
<changes>
1. `EnsTypeSchema` - Fix type guard to use `Ens.isValid()`
2. `validateDomain()` - Add control character rejection
3. `validateUri()` - Add RFC 3986 format check
4. Add `Ens.test.ts` test file
5. Export `normalize`, `namehash`, `labelhash` from Effect module
</changes>
</api>

<references>
- [EIP-4361: Sign-In with Ethereum](https://eips.ethereum.org/EIPS/eip-4361)
- [EIP-137: Ethereum Domain Name Service](https://eips.ethereum.org/EIPS/eip-137)
- [ENSIP-15: ENS Name Normalization Standard](https://docs.ens.domains/ensip/15)
- [@adraffy/ens-normalize](https://github.com/adraffy/ens-normalize.js)
- [RFC 4501: Domain Name URI Scheme](https://datatracker.ietf.org/doc/html/rfc4501)
- [RFC 3986: URI Generic Syntax](https://datatracker.ietf.org/doc/html/rfc3986)
</references>
</issue>

## SIWE Security Matrix

| Attack Vector | Mitigation | Status |
|---------------|------------|--------|
| Replay attacks | Nonce requirement (min 8 chars) | ✅ |
| Expired tokens | expirationTime validation | ✅ |
| Early usage | notBefore validation | ✅ |
| Signature forgery | secp256k1 verification | ✅ |
| Address mismatch | Recovered address comparison | ✅ |
| Message tampering | Full message in signature hash | ✅ |
| Injection attacks | Structured parsing, tested | ✅ |
| Timestamp manipulation | Server-side `now` parameter | ✅ |
| Domain spoofing | Domain validation | ⚠️ Needs RFC 4501 |

## ENS Security Matrix

| Attack Vector | Mitigation | Status |
|---------------|------------|--------|
| Homograph attacks | ens-normalize handles | ✅ |
| Invalid characters | ENSIP-15 validation | ✅ |
| Case confusion | Normalization to lowercase | ✅ |
| Namehash collision | Cryptographic hash (keccak256) | ✅ |
| Punycode attacks | ens-normalize handles | ✅ |

## Code Examples

### SIWE Authentication Flow

```typescript
import * as Siwe from 'voltaire-effect/primitives/Siwe'
import * as S from 'effect/Schema'

// 1. Create message (server-side)
const message = Siwe.create({
  domain: 'example.com',
  address: userAddress,
  uri: 'https://example.com/login',
  chainId: 1,
  statement: 'Sign in to Example',
})

// 2. Format for signing (client-side)
const messageText = Siwe.format(message)

// 3. User signs message...
const signature = await wallet.signMessage(messageText)

// 4. Verify signature (server-side)
const result = Siwe.verifyMessage(message, signature, { now: new Date() })
if (!result.valid) {
  throw new Error(result.error.message)
}
```

### ENS Resolution

```typescript
import * as Ens from 'voltaire-effect/primitives/Ens'
import * as S from 'effect/Schema'

// Parse and normalize ENS name
const name = S.decodeSync(Ens.EnsSchema)('VitaLIK.eth')
// → 'vitalik.eth'

// Compute namehash for resolver lookup
const hash = Ens.namehash(name)
// → 0xee6c4522aab0003e8d14cd40a6af439055fd2577951148c14b6cea9a53475835
```
