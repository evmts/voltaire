# Fix JSON-RPC Eth.ts Unused Import

<issue>
<metadata>priority: P3, files: [voltaire-effect/src/jsonrpc/Eth.ts], reviews: [081-jsonrpc-review.md]</metadata>

<problem>
`Eth.ts` imports `eth` from `@tevm/voltaire/jsonrpc` on line 1 but never uses it. The module defines its own `makeRequest` helper and constructs all requests locally.

```typescript
// Line 1 - unused import
import { eth } from "@tevm/voltaire/jsonrpc";
```

This causes:
- Dead code in the bundle
- Increased bundle size
- Confusion for readers about whether eth module should be used
- Lint warnings (unused imports)
</problem>

<solution>
Remove the unused `eth` import. The module is self-contained with its own `makeRequest` helper function.
</solution>

<implementation>
<steps>
1. Remove line 1: `import { eth } from "@tevm/voltaire/jsonrpc";`
2. Verify no runtime breakage
3. Run tests to confirm

```typescript
// voltaire-effect/src/jsonrpc/Eth.ts

// REMOVE this line:
// import { eth } from "@tevm/voltaire/jsonrpc";

import type { JsonRpcRequestType } from "./Request.js";

let idCounter = 1000;

function makeRequest(
  method: string,
  params: unknown[] = [],
): JsonRpcRequestType {
  return {
    jsonrpc: "2.0",
    method,
    params,
    id: ++idCounter,
  };
}

// ... rest of file unchanged
```
</steps>
<new_exports>None (removal only)</new_exports>
</implementation>

<tests>
<test_cases>
```typescript
// voltaire-effect/src/jsonrpc/JsonRpc.test.ts

import { describe, it, expect } from "vitest";
import * as Eth from "./Eth.js";

describe("Eth module (after unused import removal)", () => {
  it("AccountsRequest creates valid request", () => {
    const req = Eth.AccountsRequest();
    expect(req.jsonrpc).toBe("2.0");
    expect(req.method).toBe("eth_accounts");
    expect(req.id).toBeGreaterThan(0);
  });

  it("BlockNumberRequest creates valid request", () => {
    const req = Eth.BlockNumberRequest();
    expect(req.method).toBe("eth_blockNumber");
  });

  it("CallRequest includes params", () => {
    const tx = { to: "0x1234", data: "0x" };
    const req = Eth.CallRequest(tx, "pending");
    expect(req.params).toEqual([tx, "pending"]);
  });

  it("GetBalanceRequest defaults to latest", () => {
    const req = Eth.GetBalanceRequest("0x1234");
    expect(req.params).toEqual(["0x1234", "latest"]);
  });

  it("all request factories are still exported", () => {
    expect(Eth.Eth.AccountsRequest).toBeDefined();
    expect(Eth.Eth.BlockNumberRequest).toBeDefined();
    expect(Eth.Eth.ChainIdRequest).toBeDefined();
    expect(Eth.Eth.GetTransactionReceiptRequest).toBeDefined();
    expect(Eth.Eth.SendRawTransactionRequest).toBeDefined();
  });
});
```
</test_cases>
</tests>

<docs>
No documentation changes required - this is a code cleanup.
</docs>

<api>
<new_functions>None (removal only)</new_functions>
</api>

<references>
- ESLint no-unused-vars rule
- TypeScript strict mode unused import detection
</references>
</issue>
