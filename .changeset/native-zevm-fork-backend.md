---
"@tevm/zig": minor
"@tevm/voltaire": patch
---

Expose native light-client primitives and an optional synchronous fork resolver for ZEVM embedding. Preserve the asynchronous request/continue interface for existing hosts and add a focused state-manager test target.

Correct target-specific Rust archive selection for native cross builds and enable the C API targets used by Swift/native release jobs.
