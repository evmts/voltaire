import { Flow } from "@smthrs/flow"
import { Node } from "@smthrs/plan"
import { CiJob } from "@smthrs/sandbox"
import { Schema } from "effect"

// Release verification and rehearsal flow for evmts/voltaire.
// Runs on main pushes and release tags (v*) to verify WASM staging, TypeScript
// bundle/type emission, subpath importability (--load), npm publish plan
// (--dry-run), and strict Lighthouse backpressure before GitHub OIDC npm
// publishing completes.

const releaseRehearsal = CiJob.make("release-rehearsal", {
  steps: [
    {
      name: "install-deps",
      run: "pnpm install --frozen-lockfile --prefer-offline"
    },
    {
      name: "rehearse-release-and-verify-packaging",
      run: "node scripts/publish-npm.mjs --dry-run"
    },
    {
      name: "strict-lighthouse-audit",
      run: "command -v uphill >/dev/null 2>&1 || curl -fsSL https://raw.githubusercontent.com/wevm/uphill/main/install.sh | sh; PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" node scripts/audit-report.mjs --upload-artifacts --strict"
    }
  ]
})

export default Flow.make("release", {
  description: "Rehearse @tevm/zig and @tevm/voltaire npm releases with fresh WASM, subpath load verification, and strict Lighthouse audit gates.",
  payload: {
    run: Schema.String,
    repo: Schema.String,
    sha: Schema.String,
    ref: Schema.String,
    event: Schema.String
  },
  success: Schema.Struct({
    releaseRehearsal: CiJob.Result
  }),
  body: (run) =>
    Node.all({
      releaseRehearsal: releaseRehearsal.call(run)
    })
})
