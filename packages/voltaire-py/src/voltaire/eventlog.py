"""
EventLog - Ethereum event log representation with filtering capabilities.
"""

from dataclasses import dataclass
from typing import Sequence

from voltaire.errors import InvalidLengthError


@dataclass(frozen=True, slots=True)
class EventLog:
    """
    Ethereum event log entry emitted by smart contracts.

    Event logs are immutable records of contract events. Each log contains:
    - The contract address that emitted the event
    - Up to 4 indexed topics (32 bytes each)
    - Non-indexed data of arbitrary length

    Example:
        >>> log = EventLog(
        ...     address=bytes(20),
        ...     topics=(bytes(32),),
        ...     data=b"hello",
        ... )
    """

    address: bytes
    """20-byte contract address that emitted the log."""

    topics: tuple[bytes, ...]
    """Indexed parameters (each 32 bytes, max 4 topics)."""

    data: bytes
    """Non-indexed parameters (ABI-encoded)."""

    block_number: int | None = None
    """Block number containing this log."""

    transaction_hash: bytes | None = None
    """32-byte transaction hash."""

    log_index: int | None = None
    """Index position of log in the block."""

    transaction_index: int | None = None
    """Transaction index in the block."""

    block_hash: bytes | None = None
    """32-byte block hash."""

    removed: bool = False
    """True if log was removed due to chain reorganization."""

    def __post_init__(self) -> None:
        """Validate log fields after initialization."""
        # Validate address length
        if len(self.address) != 20:
            raise InvalidLengthError(
                f"EventLog address must be 20 bytes, got {len(self.address)}"
            )

        # Validate topic count
        if len(self.topics) > 4:
            raise ValueError(
                f"EventLog can have at most 4 topics, got {len(self.topics)}"
            )

        # Validate each topic length
        for i, topic in enumerate(self.topics):
            if len(topic) != 32:
                raise InvalidLengthError(
                    f"Topic at index {i} must be 32 bytes, got {len(topic)}"
                )

    def matches_address(self, addresses: Sequence[bytes]) -> bool:
        """
        Check if log address matches any in the filter list.

        Args:
            addresses: Sequence of 20-byte addresses to match against.
                      Empty sequence matches all addresses.

        Returns:
            True if log address matches any filter address, or if filter is empty.
        """
        if not addresses:
            return True
        return self.address in addresses

    def matches_topic(self, topic_index: int, topics: Sequence[bytes]) -> bool:
        """
        Check if topic at given index matches any in the filter list.

        Args:
            topic_index: Index of the topic to check (0-3).
            topics: Sequence of 32-byte topics to match against.
                   Empty sequence matches all topics (wildcard).

        Returns:
            True if topic matches or filter is empty.
            False if topic_index is beyond the log's topics (unless filter is empty).
        """
        if not topics:
            return True
        if topic_index >= len(self.topics):
            return False
        return self.topics[topic_index] in topics

    def matches(self, filter: "LogFilter") -> bool:
        """
        Check if log matches the given filter.

        Args:
            filter: LogFilter to match against.

        Returns:
            True if log matches all filter criteria.
        """
        return filter.matches(self)


@dataclass(frozen=True, slots=True)
class LogFilter:
    """
    Filter for matching event logs.

    Follows Ethereum's standard filtering semantics:
    - Empty addresses tuple matches all addresses
    - Empty topics tuple matches all logs
    - Each topic position can have multiple options (OR logic)
    - Empty tuple at a topic position is a wildcard (matches any)

    Example:
        >>> # Match Transfer events from specific contract
        >>> filter = LogFilter(
        ...     addresses=(contract_addr,),
        ...     topics=((transfer_signature,),),
        ... )
    """

    addresses: tuple[bytes, ...] = ()
    """Contract addresses to match (empty = match all)."""

    topics: tuple[tuple[bytes, ...], ...] = ()
    """Topic filters by position (empty tuple at position = wildcard)."""

    def matches(self, log: EventLog) -> bool:
        """
        Check if a log matches this filter.

        Args:
            log: EventLog to check.

        Returns:
            True if log matches all filter criteria.
        """
        # Check address filter
        if self.addresses and log.address not in self.addresses:
            return False

        # Check topic filters
        for i, topic_filter in enumerate(self.topics):
            # Empty filter at position = wildcard (matches any)
            if not topic_filter:
                continue

            # If log doesn't have this topic position, no match
            if i >= len(log.topics):
                return False

            # Check if log's topic matches any in the filter (OR logic)
            if log.topics[i] not in topic_filter:
                return False

        return True


def filter_logs(logs: Sequence[EventLog], filter: LogFilter) -> list[EventLog]:
    """
    Filter a sequence of logs by criteria.

    Args:
        logs: Sequence of EventLog instances to filter.
        filter: LogFilter specifying match criteria.

    Returns:
        List of logs matching the filter.
    """
    return [log for log in logs if filter.matches(log)]


def sort_logs(logs: Sequence[EventLog]) -> list[EventLog]:
    """
    Sort logs by block number and log index.

    Sorting order: ascending by (block_number, log_index).
    None values are treated as 0.

    Args:
        logs: Sequence of EventLog instances to sort.

    Returns:
        New sorted list (does not mutate original).
    """
    return sorted(
        logs,
        key=lambda log: (
            log.block_number if log.block_number is not None else 0,
            log.log_index if log.log_index is not None else 0,
        ),
    )
