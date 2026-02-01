"""Tests for Hash module."""

import pytest

from voltaire.hash import Hash, keccak256, sha256, eip191_hash_message, blake2b, ripemd160
from voltaire.errors import InvalidHexError, InvalidLengthError


class TestKeccak256:
    """Tests for keccak256 hash function."""

    def test_empty_string(self):
        """Keccak256 of empty data matches known constant."""
        h = keccak256(b"")
        expected = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        assert h.to_hex() == expected

    def test_hello(self):
        """Keccak256 of 'hello' matches known vector."""
        h = keccak256("hello")
        expected = "0x1c8aff950685c2ed4bc3174f3472287b56d9517b9c948127319a09a7a36deac8"
        assert h.to_hex() == expected

    def test_hello_world(self):
        """Keccak256 of 'Hello World!' matches known vector."""
        h = keccak256("Hello World!")
        expected = "0x3ea2f1d0abf3fc66cf29eebb70cbd4e7fe762ef8a09bcc06c8edf641230afec0"
        assert h.to_hex() == expected

    def test_bytes_input(self):
        """Keccak256 accepts bytes input."""
        h = keccak256(b"\xde\xad\xbe\xef")
        assert len(h.to_bytes()) == 32

    def test_string_utf8_encoding(self):
        """String input is UTF-8 encoded."""
        h1 = keccak256("hello")
        h2 = keccak256(b"hello")
        assert h1 == h2

    def test_deterministic(self):
        """Same input produces same hash."""
        h1 = keccak256("test")
        h2 = keccak256("test")
        assert h1 == h2

    def test_different_inputs(self):
        """Different inputs produce different hashes."""
        h1 = keccak256("hello")
        h2 = keccak256("world")
        assert h1 != h2


class TestSha256:
    """Tests for SHA-256 hash function."""

    def test_empty_string(self):
        """SHA-256 of empty data matches known constant."""
        h = sha256(b"")
        expected = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        assert h.to_hex() == expected

    def test_hello(self):
        """SHA-256 of 'hello' matches known vector."""
        h = sha256("hello")
        expected = "0x2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824"
        assert h.to_hex() == expected

    def test_bytes_input(self):
        """SHA-256 accepts bytes input."""
        h = sha256(b"\xde\xad\xbe\xef")
        assert len(h.to_bytes()) == 32

    def test_deterministic(self):
        """Same input produces same hash."""
        h1 = sha256("test")
        h2 = sha256("test")
        assert h1 == h2


class TestHashFromHex:
    """Tests for Hash.from_hex constructor."""

    def test_with_0x_prefix(self):
        """Parse hex string with 0x prefix."""
        hex_str = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        h = Hash.from_hex(hex_str)
        assert h.to_hex() == hex_str

    def test_without_0x_prefix(self):
        """Parse hex string without 0x prefix."""
        hex_str = "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        h = Hash.from_hex(hex_str)
        assert h.to_hex() == "0x" + hex_str

    def test_uppercase_hex(self):
        """Parse uppercase hex string."""
        hex_str = "0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF"
        h = Hash.from_hex(hex_str)
        # Output is lowercase
        assert h.to_hex() == hex_str.lower()

    def test_invalid_hex_characters(self):
        """Reject invalid hex characters."""
        with pytest.raises(InvalidHexError):
            Hash.from_hex("0x123456789Gabcdef1234567890abcdef1234567890abcdef1234567890abcdef")

    def test_invalid_length_short(self):
        """Reject too short hex string."""
        with pytest.raises(InvalidHexError):
            Hash.from_hex("0x1234")

    def test_invalid_length_long(self):
        """Reject too long hex string."""
        with pytest.raises(InvalidHexError):
            Hash.from_hex("0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef00")


class TestHashFromBytes:
    """Tests for Hash.from_bytes constructor."""

    def test_valid_bytes(self):
        """Create hash from 32 bytes."""
        data = bytes(range(32))
        h = Hash.from_bytes(data)
        assert h.to_bytes() == data

    def test_invalid_length_short(self):
        """Reject too short bytes."""
        with pytest.raises(InvalidLengthError):
            Hash.from_bytes(b"\x00" * 31)

    def test_invalid_length_long(self):
        """Reject too long bytes."""
        with pytest.raises(InvalidLengthError):
            Hash.from_bytes(b"\x00" * 33)

    def test_zero_hash(self):
        """Create zero hash."""
        h = Hash.from_bytes(b"\x00" * 32)
        expected = "0x0000000000000000000000000000000000000000000000000000000000000000"
        assert h.to_hex() == expected


class TestHashEquality:
    """Tests for Hash equality comparison."""

    def test_equal_hashes(self):
        """Equal hashes compare equal."""
        h1 = keccak256("hello")
        h2 = keccak256("hello")
        assert h1 == h2

    def test_unequal_hashes(self):
        """Different hashes compare unequal."""
        h1 = keccak256("hello")
        h2 = keccak256("world")
        assert h1 != h2

    def test_compare_with_non_hash(self):
        """Comparison with non-Hash returns False."""
        h = keccak256("hello")
        assert h != "not a hash"
        assert h != 123
        assert h != None

    def test_hash_is_hashable(self):
        """Hash can be used in sets and as dict keys."""
        h1 = keccak256("a")
        h2 = keccak256("b")
        h3 = keccak256("a")

        s = {h1, h2, h3}
        assert len(s) == 2  # h1 and h3 are equal

        d = {h1: "value"}
        assert d[h3] == "value"  # h3 equals h1


class TestEip191HashMessage:
    """Tests for EIP-191 message hashing."""

    def test_basic_message(self):
        """EIP-191 hash of a message."""
        h = eip191_hash_message("Hello, Ethereum!")
        # Should not be zero
        assert h != Hash.from_bytes(b"\x00" * 32)
        # Should be deterministic
        h2 = eip191_hash_message("Hello, Ethereum!")
        assert h == h2

    def test_empty_message(self):
        """EIP-191 hash of empty message."""
        h = eip191_hash_message("")
        # Should not be same as keccak256("")
        assert h != keccak256("")

    def test_different_messages(self):
        """Different messages produce different hashes."""
        h1 = eip191_hash_message("hello")
        h2 = eip191_hash_message("world")
        assert h1 != h2

    def test_string_input(self):
        """String input is UTF-8 encoded."""
        h1 = eip191_hash_message("test")
        h2 = eip191_hash_message(b"test")
        assert h1 == h2

    def test_known_vector(self):
        """EIP-191 hash matches expected format.

        Message: "hello"
        Prefix: "\x19Ethereum Signed Message:\n5"
        Full: "\x19Ethereum Signed Message:\n5hello"
        """
        h = eip191_hash_message("hello")
        # The hash should be keccak256("\x19Ethereum Signed Message:\n5hello")
        full_msg = b"\x19Ethereum Signed Message:\n5hello"
        expected = keccak256(full_msg)
        assert h == expected


class TestHashConversion:
    """Tests for Hash conversion methods."""

    def test_to_hex_lowercase(self):
        """to_hex returns lowercase hex with 0x prefix."""
        h = Hash.from_hex("0x1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF")
        hex_str = h.to_hex()
        assert hex_str.startswith("0x")
        assert hex_str == hex_str.lower()
        assert len(hex_str) == 66

    def test_to_bytes_length(self):
        """to_bytes returns exactly 32 bytes."""
        h = keccak256("test")
        raw = h.to_bytes()
        assert isinstance(raw, bytes)
        assert len(raw) == 32

    def test_roundtrip_hex(self):
        """Hex roundtrip preserves value."""
        original = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef"
        h = Hash.from_hex(original)
        assert h.to_hex() == original

    def test_roundtrip_bytes(self):
        """Bytes roundtrip preserves value."""
        original = bytes(range(32))
        h = Hash.from_bytes(original)
        assert h.to_bytes() == original


class TestHashRepr:
    """Tests for Hash string representation."""

    def test_repr(self):
        """Hash has useful repr."""
        h = keccak256("hello")
        r = repr(h)
        assert "Hash" in r
        # Should contain at least part of the hex
        assert "1c8aff" in r.lower() or h.to_hex()[:10] in r


class TestFunctionSelector:
    """Tests for computing function selectors."""

    def test_transfer_selector(self):
        """ERC20 transfer selector."""
        sig = "transfer(address,uint256)"
        h = keccak256(sig)
        selector = h.to_bytes()[:4]
        assert selector == bytes([0xa9, 0x05, 0x9c, 0xbb])

    def test_balance_of_selector(self):
        """ERC20 balanceOf selector."""
        sig = "balanceOf(address)"
        h = keccak256(sig)
        selector = h.to_bytes()[:4]
        assert selector == bytes([0x70, 0xa0, 0x82, 0x31])


class TestBlake2b:
    """Tests for BLAKE2b hash function."""

    def test_empty_input(self):
        """BLAKE2b of empty data matches known constant."""
        h = blake2b(b"")
        assert len(h) == 64
        # Known BLAKE2b-512 hash of empty input
        expected = bytes([
            0x78, 0x6a, 0x02, 0xf7, 0x42, 0x01, 0x59, 0x03, 0xc6, 0xc6, 0xfd, 0x85,
            0x25, 0x52, 0xd2, 0x72, 0x91, 0x2f, 0x47, 0x40, 0xe1, 0x58, 0x47, 0x61,
            0x8a, 0x86, 0xe2, 0x17, 0xf7, 0x1f, 0x54, 0x19, 0xd2, 0x5e, 0x10, 0x31,
            0xaf, 0xee, 0x58, 0x53, 0x13, 0x89, 0x64, 0x44, 0x93, 0x4e, 0xb0, 0x4b,
            0x90, 0x3a, 0x68, 0x5b, 0x14, 0x48, 0xb7, 0x55, 0xd5, 0x6f, 0x70, 0x1a,
            0xfe, 0x9b, 0xe2, 0xce,
        ])
        assert h == expected

    def test_abc(self):
        """BLAKE2b of 'abc' matches known vector (RFC 7693)."""
        h = blake2b(b"abc")
        assert len(h) == 64
        # Known BLAKE2b-512 hash of "abc"
        expected = bytes([
            0xba, 0x80, 0xa5, 0x3f, 0x98, 0x1c, 0x4d, 0x0d, 0x6a, 0x27, 0x97, 0xb6,
            0x9f, 0x12, 0xf6, 0xe9, 0x4c, 0x21, 0x2f, 0x14, 0x68, 0x5a, 0xc4, 0xb7,
            0x4b, 0x12, 0xbb, 0x6f, 0xdb, 0xff, 0xa2, 0xd1, 0x7d, 0x87, 0xc5, 0x39,
            0x2a, 0xab, 0x79, 0x2d, 0xc2, 0x52, 0xd5, 0xde, 0x45, 0x33, 0xcc, 0x95,
            0x18, 0xd3, 0x8a, 0xa8, 0xdb, 0xf1, 0x92, 0x5a, 0xb9, 0x23, 0x86, 0xed,
            0xd4, 0x00, 0x99, 0x23,
        ])
        assert h == expected

    def test_string_input(self):
        """BLAKE2b accepts string input (UTF-8 encoded)."""
        h1 = blake2b("abc")
        h2 = blake2b(b"abc")
        assert h1 == h2

    def test_deterministic(self):
        """Same input produces same hash."""
        h1 = blake2b(b"test")
        h2 = blake2b(b"test")
        assert h1 == h2

    def test_different_inputs(self):
        """Different inputs produce different hashes."""
        h1 = blake2b(b"hello")
        h2 = blake2b(b"world")
        assert h1 != h2

    def test_single_byte_zero(self):
        """BLAKE2b of single byte 0x00 matches known vector."""
        h = blake2b(bytes([0x00]))
        assert len(h) == 64
        expected = bytes([
            0x2f, 0xa3, 0xf6, 0x86, 0xdf, 0x87, 0x69, 0x95, 0x16, 0x7e, 0x7c, 0x2e,
            0x5d, 0x74, 0xc4, 0xc7, 0xb6, 0xe4, 0x8f, 0x80, 0x68, 0xfe, 0x0e, 0x44,
            0x20, 0x83, 0x44, 0xd4, 0x80, 0xf7, 0x90, 0x4c, 0x36, 0x96, 0x3e, 0x44,
            0x11, 0x5f, 0xe3, 0xeb, 0x2a, 0x3a, 0xc8, 0x69, 0x4c, 0x28, 0xbc, 0xb4,
            0xf5, 0xa0, 0xf3, 0x27, 0x6f, 0x2e, 0x79, 0x48, 0x7d, 0x82, 0x19, 0x05,
            0x7a, 0x50, 0x6e, 0x4b,
        ])
        assert h == expected


class TestRipemd160:
    """Tests for RIPEMD-160 hash function."""

    def test_empty_input(self):
        """RIPEMD160 of empty data matches known constant."""
        h = ripemd160(b"")
        assert len(h) == 20
        # Official RIPEMD160 test vector for empty string
        expected = bytes.fromhex("9c1185a5c5e9fc54612808977ee8f548b2258d31")
        assert h == expected

    def test_single_a(self):
        """RIPEMD160 of 'a' matches known vector."""
        h = ripemd160(b"a")
        assert len(h) == 20
        expected = bytes.fromhex("0bdc9d2d256b3ee9daae347be6f4dc835a467ffe")
        assert h == expected

    def test_abc(self):
        """RIPEMD160 of 'abc' matches known vector."""
        h = ripemd160(b"abc")
        assert len(h) == 20
        expected = bytes.fromhex("8eb208f7e05d987a9b044a8e98c6b087f15a0bfc")
        assert h == expected

    def test_message_digest(self):
        """RIPEMD160 of 'message digest' matches known vector."""
        h = ripemd160(b"message digest")
        assert len(h) == 20
        expected = bytes.fromhex("5d0689ef49d2fae572b881b123a85ffa21595f36")
        assert h == expected

    def test_string_input(self):
        """RIPEMD160 accepts string input (UTF-8 encoded)."""
        h1 = ripemd160("abc")
        h2 = ripemd160(b"abc")
        assert h1 == h2

    def test_deterministic(self):
        """Same input produces same hash."""
        h1 = ripemd160(b"test")
        h2 = ripemd160(b"test")
        assert h1 == h2

    def test_different_inputs(self):
        """Different inputs produce different hashes."""
        h1 = ripemd160(b"hello")
        h2 = ripemd160(b"world")
        assert h1 != h2

    def test_quick_brown_fox(self):
        """RIPEMD160 of quick brown fox matches known vector."""
        h = ripemd160(b"The quick brown fox jumps over the lazy dog")
        assert len(h) == 20
        expected = bytes.fromhex("37f332f68db77bd9d7edd4969571ad671cf9dd3b")
        assert h == expected

    def test_bitcoin_hash160(self):
        """Test hash160 pattern (RIPEMD160(SHA256(data)))."""
        # Compute SHA256 first
        data = b"test"
        sha_hash = sha256(data)
        # Then RIPEMD160
        hash160 = ripemd160(sha_hash.to_bytes())
        assert len(hash160) == 20


class TestSolidityKeccak256:
    """Tests for Solidity-compatible keccak256(abi.encodePacked(...))."""

    def test_empty_parameters(self):
        """Empty parameters produces empty keccak256 hash."""
        from voltaire.hash import solidity_keccak256
        h = solidity_keccak256([], [])
        # keccak256 of empty data
        expected = "0xc5d2460186f7233c927e7db2dcc703c0e500b653ca82273b7bfad8045d85a470"
        assert h.to_hex() == expected

    def test_single_uint8(self):
        """Single uint8 value."""
        from voltaire.hash import solidity_keccak256
        h = solidity_keccak256(["uint8"], [0x42])
        # keccak256(0x42) - single byte
        assert len(h.to_bytes()) == 32

    def test_multiple_uint_types(self):
        """Multiple uint types concatenated compactly."""
        from voltaire.hash import solidity_keccak256
        # uint8 (1 byte) + uint16 (2 bytes) = 3 bytes total packed
        h = solidity_keccak256(["uint8", "uint16"], [0x12, 0x3456])
        # Should hash: 0x123456
        assert len(h.to_bytes()) == 32

    def test_address_type(self):
        """Address type (20 bytes)."""
        from voltaire.hash import solidity_keccak256
        addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
        h = solidity_keccak256(["address"], [addr])
        assert len(h.to_bytes()) == 32

    def test_address_and_uint256(self):
        """Address + uint256 combination."""
        from voltaire.hash import solidity_keccak256
        addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
        amount = 1000
        h = solidity_keccak256(["address", "uint256"], [addr, amount])
        assert len(h.to_bytes()) == 32

    def test_string_type(self):
        """String type (UTF-8 encoded, no length prefix)."""
        from voltaire.hash import solidity_keccak256
        h = solidity_keccak256(["string"], ["hello"])
        # keccak256(0x68656c6c6f) - "hello" in UTF-8
        expected = keccak256("hello")
        assert h == expected

    def test_bytes_type(self):
        """Dynamic bytes type."""
        from voltaire.hash import solidity_keccak256
        h = solidity_keccak256(["bytes"], [b"\x01\x02\x03"])
        expected = keccak256(b"\x01\x02\x03")
        assert h == expected

    def test_bytes32_type(self):
        """Fixed bytes32 type."""
        from voltaire.hash import solidity_keccak256
        data = "0x" + "ff" * 32
        h = solidity_keccak256(["bytes32"], [data])
        assert len(h.to_bytes()) == 32

    def test_bool_type(self):
        """Bool type (1 byte)."""
        from voltaire.hash import solidity_keccak256
        h_true = solidity_keccak256(["bool"], [True])
        h_false = solidity_keccak256(["bool"], [False])
        assert h_true != h_false

    def test_matches_manual_encode_packed(self):
        """Result matches Abi.encode_packed + keccak256."""
        from voltaire.hash import solidity_keccak256
        from voltaire.abi import Abi

        types = ["uint8", "address", "uint256"]
        values = [0x42, "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3", 1000]

        # Manual approach
        packed = Abi.encode_packed(types, values)
        expected = keccak256(packed)

        # Convenience function
        h = solidity_keccak256(types, values)

        assert h == expected

    def test_create2_address_components(self):
        """CREATE2 address derivation pattern."""
        from voltaire.hash import solidity_keccak256

        prefix = 0xff
        deployer = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
        salt = 0x0000000000000000000000000000000000000000000000000000000000000001
        bytecode_hash = "0x" + "aa" * 32

        h = solidity_keccak256(
            ["uint8", "address", "uint256", "bytes32"],
            [prefix, deployer, salt, bytecode_hash]
        )
        assert len(h.to_bytes()) == 32

    def test_deterministic(self):
        """Same inputs produce same hash."""
        from voltaire.hash import solidity_keccak256
        h1 = solidity_keccak256(["uint256"], [42])
        h2 = solidity_keccak256(["uint256"], [42])
        assert h1 == h2

    def test_different_values_different_hashes(self):
        """Different values produce different hashes."""
        from voltaire.hash import solidity_keccak256
        h1 = solidity_keccak256(["uint256"], [1])
        h2 = solidity_keccak256(["uint256"], [2])
        assert h1 != h2

    def test_type_value_count_mismatch(self):
        """Type/value count mismatch raises error."""
        from voltaire.hash import solidity_keccak256
        from voltaire.errors import InvalidInputError

        with pytest.raises(InvalidInputError):
            solidity_keccak256(["uint256", "address"], [42])


class TestSoliditySha256:
    """Tests for Solidity-compatible sha256(abi.encodePacked(...))."""

    def test_empty_parameters(self):
        """Empty parameters produces empty sha256 hash."""
        from voltaire.hash import solidity_sha256
        h = solidity_sha256([], [])
        # sha256 of empty data
        expected = "0xe3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
        assert h.to_hex() == expected

    def test_single_uint8(self):
        """Single uint8 value."""
        from voltaire.hash import solidity_sha256
        h = solidity_sha256(["uint8"], [0x42])
        assert len(h.to_bytes()) == 32

    def test_address_and_uint256(self):
        """Address + uint256 combination."""
        from voltaire.hash import solidity_sha256
        addr = "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"
        amount = 1000
        h = solidity_sha256(["address", "uint256"], [addr, amount])
        assert len(h.to_bytes()) == 32

    def test_string_type(self):
        """String type."""
        from voltaire.hash import solidity_sha256
        h = solidity_sha256(["string"], ["hello"])
        expected = sha256("hello")
        assert h == expected

    def test_matches_manual_encode_packed(self):
        """Result matches Abi.encode_packed + sha256."""
        from voltaire.hash import solidity_sha256
        from voltaire.abi import Abi

        types = ["uint8", "address"]
        values = [0x42, "0x742d35Cc6634C0532925a3b844Bc9e7595f251e3"]

        # Manual approach
        packed = Abi.encode_packed(types, values)
        expected = sha256(packed)

        # Convenience function
        h = solidity_sha256(types, values)

        assert h == expected

    def test_deterministic(self):
        """Same inputs produce same hash."""
        from voltaire.hash import solidity_sha256
        h1 = solidity_sha256(["uint256"], [42])
        h2 = solidity_sha256(["uint256"], [42])
        assert h1 == h2

    def test_type_value_count_mismatch(self):
        """Type/value count mismatch raises error."""
        from voltaire.hash import solidity_sha256
        from voltaire.errors import InvalidInputError

        with pytest.raises(InvalidInputError):
            solidity_sha256(["uint256", "address"], [42])
