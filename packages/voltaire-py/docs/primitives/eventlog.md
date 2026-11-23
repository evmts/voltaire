# EventLog

`voltaire.eventlog` provides immutable `EventLog` and `LogFilter` dataclasses along with `filter_logs` and `sort_logs` helpers matching Ethereum `eth_getLogs` semantics.

## `EventLog`

```python
@dataclass(frozen=True, slots=True)
class EventLog:
    address: bytes                  # 20 bytes
    topics: tuple[bytes, ...]       # 0..4 items, each 32 bytes
    data: bytes
    block_number: int | None = None
    transaction_hash: bytes | None = None
    log_index: int | None = None
    transaction_index: int | None = None
    block_hash: bytes | None = None
    removed: bool = False
```

Methods: `matches_address(addresses: Sequence[bytes]) -> bool`, `matches_topic(topic_index: int, topics: Sequence[bytes]) -> bool`, `matches(filter: LogFilter) -> bool`.

## `LogFilter`, `filter_logs`, and `sort_logs`

`LogFilter` matches logs by optional `addresses`, positional `topics` (each position is a tuple of acceptable 32-byte topics using OR semantics; an empty tuple `()` is a wildcard), and optional `from_block` / `to_block`.

```python
from voltaire import EventLog, LogFilter, filter_logs, sort_logs, keccak256

contract = bytes.fromhex("A0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48")
transfer_sig = keccak256("Transfer(address,address,uint256)").to_bytes()

log = EventLog(
    address=contract,
    topics=(transfer_sig, bytes(32), bytes(32)),
    data=b"\x00" * 32,
    block_number=19_000_000,
    log_index=3,
)

f = LogFilter(addresses=(contract,), topics=((transfer_sig,), ()))
assert log.matches(f)
matched = sort_logs(filter_logs([log], f))
```
