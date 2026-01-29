---
"voltaire-effect": minor
---

Add ExecutionPlan-based provider fallback (experimental)

```typescript
import { Effect, Schedule } from 'effect'
import { makeProviderPlan, getBlockNumber } from 'voltaire-effect'

const plan = makeProviderPlan([
  {
    url: process.env.INFURA_URL!,
    attempts: 2,
    schedule: Schedule.spaced('1 second')
  },
  {
    url: process.env.ALCHEMY_URL!,
    attempts: 3,
    schedule: Schedule.exponential('500 millis')
  },
  { url: 'https://eth.llamarpc.com' }  // public fallback
])

const blockNumber = yield* getBlockNumber().pipe(Effect.withExecutionPlan(plan))
```

- `makeProviderPlan`: Declarative multi-provider retry/fallback
- `makeResilientProviderPlan`: Pre-configured with sensible defaults
- Requires Effect 3.16+ for ExecutionPlan

Commit: a4974a52a
