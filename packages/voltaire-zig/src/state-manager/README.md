# State manager

## Native synchronous forks

`ForkBackend.sync_resolver` optionally supplies a context and callback that drains
`nextRequest()` with `continueRequest()` responses. The callback runs after a
cache miss queues a request, and must populate the requested value before it
returns. Native embedders install it only once their context has a stable address.
Without this callback, reads still return `RpcPending` for async/WASM hosts.
ZEVM installs its existing HTTP resolver here so interpreter and RPC state reads
use the same Voltaire cache and proof parsing.
