import { Flow } from "@smthrs/flow"
import { Node } from "@smthrs/plan"
import { CiJob } from "@smthrs/sandbox"
import { Schema } from "effect"

// Post-merge publishing & verification flow triggered when Smithers Cloud lands
// on main and mirrors to GitHub. Verifies Mintlify docs & llms.txt parity,
// builds the live playground bundle, refreshes the Obsidian wiki + Mythical
// History feed payload, and publishes to Smithers Cloud feeds when authorized.

const docsAndPlayground = CiJob.make("docs-and-playground", {
  steps: [
    {
      name: "install-deps",
      run: "pnpm install --frozen-lockfile --prefer-offline"
    },
    {
      name: "verify-mintlify-docs-and-llms",
      run: "pnpm --filter @tevm/voltaire exec vitest run docs/docs-index.test.ts"
    },
    {
      name: "build-playground",
      run: "pnpm --filter @tevm/voltaire run build:dist && pnpm --filter @tevm/playground run build"
    }
  ]
})

const wikiAndFeeds = CiJob.make("wiki-and-feeds", {
  steps: [
    {
      name: "install-uphill",
      run: "command -v uphill >/dev/null 2>&1 || curl -fsSL https://wevm.sh/uphill | sh"
    },
    {
      name: "build-audit-and-feeds",
      run: "PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" node scripts/audit-report.mjs --upload-artifacts --strict && node scripts/publish-feeds.mjs"
    },
    {
      name: "upload-feeds-artifact",
      run: "curl -fsS -X PUT --data-binary @.smithers/reports/feeds-payload.json -H 'content-type: application/json' http://artifacts.smithers.internal/feeds-payload.json || true"
    }
  ]
})

export default Flow.make("docs-publish", {
  description: "Verify Mintlify docs and llms.txt, build the live playground, refresh the Obsidian wiki and mythical history feeds, and publish artifacts on main merges.",
  payload: {
    run: Schema.String,
    repo: Schema.String,
    sha: Schema.String,
    ref: Schema.String,
    event: Schema.String
  },
  success: Schema.Struct({
    docsAndPlayground: CiJob.Result,
    wikiAndFeeds: CiJob.Result
  }),
  body: (run) =>
    Node.all({
      docsAndPlayground: docsAndPlayground.call(run),
      wikiAndFeeds: wikiAndFeeds.call(run)
    })
})
