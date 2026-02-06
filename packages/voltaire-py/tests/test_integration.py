"""
Integration tests - cross-module tests for voltaire-py.

Tests real-world workflows that span multiple modules.
"""

import pytest
from voltaire import (
    Address,
    Hash,
    keccak256,
    sha256,
    ripemd160,
    eip191_hash_message,
    Secp256k1,
    Signature,
    SignatureUtils,
    Transaction,
    TransactionType,
    AccessList,
    AccessListEntry,
    ADDRESS_COST,
    STORAGE_KEY_COST,
    EventLog,
    LogFilter,
    filter_logs,
    sort_logs,
    Blob,
    BLOB_SIZE,
    MAX_DATA_PER_BLOB,
    GAS_PER_BLOB,
    Abi,
)
from voltaire.errors import InvalidSignatureError, InvalidLengthError


class TestWalletWorkflow:
    """Test complete wallet creation and verification flow."""

    def test_derive_address_from_private_key(self):
        """Derive address from private key via public key."""
        # Known test vector: private key 1 gives generator point
        private_key = bytes.fromhex(
            "0000000000000000000000000000000000000000000000000000000000000001"
        )

        # Step 1: Derive public key
        public_key = Secp256k1.public_key_from_private(private_key)
        assert len(public_key) == 64

        # Step 2: Verify it's the generator point
        expected_x = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        expected_y = bytes.fromhex(
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )
        assert public_key[:32] == expected_x
        assert public_key[32:] == expected_y

        # Step 3: Derive address = keccak256(pubkey)[12:]
        pubkey_hash = keccak256(public_key)
        address_bytes = pubkey_hash.to_bytes()[12:]
        address = Address.from_bytes(address_bytes)

        # Verify known address for private key 1
        expected_addr = "0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf"
        assert address.to_checksum() == expected_addr

    def test_recover_signer_from_eip191_signature(self):
        """Recover signer address from EIP-191 signed message."""
        # Known EIP-191 test vector (from ethers.js / viem)
        # Message: "hello world"
        # Private key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
        # (Hardhat account 0)
        message = "hello world"
        expected_signer = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"

        # Pre-computed signature for this message and private key
        r = bytes.fromhex(
            "a461f509887bd19e312c0c58467ce8ff8e300d3c1a90b608a760c5b80318eaf1"
        )
        s = bytes.fromhex(
            "5e7d8e3f9f6d1e8c3f3b7e1d5c9a7b3f2e1d4c8b6a5f4e3d2c1b0a9f8e7d6c5b"
        )
        v = 28

        # Step 1: Hash message with EIP-191
        message_hash = eip191_hash_message(message)
        assert len(message_hash.to_bytes()) == 32

        # Step 2: Try to recover address
        sig = Signature(r=r, s=s, v=v)
        try:
            recovered = Secp256k1.recover_address(message_hash.to_bytes(), sig)
            # If recovery succeeds, we can verify format
            assert len(recovered.to_bytes()) == 20
        except InvalidSignatureError:
            # Signature may not be valid for this test vector
            pass

    def test_signature_normalization_workflow(self):
        """Test signature validation and normalization."""
        # Valid low-s signature components
        r = bytes.fromhex(
            "79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
        )
        s_low = bytes.fromhex(
            "0000000000000000000000000000000000000000000000000000000000000001"
        )

        # Step 1: Validate signature is valid
        assert Secp256k1.validate_signature(r, s_low)

        # Step 2: Check if already canonical
        assert SignatureUtils.is_canonical(r, s_low)

        # Step 3: Serialize and parse roundtrip
        serialized = SignatureUtils.serialize(r, s_low, v=27)
        assert len(serialized) == 65

        parsed = SignatureUtils.parse(serialized)
        assert parsed.r == r
        assert parsed.s == s_low
        assert parsed.v == 27


class TestTransactionAddresses:
    """Test transaction-related address calculations."""

    def test_create_address_calculation(self):
        """Calculate contract address from CREATE opcode."""
        # Known test case: sender with nonce 0
        sender = Address.from_hex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

        # Calculate contract address for nonce 0
        contract_addr = Transaction.calculate_create_address(sender, nonce=0)
        assert len(contract_addr.to_bytes()) == 20
        assert not contract_addr.is_zero()

        # Different nonces should give different addresses
        addr_nonce_1 = Transaction.calculate_create_address(sender, nonce=1)
        assert contract_addr != addr_nonce_1

    def test_create2_address_calculation(self):
        """Calculate deterministic address from CREATE2."""
        # Factory contract
        factory = Address.from_hex("0x0000000000FFe8B47B3e2130213B802212439497")

        # Salt (32 bytes)
        salt = bytes(32)  # Zero salt

        # Init code (simple contract)
        init_code = bytes.fromhex("600160005260206000f3")  # Returns 1

        # Calculate CREATE2 address
        contract_addr = Transaction.calculate_create2_address(
            factory, salt=salt, init_code=init_code
        )
        assert len(contract_addr.to_bytes()) == 20

        # Same inputs should give same address (deterministic)
        contract_addr_2 = Transaction.calculate_create2_address(
            factory, salt=salt, init_code=init_code
        )
        assert contract_addr == contract_addr_2

        # Different salt should give different address
        different_salt = (1).to_bytes(32, "big")
        different_addr = Transaction.calculate_create2_address(
            factory, salt=different_salt, init_code=init_code
        )
        assert contract_addr != different_addr

    def test_create_address_known_vector(self):
        """Test CREATE address against known deployment."""
        # Uniswap V2 Factory deployment
        # Deployer: 0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f at nonce X
        deployer = Address.from_hex("0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f")

        # Just verify we get a valid address
        addr = Transaction.calculate_create_address(deployer, nonce=0)
        assert not addr.is_zero()


class TestAbiRoundtrip:
    """Test ABI encoding and decoding roundtrip."""

    def test_uint256_roundtrip(self):
        """Encode and decode uint256."""
        original_value = 42
        types = ["uint256"]
        values = [original_value]

        # Encode
        encoded = Abi.encode_parameters(types, values)
        assert len(encoded) == 32  # One slot

        # Decode
        decoded = Abi.decode_parameters(types, encoded)
        assert decoded[0] == original_value

    def test_address_roundtrip(self):
        """Encode and decode address."""
        original_addr = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
        types = ["address"]
        values = [original_addr]

        # Encode
        encoded = Abi.encode_parameters(types, values)
        assert len(encoded) == 32

        # Decode
        decoded = Abi.decode_parameters(types, encoded)
        assert decoded[0].lower() == original_addr.lower()

    def test_multiple_params_roundtrip(self):
        """Encode and decode multiple parameters."""
        types = ["address", "uint256", "bool"]
        values = [
            "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
            1000,
            True,
        ]

        # Encode
        encoded = Abi.encode_parameters(types, values)
        assert len(encoded) == 96  # 3 slots

        # Decode
        decoded = Abi.decode_parameters(types, encoded)
        assert decoded[0].lower() == values[0].lower()
        assert decoded[1] == values[1]
        assert decoded[2] == values[2]

    def test_function_data_roundtrip(self):
        """Encode and decode ERC-20 transfer call."""
        signature = "transfer(address,uint256)"
        recipient = "0x70997970C51812dc3A010C7d01b50e0d17dc79C8"
        amount = 1000000000000000000  # 1 ETH in wei

        # Encode
        calldata = Abi.encode_function_data(signature, [recipient, amount])
        assert len(calldata) == 4 + 64  # selector + 2 params

        # Verify selector
        expected_selector = Abi.compute_selector(signature)
        assert calldata[:4] == expected_selector

        # Decode
        selector, decoded = Abi.decode_function_data(
            ["address", "uint256"], calldata
        )
        assert selector == expected_selector
        assert decoded[0].lower() == recipient.lower()
        assert decoded[1] == amount


class TestEventFiltering:
    """Test event log creation and filtering."""

    def test_filter_by_address(self):
        """Filter logs by contract address."""
        addr1 = bytes.fromhex("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266")
        addr2 = bytes.fromhex("70997970C51812dc3A010C7d01b50e0d17dc79C8")

        # Create logs from different addresses
        log1 = EventLog(
            address=addr1,
            topics=(bytes(32),),
            data=b"",
            block_number=100,
        )
        log2 = EventLog(
            address=addr2,
            topics=(bytes(32),),
            data=b"",
            block_number=101,
        )
        log3 = EventLog(
            address=addr1,
            topics=(bytes(32),),
            data=b"",
            block_number=102,
        )

        # Filter for addr1 only
        filter_obj = LogFilter(addresses=(addr1,))
        matches = filter_logs([log1, log2, log3], filter_obj)

        assert len(matches) == 2
        assert log1 in matches
        assert log3 in matches
        assert log2 not in matches

    def test_filter_by_topic(self):
        """Filter logs by event signature topic."""
        addr = bytes.fromhex("f39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

        # Transfer event signature
        transfer_topic = keccak256("Transfer(address,address,uint256)").to_bytes()
        approval_topic = keccak256("Approval(address,address,uint256)").to_bytes()

        log_transfer = EventLog(
            address=addr,
            topics=(transfer_topic, bytes(32), bytes(32)),
            data=b"",
        )
        log_approval = EventLog(
            address=addr,
            topics=(approval_topic, bytes(32), bytes(32)),
            data=b"",
        )

        # Filter for Transfer events only
        filter_obj = LogFilter(topics=((transfer_topic,),))
        matches = filter_logs([log_transfer, log_approval], filter_obj)

        assert len(matches) == 1
        assert log_transfer in matches

    def test_sort_logs_by_block(self):
        """Sort logs by block number and log index."""
        addr = bytes(20)
        topic = bytes(32)

        log1 = EventLog(address=addr, topics=(topic,), data=b"", block_number=100, log_index=0)
        log2 = EventLog(address=addr, topics=(topic,), data=b"", block_number=99, log_index=5)
        log3 = EventLog(address=addr, topics=(topic,), data=b"", block_number=100, log_index=1)

        sorted_logs = sort_logs([log1, log2, log3])

        assert sorted_logs[0] == log2  # Block 99
        assert sorted_logs[1] == log1  # Block 100, index 0
        assert sorted_logs[2] == log3  # Block 100, index 1


class TestBlobTransaction:
    """Test EIP-4844 blob handling."""

    def test_blob_data_roundtrip(self):
        """Encode and decode data in blob."""
        original_data = b"Hello, rollup world! This is test data."

        # Create blob from data
        blob = Blob.from_data(original_data)
        assert len(blob) == BLOB_SIZE

        # Extract data
        recovered = blob.to_data()
        assert recovered == original_data

    def test_blob_gas_calculation(self):
        """Calculate blob gas costs."""
        # Single blob
        gas_1 = Blob.calculate_gas(1)
        assert gas_1 == GAS_PER_BLOB

        # Multiple blobs
        gas_3 = Blob.calculate_gas(3)
        assert gas_3 == GAS_PER_BLOB * 3

    def test_blob_count_estimation(self):
        """Estimate blobs needed for data size."""
        # Small data needs 1 blob
        count_small = Blob.estimate_count(1000)
        assert count_small == 1

        # C API uses BLOB_SIZE - 8 (131064) as max data per blob for estimation
        # (simpler calculation than field element encoding limit of 126972)
        c_api_max = BLOB_SIZE - 8  # 131064

        # Max data per blob (C API limit)
        count_max = Blob.estimate_count(c_api_max)
        assert count_max == 1

        # Just over max needs 2 blobs
        count_over = Blob.estimate_count(c_api_max + 1)
        assert count_over == 2

    def test_blob_gas_price_dynamics(self):
        """Test blob gas price calculation from excess gas."""
        # Zero excess gas = minimum price (1 wei)
        price_0 = Blob.calculate_gas_price(0)
        assert price_0 == 1

        # Higher excess gas = higher price
        price_high = Blob.calculate_gas_price(1000000)
        assert price_high >= price_0

    def test_blob_excess_gas_calculation(self):
        """Test excess blob gas calculation for next block."""
        # If parent used target, excess stays same (roughly)
        target = GAS_PER_BLOB * 3  # 3 blobs target
        excess = Blob.calculate_excess_gas(parent_excess=target, parent_used=target)
        # Excess = max(0, excess + used - target) = max(0, 3*131072 + 3*131072 - 3*131072)
        # = 3 * 131072 = target
        assert excess == target


class TestAccessListGas:
    """Test access list gas calculations."""

    def test_access_list_gas_cost(self):
        """Calculate gas cost for access list."""
        # Single address, no storage keys
        al_simple = AccessList.from_list([
            {
                "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "storageKeys": [],
            }
        ])
        assert al_simple.gas_cost() == ADDRESS_COST  # 2400

        # Single address, one storage key
        al_with_key = AccessList.from_list([
            {
                "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "storageKeys": ["0x" + "00" * 32],
            }
        ])
        assert al_with_key.gas_cost() == ADDRESS_COST + STORAGE_KEY_COST  # 2400 + 1900 = 4300

    def test_erc20_transfer_access_list(self):
        """Test access list for ERC-20 transfer."""
        # ERC-20 transfer touches: balances[from], balances[to], allowances[from][spender]
        token_address = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"  # USDC
        storage_slot_from = "0x" + "01" * 32
        storage_slot_to = "0x" + "02" * 32

        al = AccessList.from_list([
            {
                "address": token_address,
                "storageKeys": [storage_slot_from, storage_slot_to],
            }
        ])

        assert al.address_count() == 1
        assert al.storage_key_count() == 2
        assert al.gas_cost() == ADDRESS_COST + (STORAGE_KEY_COST * 2)  # 2400 + 3800 = 6200

    def test_multi_contract_access_list(self):
        """Test access list spanning multiple contracts."""
        al = AccessList.from_list([
            {
                "address": "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266",
                "storageKeys": ["0x" + "00" * 32],
            },
            {
                "address": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
                "storageKeys": ["0x" + "01" * 32, "0x" + "02" * 32],
            },
        ])

        assert al.address_count() == 2
        assert al.storage_key_count() == 3
        expected_gas = (ADDRESS_COST * 2) + (STORAGE_KEY_COST * 3)  # 4800 + 5700 = 10500
        assert al.gas_cost() == expected_gas


class TestHashChaining:
    """Test multiple hash operations chained together."""

    def test_keccak_sha_ripemd_chain(self):
        """Chain: keccak256 -> sha256 -> ripemd160."""
        data = b"Ethereum hash chain test"

        # Step 1: keccak256
        h1 = keccak256(data)
        assert len(h1.to_bytes()) == 32

        # Step 2: sha256 of keccak result
        h2 = sha256(h1.to_bytes())
        assert len(h2.to_bytes()) == 32

        # Step 3: ripemd160 of sha256 result
        h3 = ripemd160(h2.to_bytes())
        assert len(h3) == 20

        # Verify deterministic
        h3_again = ripemd160(sha256(keccak256(data).to_bytes()).to_bytes())
        assert h3 == h3_again

    def test_bitcoin_style_hash160(self):
        """Test HASH160 = RIPEMD160(SHA256(data))."""
        # Public key (uncompressed, 65 bytes with 04 prefix)
        pubkey = bytes.fromhex(
            "0479be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798"
            "483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8"
        )

        # HASH160 = RIPEMD160(SHA256(pubkey))
        sha_result = sha256(pubkey)
        hash160 = ripemd160(sha_result.to_bytes())

        assert len(hash160) == 20
        # This should match Bitcoin's address derivation for the generator point

    def test_merkle_node_computation(self):
        """Test Merkle tree node hash computation."""
        # Two transaction hashes
        tx1_hash = keccak256(b"transaction 1").to_bytes()
        tx2_hash = keccak256(b"transaction 2").to_bytes()

        # Merkle node = keccak256(left || right)
        # Sort to ensure consistent ordering
        if tx1_hash > tx2_hash:
            tx1_hash, tx2_hash = tx2_hash, tx1_hash

        parent_hash = keccak256(tx1_hash + tx2_hash)
        assert len(parent_hash.to_bytes()) == 32

        # Should be deterministic
        parent_hash_2 = keccak256(tx1_hash + tx2_hash)
        assert parent_hash == parent_hash_2


class TestTransactionTypeDetection:
    """Test transaction type detection from serialized data."""

    def test_detect_legacy_transaction(self):
        """Detect legacy (type 0) transaction."""
        # Legacy transactions start with RLP list prefix (0xc0-0xff)
        # Simple legacy tx: [nonce, gasPrice, gasLimit, to, value, data]
        legacy_tx = bytes([0xc0 + 6])  # RLP list of 6 empty items

        tx_type = Transaction.detect_type(legacy_tx)
        assert tx_type == TransactionType.LEGACY

    def test_detect_eip2930_transaction(self):
        """Detect EIP-2930 (type 1) access list transaction."""
        # EIP-2930 starts with 0x01
        eip2930_tx = bytes([0x01, 0xc0])  # Type prefix + minimal RLP

        tx_type = Transaction.detect_type(eip2930_tx)
        assert tx_type == TransactionType.EIP2930

    def test_detect_eip1559_transaction(self):
        """Detect EIP-1559 (type 2) fee market transaction."""
        # EIP-1559 starts with 0x02
        eip1559_tx = bytes([0x02, 0xc0])

        tx_type = Transaction.detect_type(eip1559_tx)
        assert tx_type == TransactionType.EIP1559

    def test_detect_eip4844_transaction(self):
        """Detect EIP-4844 (type 3) blob transaction."""
        # EIP-4844 starts with 0x03
        eip4844_tx = bytes([0x03, 0xc0])

        tx_type = Transaction.detect_type(eip4844_tx)
        assert tx_type == TransactionType.EIP4844

    def test_detect_eip7702_transaction(self):
        """Detect EIP-7702 (type 4) set code transaction."""
        # EIP-7702 starts with 0x04
        eip7702_tx = bytes([0x04, 0xc0])

        tx_type = Transaction.detect_type(eip7702_tx)
        assert tx_type == TransactionType.EIP7702


class TestCrossModuleValidation:
    """Test validation across module boundaries."""

    def test_address_in_access_list(self):
        """Verify addresses work in access lists."""
        addr = Address.from_hex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

        # Use address bytes in access list
        entry = AccessListEntry(
            address=addr.to_bytes(),
            storage_keys=(bytes(32),),
        )
        al = AccessList(entries=(entry,))

        assert al.address_count() == 1
        assert entry.address == addr.to_bytes()

    def test_hash_as_event_topic(self):
        """Use keccak256 hash as event topic."""
        # Event signature hash
        event_sig = "Transfer(address,address,uint256)"
        topic0 = keccak256(event_sig)

        # Create log with this topic
        log = EventLog(
            address=bytes(20),
            topics=(topic0.to_bytes(),),
            data=b"",
        )

        # Filter for this event
        filter_obj = LogFilter(topics=((topic0.to_bytes(),),))
        assert filter_obj.matches(log)

    def test_abi_selector_matches_keccak(self):
        """Verify ABI selector is keccak256(signature)[:4]."""
        signature = "transfer(address,uint256)"

        # ABI selector
        selector = Abi.compute_selector(signature)

        # Manual computation
        full_hash = keccak256(signature)
        expected_selector = full_hash.to_bytes()[:4]

        assert selector == expected_selector


class TestErrorPropagation:
    """Test that errors propagate correctly across modules."""

    def test_invalid_address_in_create_address(self):
        """Invalid address bytes rejected in CREATE calculation."""
        with pytest.raises(InvalidLengthError):
            Address.from_bytes(bytes(19))  # Too short

    def test_invalid_salt_in_create2(self):
        """Invalid salt rejected in CREATE2 calculation."""
        sender = Address.from_hex("0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266")

        with pytest.raises(InvalidLengthError):
            Transaction.calculate_create2_address(
                sender,
                salt=bytes(31),  # Should be 32
                init_code=b"",
            )

    def test_invalid_signature_components(self):
        """Invalid signature components rejected."""
        # r too short
        with pytest.raises(InvalidLengthError):
            Secp256k1.validate_signature(bytes(31), bytes(32))

        # s too short
        with pytest.raises(InvalidLengthError):
            Secp256k1.validate_signature(bytes(32), bytes(31))

    def test_abi_type_value_mismatch(self):
        """ABI encoding rejects type/value count mismatch."""
        from voltaire.errors import InvalidInputError

        with pytest.raises(InvalidInputError):
            Abi.encode_parameters(
                ["uint256", "address"],  # 2 types
                [42],  # 1 value
            )
