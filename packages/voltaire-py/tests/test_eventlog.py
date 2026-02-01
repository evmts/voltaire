"""Tests for EventLog module."""

import pytest
from voltaire.eventlog import EventLog, LogFilter, filter_logs, sort_logs
from voltaire.errors import InvalidLengthError


# Test data
ADDR1 = bytes.fromhex("0000000000000000000000000000000000000001")
ADDR2 = bytes.fromhex("0000000000000000000000000000000000000002")
TOPIC0 = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000010")
TOPIC1 = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000011")
TOPIC2 = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000012")
TOPIC3 = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000013")
BLOCK_HASH = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000100")
TX_HASH = bytes.fromhex("0000000000000000000000000000000000000000000000000000000000000200")


class TestEventLogCreation:
    """Tests for EventLog construction."""

    def test_create_with_required_fields(self):
        """Create log with only required fields."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0, TOPIC1),
            data=bytes([1, 2, 3]),
        )

        assert log.address == ADDR1
        assert log.topics == (TOPIC0, TOPIC1)
        assert log.data == bytes([1, 2, 3])
        assert log.removed is False

    def test_create_with_all_fields(self):
        """Create log with all fields."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0,),
            data=bytes([1]),
            block_number=100,
            transaction_hash=TX_HASH,
            transaction_index=5,
            block_hash=BLOCK_HASH,
            log_index=10,
            removed=True,
        )

        assert log.address == ADDR1
        assert log.block_number == 100
        assert log.transaction_hash == TX_HASH
        assert log.transaction_index == 5
        assert log.block_hash == BLOCK_HASH
        assert log.log_index == 10
        assert log.removed is True

    def test_create_with_empty_topics(self):
        """Create log with no topics (LOG0)."""
        log = EventLog(
            address=ADDR1,
            topics=(),
            data=b"",
        )

        assert log.topics == ()
        assert log.data == b""

    def test_create_with_empty_data(self):
        """Create log with empty data."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0,),
            data=b"",
        )

        assert log.data == b""
        assert len(log.data) == 0


class TestEventLogValidation:
    """Tests for EventLog validation."""

    def test_reject_invalid_address_length(self):
        """Address must be exactly 20 bytes."""
        with pytest.raises(InvalidLengthError):
            EventLog(address=b"short", topics=(), data=b"")

        with pytest.raises(InvalidLengthError):
            EventLog(address=bytes(21), topics=(), data=b"")

    def test_reject_invalid_topic_length(self):
        """Each topic must be exactly 32 bytes."""
        with pytest.raises(InvalidLengthError):
            EventLog(
                address=ADDR1,
                topics=(b"short",),
                data=b"",
            )

        with pytest.raises(InvalidLengthError):
            EventLog(
                address=ADDR1,
                topics=(bytes(64),),
                data=b"",
            )

    def test_reject_more_than_4_topics(self):
        """Max 4 topics allowed (LOG0-LOG4)."""
        with pytest.raises(ValueError):
            EventLog(
                address=ADDR1,
                topics=(TOPIC0, TOPIC1, TOPIC2, TOPIC3, TOPIC0),
                data=b"",
            )

    def test_validate_all_topics(self):
        """Validate all topics, not just first."""
        with pytest.raises(InvalidLengthError):
            EventLog(
                address=ADDR1,
                topics=(TOPIC0, TOPIC1, b"bad"),
                data=b"",
            )


class TestMatchesAddress:
    """Tests for EventLog.matches_address method."""

    def test_matches_single_address(self):
        """Match single address in filter."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert log.matches_address([ADDR1]) is True
        assert log.matches_address([ADDR2]) is False

    def test_matches_multiple_addresses(self):
        """Match any address in filter (OR logic)."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert log.matches_address([ADDR1, ADDR2]) is True
        assert log.matches_address([ADDR2, ADDR1]) is True
        assert log.matches_address([ADDR2]) is False

    def test_empty_filter_matches_all(self):
        """Empty address filter matches all logs."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert log.matches_address([]) is True

    def test_matches_bytewise(self):
        """Address comparison is byte-wise."""
        addr_copy = bytes.fromhex("0000000000000000000000000000000000000001")
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert log.matches_address([addr_copy]) is True


class TestMatchesTopic:
    """Tests for EventLog.matches_topic method."""

    def test_matches_topic_at_index(self):
        """Match topic at specific index."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1, TOPIC2), data=b"")

        assert log.matches_topic(0, [TOPIC0]) is True
        assert log.matches_topic(1, [TOPIC1]) is True
        assert log.matches_topic(2, [TOPIC2]) is True
        assert log.matches_topic(0, [TOPIC1]) is False

    def test_matches_topic_multiple(self):
        """Match any topic in filter (OR logic)."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert log.matches_topic(0, [TOPIC0, TOPIC1]) is True
        assert log.matches_topic(0, [TOPIC1, TOPIC2]) is False
        assert log.matches_topic(1, [TOPIC0, TOPIC1]) is True

    def test_empty_filter_matches_all(self):
        """Empty topic filter matches all."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert log.matches_topic(0, []) is True
        assert log.matches_topic(1, []) is True

    def test_index_beyond_topics_returns_false(self):
        """Index beyond log's topics returns False."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert log.matches_topic(2, [TOPIC2]) is False
        assert log.matches_topic(3, [TOPIC3]) is False
        # But empty filter still matches
        assert log.matches_topic(2, []) is True


class TestLogFilter:
    """Tests for LogFilter dataclass."""

    def test_empty_filter(self):
        """Empty filter has default values."""
        f = LogFilter()
        assert f.addresses == ()
        assert f.topics == ()

    def test_filter_with_addresses(self):
        """Create filter with addresses."""
        f = LogFilter(addresses=(ADDR1, ADDR2))
        assert f.addresses == (ADDR1, ADDR2)

    def test_filter_with_topics(self):
        """Create filter with topics."""
        f = LogFilter(topics=((TOPIC0,), (TOPIC1, TOPIC2)))
        assert f.topics == ((TOPIC0,), (TOPIC1, TOPIC2))


class TestLogFilterMatches:
    """Tests for LogFilter.matches method."""

    def test_matches_address_only(self):
        """Filter with address only."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert LogFilter(addresses=(ADDR1,)).matches(log) is True
        assert LogFilter(addresses=(ADDR2,)).matches(log) is False
        assert LogFilter(addresses=(ADDR1, ADDR2)).matches(log) is True

    def test_matches_topics_only(self):
        """Filter with topics only."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert LogFilter(topics=((TOPIC0,), (TOPIC1,))).matches(log) is True
        assert LogFilter(topics=((TOPIC0,), ())).matches(log) is True  # wildcard
        assert LogFilter(topics=((TOPIC1,),)).matches(log) is False

    def test_matches_address_and_topics(self):
        """Filter with both address and topics."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert LogFilter(
            addresses=(ADDR1,),
            topics=((TOPIC0,), (TOPIC1,)),
        ).matches(log) is True

        assert LogFilter(
            addresses=(ADDR2,),
            topics=((TOPIC0,), (TOPIC1,)),
        ).matches(log) is False

        assert LogFilter(
            addresses=(ADDR1,),
            topics=((TOPIC1,),),
        ).matches(log) is False

    def test_matches_empty_filter(self):
        """Empty filter matches all logs."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        assert LogFilter().matches(log) is True

    def test_topic_wildcard(self):
        """Empty tuple at topic position is wildcard."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1, TOPIC2), data=b"")

        assert LogFilter(topics=((TOPIC0,), (), (TOPIC2,))).matches(log) is True
        assert LogFilter(topics=((), (TOPIC1,), ())).matches(log) is True

    def test_topic_or_logic(self):
        """Multiple values at topic position use OR logic."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1, TOPIC2), data=b"")

        assert LogFilter(topics=((TOPIC0, TOPIC1),)).matches(log) is True
        assert LogFilter(topics=((TOPIC0,), (TOPIC1, TOPIC3))).matches(log) is True
        assert LogFilter(topics=((TOPIC0,), (TOPIC2, TOPIC3))).matches(log) is False

    def test_fewer_filter_topics_ok(self):
        """Filter with fewer topics than log is OK."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1, TOPIC2), data=b"")

        assert LogFilter(topics=((TOPIC0,),)).matches(log) is True
        assert LogFilter(topics=((TOPIC0,), (TOPIC1,))).matches(log) is True

    def test_more_filter_topics_fails(self):
        """Filter with more topics than log fails."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=b"")

        assert LogFilter(topics=((TOPIC0,), (TOPIC1,), (TOPIC2,))).matches(log) is False


class TestEventLogMatches:
    """Tests for EventLog.matches method."""

    def test_matches_filter(self):
        """EventLog.matches uses LogFilter."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0, TOPIC1),
            data=b"",
            block_number=100,
        )

        filter = LogFilter(
            addresses=(ADDR1,),
            topics=((TOPIC0,),),
        )

        assert log.matches(filter) is True


class TestFilterLogs:
    """Tests for filter_logs function."""

    def test_filter_by_address(self):
        """Filter logs by address."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=bytes([1])),
            EventLog(address=ADDR2, topics=(TOPIC0,), data=bytes([2])),
            EventLog(address=ADDR1, topics=(TOPIC1,), data=bytes([3])),
        ]

        filtered = filter_logs(logs, LogFilter(addresses=(ADDR1,)))
        assert len(filtered) == 2
        assert filtered[0].data == bytes([1])
        assert filtered[1].data == bytes([3])

    def test_filter_by_topics(self):
        """Filter logs by topics."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1), data=bytes([1])),
            EventLog(address=ADDR2, topics=(TOPIC0, TOPIC2), data=bytes([2])),
            EventLog(address=ADDR1, topics=(TOPIC1, TOPIC1), data=bytes([3])),
        ]

        filtered = filter_logs(logs, LogFilter(topics=((TOPIC0,),)))
        assert len(filtered) == 2
        assert filtered[0].data == bytes([1])
        assert filtered[1].data == bytes([2])

    def test_filter_combined(self):
        """Filter by address and topics."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=bytes([1])),
            EventLog(address=ADDR2, topics=(TOPIC0,), data=bytes([2])),
            EventLog(address=ADDR1, topics=(TOPIC1,), data=bytes([3])),
        ]

        filtered = filter_logs(logs, LogFilter(
            addresses=(ADDR1,),
            topics=((TOPIC0,),),
        ))
        assert len(filtered) == 1
        assert filtered[0].data == bytes([1])

    def test_filter_empty_returns_all(self):
        """Empty filter returns all logs."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=bytes([1])),
            EventLog(address=ADDR2, topics=(TOPIC1,), data=bytes([2])),
        ]

        filtered = filter_logs(logs, LogFilter())
        assert len(filtered) == 2

    def test_filter_no_matches(self):
        """Filter with no matches returns empty list."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=bytes([1])),
        ]

        filtered = filter_logs(logs, LogFilter(addresses=(ADDR2,)))
        assert len(filtered) == 0


class TestSortLogs:
    """Tests for sort_logs function."""

    def test_sort_by_block_number(self):
        """Sort logs by block number ascending."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=103),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=101),
        ]

        sorted_logs = sort_logs(logs)
        assert sorted_logs[0].block_number == 100
        assert sorted_logs[1].block_number == 101
        assert sorted_logs[2].block_number == 103

    def test_sort_by_log_index_when_same_block(self):
        """Sort by log index when block numbers are equal."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100, log_index=5),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100, log_index=2),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100, log_index=10),
        ]

        sorted_logs = sort_logs(logs)
        assert sorted_logs[0].log_index == 2
        assert sorted_logs[1].log_index == 5
        assert sorted_logs[2].log_index == 10

    def test_none_block_number_treated_as_zero(self):
        """None block numbers sorted first (treated as 0)."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b""),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=50),
        ]

        sorted_logs = sort_logs(logs)
        assert sorted_logs[0].block_number is None
        assert sorted_logs[1].block_number == 50
        assert sorted_logs[2].block_number == 100

    def test_none_log_index_treated_as_zero(self):
        """None log indexes sorted first (treated as 0)."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100, log_index=5),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100, log_index=2),
        ]

        sorted_logs = sort_logs(logs)
        assert sorted_logs[0].log_index is None
        assert sorted_logs[1].log_index == 2
        assert sorted_logs[2].log_index == 5

    def test_sort_does_not_mutate_original(self):
        """sort_logs returns new list, does not mutate original."""
        logs = [
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=103),
            EventLog(address=ADDR1, topics=(TOPIC0,), data=b"", block_number=100),
        ]

        sorted_logs = sort_logs(logs)
        assert logs[0].block_number == 103
        assert sorted_logs[0].block_number == 100
        assert logs is not sorted_logs


class TestEventLogImmutability:
    """Tests for EventLog immutability."""

    def test_frozen(self):
        """EventLog is frozen (immutable)."""
        log = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")

        with pytest.raises(AttributeError):
            log.address = ADDR2  # type: ignore

    def test_hashable(self):
        """EventLog is hashable (can be used in sets/dicts)."""
        log1 = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")
        log2 = EventLog(address=ADDR1, topics=(TOPIC0,), data=b"")
        log3 = EventLog(address=ADDR2, topics=(TOPIC0,), data=b"")

        # Same content = same hash
        assert hash(log1) == hash(log2)

        # Can use in set
        s = {log1, log2, log3}
        assert len(s) == 2


class TestLogFilterImmutability:
    """Tests for LogFilter immutability."""

    def test_frozen(self):
        """LogFilter is frozen (immutable)."""
        f = LogFilter(addresses=(ADDR1,))

        with pytest.raises(AttributeError):
            f.addresses = (ADDR2,)  # type: ignore


class TestEdgeCases:
    """Edge case tests."""

    def test_log_with_4_topics(self):
        """Log with maximum 4 topics."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0, TOPIC1, TOPIC2, TOPIC3),
            data=b"",
        )

        assert len(log.topics) == 4

    def test_very_large_block_number(self):
        """Handle very large block numbers."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0,),
            data=b"",
            block_number=999999999999999,
        )

        assert log.block_number == 999999999999999

    def test_zero_block_number(self):
        """Handle block number 0."""
        log = EventLog(
            address=ADDR1,
            topics=(TOPIC0,),
            data=b"",
            block_number=0,
        )

        assert log.block_number == 0

    def test_all_wildcard_topics(self):
        """Filter with all wildcard topics matches any log."""
        log = EventLog(address=ADDR1, topics=(TOPIC0, TOPIC1, TOPIC2), data=b"")

        assert LogFilter(topics=((), (), ())).matches(log) is True
