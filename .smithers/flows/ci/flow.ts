import { Flow } from "@smthrs/flow"
import { Node } from "@smthrs/plan"
import { CiJob } from "@smthrs/sandbox"
import { Schema } from "effect"

// Voltaire primary CI flow planned inside Smithers Cloud's QuickJS realm
// (worker/ci/Realm.ts). Imports are restricted to @smthrs/flow, @smthrs/plan,
// @smthrs/sandbox, and effect so the realm can plan it safely without executing
// repository code on the control plane.
//
// Shared object store & trust boundaries:
// - Trusted runs (main pushes, maintainer branches) read and populate the shared
//   Smithers Cloud cache (https://build.smithers.sh).
// - Untrusted / fork PR runs execute freely without secrets (read-only cache)
//   and can never poison shared cache results or skip gates.
// - Audit and packaging artifacts upload to Smithers Cloud R2 via
//   http://artifacts.smithers.internal/<name>.

const factoryAndWiki = CiJob.make("factory-and-wiki", {
  steps: [
    {
      name: "install-smithers-deps",
      run: "cd .smithers && (command -v bun >/dev/null 2>&1 && bun install --frozen-lockfile || pnpm install --frozen-lockfile)"
    },
    {
      name: "verify-factory-home-wiki-mythical",
      run: "scripts/smthrs ci //.smithers:factory-check //.smithers:home-check //.smithers:wiki-check //.smithers:mythical-check //.smithers:factory-test"
    }
  ]
})

const tsVerify = CiJob.make("ts-verify", {
  steps: [
    {
      name: "install-deps",
      run: "pnpm install --frozen-lockfile --prefer-offline"
    },
    {
      name: "typecheck-and-lint",
      run: "pnpm --filter @tevm/voltaire run typecheck && pnpm --filter @tevm/voltaire run lint:check && pnpm --filter @tevm/voltaire run format:check"
    },
    {
      name: "unit-tests",
      run: "pnpm --filter @tevm/voltaire run test:run"
    },
    {
      name: "docs-index-check",
      run: "pnpm --filter @tevm/voltaire exec vitest run docs/docs-index.test.ts"
    }
  ]
})

// Each sandbox step opens a fresh shell in the job's checkout.
const zig = ".venv/ci-zig/bin/python-zig"

const zigAndCAbi = CiJob.make("zig-and-c-abi", {
  steps: [
    {
      name: "install-zig",
      run: `python3 -m venv --clear .venv/ci-zig && .venv/ci-zig/bin/python -m pip install --no-input --disable-pip-version-check --only-binary=:all: --no-deps --require-hashes -r scripts/ci/zig-requirements.txt && ${zig} version`
    },
    {
      name: "zig-fmt-check",
      run: `${zig} fmt --check build.zig packages/voltaire-zig/src packages/voltaire-zig/lib packages/voltaire-zig/examples`
    },
    {
      name: "zig-build-and-test",
      run: `${zig} build && ${zig} build test`
    },
    {
      name: "c-api-smoke",
      run: `${zig} build -Dwith-c-api=true -Doptimize=ReleaseFast && cc -Izig-out/include packages/voltaire-zig/examples/c/basic_usage.c -Lzig-out/lib -Wl,-rpath,\"$PWD/zig-out/lib\" -lprimitives_c -o /tmp/voltaire_c_smoke && /tmp/voltaire_c_smoke`
    }
  ]
})

const lighthouseAudit = CiJob.make("lighthouse-audit", {
  steps: [
    {
      name: "install-uphill",
      run: "command -v uphill >/dev/null 2>&1 || curl -fsSL https://raw.githubusercontent.com/wevm/uphill/main/install.sh | sh"
    },
    {
      name: "generate-and-upload-lighthouse-audit",
      run: "PATH=\"$HOME/.uphill/bin:$HOME/.bun/bin:$PATH\" node scripts/audit-report.mjs --upload-artifacts --strict"
    }
  ]
})

export default Flow.make("ci", {
  description: "Run Voltaire's full Smithers Cloud CI: factory & wiki gates, TypeScript typecheck/lint/tests, Zig & C99 ABI verification, and Lighthouse-style Uphill backpressure audit.",
  payload: {
    run: Schema.String,
    repo: Schema.String,
    sha: Schema.String,
    ref: Schema.String,
    event: Schema.String
  },
  success: Schema.Struct({
    factoryAndWiki: CiJob.Result,
    tsVerify: CiJob.Result,
    zigAndCAbi: CiJob.Result,
    lighthouseAudit: CiJob.Result
  }),
  body: (run) =>
    Node.all({
      factoryAndWiki: factoryAndWiki.call(run),
      tsVerify: tsVerify.call(run),
      zigAndCAbi: zigAndCAbi.call(run),
      lighthouseAudit: lighthouseAudit.call(run)
    })
})
