/**
 * The coding factory that develops evmts/voltaire (https://smithers.sh/evmts/voltaire):
 * featured flows, Smithers Cloud CI triggers, Dispatcher rules, GitHub mirror
 * switchover policy, trust roots, machine requirements, and saved issue views.
 *
 * Projected into `.smithers/factory.json` by `//.smithers:factory-write` and
 * verified by `//.smithers:factory-check`. Edit this file, never the JSON.
 *
 * Multi-audience homepage sections (`maintainer`, `contributor`, `everyone`)
 * live in `.smithers/HOME.ts` and project into `.smithers/home.json` via
 * `//.smithers:home-write` / `//.smithers:home-check` using `@smthrs/views`.
 */
import { Smithers as S } from "@smthrs/targets"
import { On, Trigger } from "@smthrs/triggers"
import ciFlow from "./flows/ci/flow.ts"
import docsPublishFlow from "./flows/docs-publish/flow.ts"
import releaseFlow from "./flows/release/flow.ts"
import uphillFlow from "./flows/uphill/flow.ts"

// --- featured flows --------------------------------------------------------

export const ci = S.Flow({
  flow: "ci",
  featured: true,
  summary: "Run full Smithers Cloud CI across Zig, C99 ABI, TypeScript, wiki, and Lighthouse audit gates."
})

export const uphill = S.Flow({
  flow: "uphill",
  featured: true,
  summary: "Generate the 5-category Lighthouse backpressure audit report and upload it to Cloud artifacts."
})

export const docsPublish = S.Flow({
  flow: "docs-publish",
  featured: true,
  summary: "Verify Mintlify docs and llms.txt, build the live playground, and refresh Obsidian wiki feeds."
})

export const release = S.Flow({
  flow: "release",
  featured: true,
  summary: "Rehearse @tevm/zig and @tevm/voltaire npm releases with fresh WASM and subpath load checks."
})

export const review = S.Flow({
  flow: "checks/review",
  featured: true,
  summary: "Multi-lens review covering tests, Zig/crypto safety, errors, types, docs, and trust boundaries."
})

export const issueRepro = S.Flow({
  flow: "issue/repro",
  featured: true,
  summary: "Reproduce and validate one GitHub issue using repository-owned Zig and TypeScript tests."
})

export const issuePoc = S.Flow({
  flow: "issue/poc",
  featured: true,
  summary: "Write the smallest failing test and local PoC for an accepted issue."
})

export const prTriage = S.Flow({
  flow: "pr-triage",
  featured: true,
  summary: "Triage one pull request from its diff without approving or merging."
})

export const securityAudit = S.Flow({
  flow: "security-audit",
  featured: false,
  summary: "Nightly audit of constant-time crypto, Zig/Rust FFI ownership, and cache trust boundaries."
})

export const ciHealth = S.Flow({
  flow: "ci-health",
  featured: false,
  summary: "Diagnose build graph cache hits, WASM size deltas, and Uphill Lighthouse score trends."
})

// --- factory declaration ---------------------------------------------------

export const factory = S.Factory({
  summary: "Public Smithers Cloud coding factory for evmts/voltaire Ethereum primitives and cryptography.",
  flows: [
    ci,
    uphill,
    docsPublish,
    release,
    review,
    issueRepro,
    issuePoc,
    prTriage,
    securityAudit,
    ciHealth
  ],
  // Smithers Cloud plugin manifest triggers (emits apiVersion: 1 + contributes.triggers).
  // Fork and external contributor PRs run untrusted with read-only cache access and
  // zero secrets; main pushes run trusted and trigger post-merge publishing.
  triggers: {
    "ci-main": Trigger.bind({
      flow: ciFlow,
      on: On.push({ branches: ["main"] }),
      title: "CI and Lighthouse audit on main"
    }),
    "ci-pr": Trigger.bind({
      flow: ciFlow,
      on: On.pullRequest({ branches: ["main"] }),
      title: "CI and Lighthouse audit on pull requests"
    }),
    "uphill-pr": Trigger.bind({
      flow: uphillFlow,
      on: On.pullRequest({ branches: ["main"] }),
      title: "Uphill Lighthouse backpressure audit on pull requests"
    }),
    "docs-publish-main": Trigger.bind({
      flow: docsPublishFlow,
      on: On.push({ branches: ["main"] }),
      title: "Verify docs, build playground, and refresh wiki feeds on main"
    }),
    "release-main": Trigger.bind({
      flow: releaseFlow,
      on: On.push({ branches: ["main"], tags: ["v*"] }),
      title: "Rehearse npm release and packaging verification on main"
    }),
    "ci-manual": Trigger.bind({
      flow: ciFlow,
      on: On.manual(),
      title: "Run Voltaire CI manually"
    }),
    "uphill-manual": Trigger.bind({
      flow: uphillFlow,
      on: On.manual(),
      title: "Run Lighthouse backpressure audit manually"
    }),
    "release-manual": Trigger.bind({
      flow: releaseFlow,
      on: On.manual(),
      title: "Run release rehearsal manually"
    })
  },
  on: {
    "issue.labeled:todo": {
      flow: "issue/poc",
      description: "Build a failing test and PoC for every maintainer-accepted TODO"
    },
    "change.opened": {
      flow: "checks/review",
      description: "Review every Change through Voltaire's quality, crypto safety, and trust lenses"
    },
    "change.updated": {
      flow: "checks/review",
      description: "Re-review every updated Change"
    },
    "change.landed": {
      flow: ["docs-publish", "release"],
      description: "Verify docs, refresh wiki feeds, and rehearse releases after every landing"
    },
    "github.push:main": {
      flow: ["ci", "docs-publish"],
      description: "Run full CI and refresh docs, playground, and wiki feeds on main pushes"
    },
    "schedule:0 2 * * *": {
      flow: "security-audit",
      description: "Audit cryptography, FFI ownership, and cache trust boundaries nightly"
    },
    "schedule:0 10 * * 1": {
      flow: "ci-health",
      description: "Report build graph cache health, WASM bundle deltas, and Lighthouse score trends weekly"
    }
  },
  // Permanent Smithers Cloud switchover:
  // Smithers Cloud lands approved Changes and pushes main to GitHub, which
  // automatically triggers GitHub Actions npm publishing (OIDC provenance),
  // Mintlify docs deployment, and Vercel playground deploys.
  github: S.Github.Policy({
    mirror: "push",
    issues: "two-way",
    changes: "land",
    maintainers: ["roninjin10"],
    dailyTokens: 1_000_000_000,
    protectedPaths: [
      ".smithers/WORKSPACE.ts",
      ".smithers/FACTORY.ts",
      ".smithers/HOME.ts",
      ".smithers/PACKAGE.ts",
      ".smithers/factory.json",
      ".smithers/home.json",
      ".smithers/package.json",
      ".agents/uphill",
      ".github",
      ".mcp.json",
      "build.zig",
      "build.zig.zon",
      "Cargo.toml",
      "Cargo.lock",
      "package.json",
      "pnpm-lock.yaml",
      "pnpm-workspace.yaml",
      "scripts/smthrs",
      "scripts/smthrs-auth.mjs",
      "scripts/publish-npm.mjs",
      "scripts/verify-packaging.mjs",
      "scripts/audit-report.mjs",
      "scripts/publish-feeds.mjs",
      "packages/voltaire-zig/src/crypto",
      "packages/voltaire-zig/src/c_api.zig",
      "packages/voltaire-zig/src/primitives.h"
    ]
  }),
  policy: {
    lifecycle: {
      docs: "evergreen",
      tests: "evergreen"
    },
    approvals: {
      approve: "person",
      merge: "person"
    }
  },
  machine: {
    vcpus: 8,
    memoryMiB: 16384,
    tools: ["zig", "cargo", "rustc", "cc", "node", "pnpm", "bun", "uphill"]
  },
  issueViews: [
    { id: "open", title: "All Open Issues", state: "open" },
    { id: "todos", title: "Accepted TODOs", state: "open", labels: ["todo"] },
    { id: "bugs", title: "Bugs", state: "open", labels: ["bug"] },
    { id: "zig", title: "Zig Core", state: "open", labels: ["zig"] },
    { id: "security", title: "Crypto and Safety", state: "open", labels: ["security"] }
  ],
  issueTransitions: [
    { id: "accept", title: "Accept issue", from: "proposed", to: "accepted", actor: "person" },
    { id: "todo", title: "Promote to TODO", from: "accepted", to: "todo", actor: "person" },
    { id: "needs-repro", title: "Request minimal reproduction", from: "proposed", to: "needs-repro", actor: "person" },
    { id: "decline", title: "Decline issue", from: "proposed", to: "not-accepted", actor: "person" }
  ]
})
