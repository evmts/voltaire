# EventLog

Ethereum event log representation with filtering capabilities.

## Overview

The `EventLog` dataclass represents an Ethereum event log entry emitted by smart contracts. The `LogFilter` dataclass provides flexible filtering using Ethereum's standard topic-based filtering semantics.

Key features:
- Immutable, frozen dataclasses with slots
- Address filtering (single or multiple)
- Topic filtering with OR logic and wildcards
- Block range filtering
- Sorting by block number and log index

## EventLog

### Construction

```python
from voltaire import EventLog

# Create a log with required fields
log = EventLog(
    address=bytes.fromhex("1234567890123456789012345678901234567890"),
    topics=(
        bytes.fromhex("ddf252ad" + "0" * 56),  # Transfer event signature
        bytes.fromhex("0" * 24 + "sender_address_here12"),  # from
        bytes.fromhex("0" * 24 + "recipient_addr_here1"),   # to
    ),
    data=b"\x00" * 32,  # amount
)

# Create with all optional fields
log = EventLog(
    address=bytes.fromhex("1234567890123456789012345678901234567890"),
    topics=(topic0,),
    data=b"",
    block_number=12345678,
    transaction_hash=bytes.fromhex("ab" * 32),
    log_index=0,
    transaction_index=5,
    block_hash=bytes.fromhex("cd" * 32),
    removed=False,
)
```

### Fields

| Field | Type | Description |
|-------|------|-------------|
| `address` | `bytes` | 20-byte contract address that emitted the log |
| `topics` | `tuple[bytes, ...]` | Indexed parameters (each 32 bytes, max 4) |
| `data` | `bytes` | Non-indexed parameters (ABI-encoded) |
| `block_number` | `int \| None` | Block number containing this log |
| `transaction_hash` | `bytes \| None` | 32-byte transaction hash |
| `log_index` | `int \| None` | Index position in the block |
| `transaction_index` | `int \| None` | Transaction index in the block |
| `block_hash` | `bytes \| None` | 32-byte block hash |
| `removed` | `bool` | True if log was removed due to reorg |

### Methods

#### matches_address

Check if log address matches any in a filter list.

```python
# Single address
if log.matches_address([contract_address]):
    print("Log from our contract")

# Multiple addresses (OR logic)
if log.matches_address([addr1, addr2, addr3]):
    print("Log from one of our contracts")

# Empty filter matches all
assert log.matches_address([])  # Always True
```

#### matches_topic

Check if a specific topic position matches any in a filter list.

```python
# Check topic at index 0 (event signature)
transfer_sig = bytes.fromhex("ddf252ad" + "0" * 56)
if log.matches_topic(0, [transfer_sig]):
    print("This is a Transfer event")

# Check topic at index 1
if log.matches_topic(1, [sender_address_padded]):
    print("Transfer from our address")

# Empty filter matches all
assert log.matches_topic(0, [])  # Always True

# Index beyond log's topics returns False
log_with_2_topics = EventLog(address=addr, topics=(t0, t1), data=b"")
assert not log_with_2_topics.matches_topic(2, [some_topic])
```

#### matches

Check if log matches a complete LogFilter.

```python
from voltaire import LogFilter

filter = LogFilter(
    addresses=(contract_address,),
    topics=((transfer_signature,), None, None),  # None = wildcard
)

if log.matches(filter):
    print("Log matches our filter")
```

## LogFilter

### Construction

```python
from voltaire import LogFilter

# Empty filter (matches all logs)
filter = LogFilter()

# Filter by address(es)
filter = LogFilter(addresses=(addr1, addr2))

# Filter by topics
filter = LogFilter(
    topics=(
        (event_sig1, event_sig2),  # Position 0: match either signature
        None,                       # Position 1: match any (wildcard)
        (specific_value,),          # Position 2: match specific value
    )
)

# Combined filter
filter = LogFilter(
    addresses=(contract_addr,),
    topics=((transfer_sig,), (sender,), None),
)
```

### Topic Filtering Semantics

Topics use Ethereum's standard filtering rules:

- **Empty tuple at position**: Matches any value (wildcard)
- **Single value tuple**: Must match exactly
- **Multiple values tuple**: OR logic (matches if any value matches)
- **Fewer filter topics than log topics**: OK (trailing positions ignored)
- **More filter topics than log topics**: No match

```python
# Example: Match Transfer OR Approval events from any sender to specific recipient
filter = LogFilter(
    topics=(
        (transfer_sig, approval_sig),  # topic0: Transfer OR Approval
        (),                             # topic1: any sender (wildcard)
        (recipient_padded,),            # topic2: specific recipient
    )
)
```

### Methods

#### matches

```python
# Check if a single log matches
if filter.matches(log):
    process(log)

# Filter a list of logs
matching_logs = [log for log in logs if filter.matches(log)]
```

## Utility Functions

### filter_logs

Filter a sequence of logs by criteria.

```python
from voltaire import filter_logs, LogFilter

filter = LogFilter(addresses=(contract_addr,))
matching = filter_logs(logs, filter)
```

### sort_logs

Sort logs by block number, then log index.

```python
from voltaire import sort_logs

sorted_logs = sort_logs(logs)
# Logs are sorted ascending by (block_number, log_index)
# None values treated as 0
```

## Complete Example

```python
from voltaire import EventLog, LogFilter, filter_logs, sort_logs

# ERC20 Transfer event signature (keccak256("Transfer(address,address,uint256)"))
TRANSFER_SIG = bytes.fromhex(
    "ddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
)

# Create logs
logs = [
    EventLog(
        address=usdc_contract,
        topics=(TRANSFER_SIG, pad_address(alice), pad_address(bob)),
        data=encode_uint256(1000),
        block_number=100,
        log_index=0,
    ),
    EventLog(
        address=usdt_contract,
        topics=(TRANSFER_SIG, pad_address(alice), pad_address(charlie)),
        data=encode_uint256(500),
        block_number=101,
        log_index=0,
    ),
]

# Find all transfers from Alice
filter = LogFilter(
    topics=(
        (TRANSFER_SIG,),      # Transfer events
        (pad_address(alice),), # from Alice
    )
)

alice_transfers = filter_logs(logs, filter)
sorted_transfers = sort_logs(alice_transfers)

for log in sorted_transfers:
    print(f"Block {log.block_number}: Transfer from Alice")
```

## Error Handling

EventLog performs validation on construction:

```python
from voltaire import EventLog
from voltaire.errors import InvalidLengthError

# Address must be 20 bytes
try:
    EventLog(address=b"short", topics=(), data=b"")
except InvalidLengthError:
    pass

# Each topic must be 32 bytes
try:
    EventLog(
        address=bytes(20),
        topics=(b"short_topic",),
        data=b"",
    )
except InvalidLengthError:
    pass

# Max 4 topics (LOG0-LOG4)
try:
    EventLog(
        address=bytes(20),
        topics=(bytes(32),) * 5,  # 5 topics
        data=b"",
    )
except ValueError:
    pass
```
