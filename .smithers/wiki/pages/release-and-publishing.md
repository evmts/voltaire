---
title: "Release, Docs, and Playground Publishing"
tags: [release, npm, mintlify, playground, changesets, ci]
kind: current
owner: evmts
---

# Release, Docs, and Playground Publishing

Landing a Change on Smithers Cloud pushes `main` to GitHub (`evmts/voltaire`), automatically triggering the complete release and publishing pipeline.

## End-to-End Post-Merge Pipeline

```text
Smithers Cloud Land (person-approved Change)
  └──▶ Push to GitHub main (mirror: "push")
        ├──▶ Smithers Cloud CI (.smithers/flows/ci/flow.ts) + Lighthouse Audit Report
        ├──▶ GitHub Actions CI (.github/workflows/ci.yml) with shared build.smithers.sh cache
        │     └──▶ Release (.github/workflows/release.yml)
        │           ├──▶ Changesets version PR or `pnpm release` (scripts/publish-npm.mjs)
        │           └──▶ Builds WASM + TS -> verify-packaging --load -> npm publish --provenance
        ├──▶ Docs Publishing (voltaire.tevm.sh via Mintlify + docs-check workflow + docs-publish flow)
        ├──▶ Playground Deploy (playground.tevm.sh via .github/workflows/deploy-playground.yml)
        └──▶ Wiki & Feed Refresh (.smithers/flows/wiki-refresh/flow.ts -> smithers.sh feeds)
```

## Release Safety Gates

1. `scripts/publish-npm.mjs` refuses to publish unless `CI_VERIFIED_SHA` equals `HEAD` on `refs/heads/main`.
2. `scripts/verify-packaging.mjs --load` imports every exported subpath of `@tevm/voltaire` and `@tevm/zig` before publishing.
3. Publishing uses `--ignore-scripts` and `--provenance` so the exact verified artifacts ship unchanged.
4. Maintainer-initiated durable releases can also run through `.smithers/flows/release/flow.ts` with explicit human approval gates.

## Related Pages

- [[factory-and-mcp]]
- [[wasm-and-ffi]]
- [[backpressure-and-audits]]
- [[mythical-history]]
