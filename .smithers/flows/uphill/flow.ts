import { Flow } from "@smthrs/flow"
import { Node } from "@smthrs/plan"
import { CiJob } from "@smthrs/sandbox"
import { Schema } from "effect"

// Continuous Lighthouse-style backpressure audit for evmts/voltaire.
// Runs Uphill across all 5 categories (Footprint, Zig & Rust Safety,
// TypeScript Quality, Architecture & Testing, Factory & Supply Chain), renders
// the self-contained Lighthouse HTML/JSON audit report, and uploads both
// artifacts to the Smithers Cloud shared R2 object store.

const uphillAudit = CiJob.make("uphill-audit", {
  steps: [
    {
      name: "install-uphill",
      run: "command -v uphill >/dev/null 2>&1 || curl -fsSL https://wevm.sh/uphill | sh"
    },
    {
      name: "uphill-check-and-score",
      run: "PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" uphill check && PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" uphill --compact"
    },
    {
      name: "lighthouse-audit-report",
      run: "PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" node scripts/audit-report.mjs --skip-uphill --upload-artifacts --strict"
    }
  ]
})

export default Flow.make("uphill", {
  description: "Score continuous WASM footprint, Zig/Rust safety, TS quality, architecture, and factory supply-chain health, producing a Lighthouse-style audit report.",
  payload: {
    run: Schema.String,
    repo: Schema.String,
    sha: Schema.String,
    ref: Schema.String,
    event: Schema.String
  },
  success: Schema.Struct({
    uphillAudit: CiJob.Result
  }),
  body: (run) =>
    Node.all({
      uphillAudit: uphillAudit.call(run)
    })
})
