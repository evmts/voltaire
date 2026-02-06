//! EIP-7702 Authorization Transaction Example
//!
//! This example demonstrates how to create and work with EIP-7702 authorization transactions,
//! which allow Externally Owned Accounts (EOAs) to temporarily delegate their execution
//! to smart contracts.
//!
//! Key Concepts:
//! - Authorization list for EOA delegation
//! - Signing authorizations with private keys
//! - Multiple authorizations in one transaction
//! - Authority recovery from signatures
//! - Delegation designation and revocation
//! - Gas cost calculation for authorizations

const std = @import("std");
const primitives = @import("primitives");
const crypto_pkg = @import("crypto");

const Transaction = primitives.Transaction;
const Eip7702Transaction = Transaction.Eip7702Transaction;
const Address = primitives.Address.Address;
const AccessListItem = Transaction.AccessListItem;
const Authorization = primitives.Authorization;
const Crypto = crypto_pkg.Crypto;
const hash_mod = crypto_pkg.Hash;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    std.debug.print("\n" ++ "=" ** 80 ++ "\n", .{});
    std.debug.print("  EIP-7702 Authorization Transaction Example\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    // Example 1: Understanding Authorizations
    std.debug.print("1. What are EIP-7702 Authorizations?\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  EIP-7702 allows EOAs to temporarily delegate execution to smart contracts.\n", .{});
    std.debug.print("  An authorization is a signed message that says:\n", .{});
    std.debug.print("    'I (the authority) authorize this EOA to act as this contract'\n", .{});
    std.debug.print("\n", .{});
    std.debug.print("  Authorization structure:\n", .{});
    std.debug.print("    - chain_id: Which chain this authorization is valid on\n", .{});
    std.debug.print("    - address: The contract address to delegate to\n", .{});
    std.debug.print("    - nonce: The nonce of the authority (prevents replay)\n", .{});
    std.debug.print("    - v, r, s: ECDSA signature components\n", .{});
    std.debug.print("\n", .{});

    // Example 2: Creating a Single Authorization
    std.debug.print("2. Creating a Single Authorization\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Private key of the account that will authorize delegation
    const authority_private_key: Crypto.PrivateKey = [_]u8{0x11} ** 32;
    const authority_public_key = try Crypto.unaudited_getPublicKey(authority_private_key);
    const authority_address = authority_public_key.toAddress();

    // The contract to delegate to (e.g., a multisig wallet contract)
    const delegation_contract = try Address.fromHex("0x1234567890123456789012345678901234567890");

    // Create the authorization
    const auth1 = try Authorization.createAuthorization(
        allocator,
        1, // chain_id (Ethereum mainnet)
        delegation_contract,
        0, // nonce
        authority_private_key,
    );

    std.debug.print("  Authority Address: 0x{X}\n", .{authority_address.bytes});
    std.debug.print("  Delegation Contract: 0x{X}\n", .{delegation_contract.bytes});
    std.debug.print("  Chain ID: {}\n", .{auth1.chain_id});
    std.debug.print("  Nonce: {}\n", .{auth1.nonce});
    std.debug.print("  Signature v: {}\n", .{auth1.v});
    std.debug.print("  Signature r: 0x{X}\n", .{auth1.r});
    std.debug.print("  Signature s: 0x{X}\n", .{auth1.s});
    std.debug.print("\n", .{});

    // Validate the authorization
    try auth1.validate();
    std.debug.print("  Authorization is valid!\n", .{});
    std.debug.print("\n", .{});

    // Example 3: Recovering Authority from Authorization
    std.debug.print("3. Recovering Authority from Authorization\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const recovered_authority = try auth1.authority();
    std.debug.print("  Recovered Authority: 0x{X}\n", .{recovered_authority.bytes});

    const matches = std.mem.eql(u8, &authority_address.bytes, &recovered_authority.bytes);
    std.debug.print("  Matches Original Authority: {}\n", .{matches});
    std.debug.print("\n", .{});

    // Example 4: Creating Multiple Authorizations
    std.debug.print("4. Creating Multiple Authorizations in One Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Second authority (different private key)
    const authority2_private_key: Crypto.PrivateKey = [_]u8{0x22} ** 32;
    const authority2_public_key = try Crypto.unaudited_getPublicKey(authority2_private_key);
    const authority2_address = authority2_public_key.toAddress();

    // Different contracts for different purposes
    const wallet_contract = try Address.fromHex("0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA");
    const defi_contract = try Address.fromHex("0xBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB");

    // Create authorizations
    const auth2 = try Authorization.createAuthorization(
        allocator,
        1, // chain_id
        wallet_contract,
        0, // nonce
        authority_private_key,
    );

    const auth3 = try Authorization.createAuthorization(
        allocator,
        1, // chain_id
        defi_contract,
        0, // nonce
        authority2_private_key,
    );

    std.debug.print("  Authorization 1:\n", .{});
    std.debug.print("    Authority: 0x{X}\n", .{authority_address.bytes});
    std.debug.print("    Delegates to: 0x{X}\n", .{wallet_contract.bytes});
    std.debug.print("\n", .{});

    std.debug.print("  Authorization 2:\n", .{});
    std.debug.print("    Authority: 0x{X}\n", .{authority2_address.bytes});
    std.debug.print("    Delegates to: 0x{X}\n", .{defi_contract.bytes});
    std.debug.print("\n", .{});

    // Example 5: Creating an EIP-7702 Transaction
    std.debug.print("5. Creating an EIP-7702 Authorization Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const recipient = try Address.fromHex("0x70997970C51812dc3A010C7d01b50e0d17dc79C8");

    // Build the authorization list
    const auth_list = [_]Authorization{ auth1, auth2, auth3 };

    // Create the unsigned EIP-7702 transaction
    const unsigned_tx = Eip7702Transaction{
        .chain_id = 1, // Ethereum mainnet
        .nonce = 10,
        .max_priority_fee_per_gas = 2_000_000_000, // 2 gwei priority fee
        .max_fee_per_gas = 30_000_000_000, // 30 gwei max fee
        .gas_limit = 150000, // Higher than standard transfer due to authorization processing
        .to = recipient, // Can be null for contract creation
        .value = 0,
        .data = &[_]u8{}, // Could include calldata
        .access_list = &[_]AccessListItem{},
        .authorization_list = &auth_list,
        .v = 0, // Unsigned (will be set during signing)
        .r = [_]u8{0} ** 32,
        .s = [_]u8{0} ** 32,
    };

    std.debug.print("  Transaction Fields:\n", .{});
    std.debug.print("    Chain ID: {}\n", .{unsigned_tx.chain_id});
    std.debug.print("    Nonce: {}\n", .{unsigned_tx.nonce});
    std.debug.print("    To: 0x{X}\n", .{recipient.bytes});
    std.debug.print("    Max Priority Fee: {} gwei\n", .{unsigned_tx.max_priority_fee_per_gas / 1_000_000_000});
    std.debug.print("    Max Fee Per Gas: {} gwei\n", .{unsigned_tx.max_fee_per_gas / 1_000_000_000});
    std.debug.print("    Gas Limit: {}\n", .{unsigned_tx.gas_limit});
    std.debug.print("    Authorization Count: {}\n", .{unsigned_tx.authorization_list.len});
    std.debug.print("\n", .{});

    // Example 6: Calculate Authorization Gas Costs
    std.debug.print("6. Calculating Authorization Gas Costs\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    // Assume 1 empty account for this example
    const empty_accounts: usize = 1;
    const auth_gas_cost = Authorization.calculateAuthorizationGasCost(&auth_list, empty_accounts);

    std.debug.print("  Per authorization base cost: {} gas\n", .{Authorization.PER_AUTH_BASE_COST});
    std.debug.print("  Per empty account cost: {} gas\n", .{Authorization.PER_EMPTY_ACCOUNT_COST});
    std.debug.print("  Number of authorizations: {}\n", .{auth_list.len});
    std.debug.print("  Number of empty accounts: {}\n", .{empty_accounts});
    std.debug.print("  Total authorization gas: {} gas\n", .{auth_gas_cost});
    std.debug.print("\n", .{});

    const base_gas: u64 = 21000; // Standard transaction base
    const estimated_total_gas = base_gas + auth_gas_cost;
    std.debug.print("  Estimated total gas: {} gas\n", .{estimated_total_gas});
    std.debug.print("  (base transaction gas + authorization gas)\n", .{});
    std.debug.print("\n", .{});

    // Example 7: Encode and Sign the Transaction
    std.debug.print("7. Encoding and Signing the Transaction\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const encoded = try Transaction.encodeEip7702ForSigning(allocator, unsigned_tx);
    defer allocator.free(encoded);

    std.debug.print("  Encoded transaction length: {} bytes\n", .{encoded.len});
    std.debug.print("  Transaction type byte: 0x{x:0>2} (EIP-7702)\n", .{encoded[0]});
    std.debug.print("  Encoded (first 64 bytes): 0x{X}\n", .{encoded[0..@min(64, encoded.len)]});
    std.debug.print("\n", .{});

    // Sign the transaction with the sender's private key
    const sender_private_key: Crypto.PrivateKey = [_]u8{0xAA} ** 32;

    const signed_tx = try Transaction.signEip7702Transaction(
        allocator,
        unsigned_tx,
        sender_private_key,
    );

    std.debug.print("  Transaction Signature:\n", .{});
    std.debug.print("    v: {}\n", .{signed_tx.v});
    std.debug.print("    r: 0x{X}\n", .{signed_tx.r});
    std.debug.print("    s: 0x{X}\n", .{signed_tx.s});
    std.debug.print("\n", .{});

    // Example 8: Compute Transaction Hash
    std.debug.print("8. Computing Transaction Hash\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const tx_hash = try Transaction.computeEip7702TransactionHash(allocator, signed_tx);

    std.debug.print("  Transaction Hash: 0x{X}\n", .{tx_hash});
    std.debug.print("  This hash uniquely identifies the EIP-7702 transaction\n", .{});
    std.debug.print("\n", .{});

    // Example 9: Process Authorizations
    std.debug.print("9. Processing Authorizations (Creating Delegations)\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const delegations = try Authorization.processAuthorizations(allocator, &auth_list);
    defer allocator.free(delegations);

    std.debug.print("  Created {} delegation designations:\n", .{delegations.len});
    for (delegations, 0..) |delegation, i| {
        std.debug.print("    Delegation {}:\n", .{i + 1});
        std.debug.print("      Authority: 0x{X}\n", .{delegation.authority.bytes});
        std.debug.print("      Delegated Address: 0x{X}\n", .{delegation.delegated_address.bytes});
        std.debug.print("      Active: {}\n", .{delegation.isActive()});
    }
    std.debug.print("\n", .{});

    // Example 10: Understanding Delegation Revocation
    std.debug.print("10. Delegation Revocation\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Delegations can be revoked by setting delegated_address to zero.\n", .{});
    std.debug.print("\n", .{});

    // Create a mutable copy for demonstration
    var mutable_delegation = Authorization.DelegationDesignation{
        .authority = authority_address,
        .delegated_address = delegation_contract,
    };

    std.debug.print("  Before revocation:\n", .{});
    std.debug.print("    Delegated Address: 0x{X}\n", .{mutable_delegation.delegated_address.bytes});
    std.debug.print("    Is Active: {}\n", .{mutable_delegation.isActive()});
    std.debug.print("\n", .{});

    // Revoke the delegation
    mutable_delegation.revoke();

    std.debug.print("  After revocation:\n", .{});
    std.debug.print("    Delegated Address: 0x{X}\n", .{mutable_delegation.delegated_address.bytes});
    std.debug.print("    Is Active: {}\n", .{mutable_delegation.isActive()});
    std.debug.print("\n", .{});

    // Example 11: Authorization List Encoding
    std.debug.print("11. RLP Encoding Authorization List\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    const encoded_auth_list = try Authorization.encodeAuthorizationList(allocator, &auth_list);
    defer allocator.free(encoded_auth_list);

    std.debug.print("  Encoded authorization list length: {} bytes\n", .{encoded_auth_list.len});
    std.debug.print("  RLP list prefix: 0x{x:0>2}\n", .{encoded_auth_list[0]});
    std.debug.print("  First 32 bytes: 0x{X}\n", .{encoded_auth_list[0..@min(32, encoded_auth_list.len)]});
    std.debug.print("\n", .{});

    // Example 12: Nonce Management
    std.debug.print("12. Nonce Management for Authorizations\n", .{});
    std.debug.print("-" ** 80 ++ "\n", .{});

    std.debug.print("  Each authority can issue multiple authorizations with different nonces.\n", .{});
    std.debug.print("  Nonces prevent replay attacks across different transactions.\n", .{});
    std.debug.print("\n", .{});

    // Create authorizations with different nonces
    const auth_nonce_0 = try Authorization.createAuthorization(
        allocator,
        1,
        delegation_contract,
        0, // First authorization
        authority_private_key,
    );

    const auth_nonce_1 = try Authorization.createAuthorization(
        allocator,
        1,
        delegation_contract,
        1, // Second authorization
        authority_private_key,
    );

    const auth_nonce_100 = try Authorization.createAuthorization(
        allocator,
        1,
        delegation_contract,
        100, // Much later authorization
        authority_private_key,
    );

    std.debug.print("  Authorization with nonce 0: 0x{X}\n", .{(try auth_nonce_0.signingHash())[0..8]});
    std.debug.print("  Authorization with nonce 1: 0x{X}\n", .{(try auth_nonce_1.signingHash())[0..8]});
    std.debug.print("  Authorization with nonce 100: 0x{X}\n", .{(try auth_nonce_100.signingHash())[0..8]});
    std.debug.print("\n", .{});
    std.debug.print("  Different nonces produce different signing hashes.\n", .{});
    std.debug.print("\n", .{});

    std.debug.print("=" ** 80 ++ "\n", .{});
    std.debug.print("  Example Complete!\n", .{});
    std.debug.print("=" ** 80 ++ "\n\n", .{});

    std.debug.print("Key Takeaways:\n", .{});
    std.debug.print("- EIP-7702 enables EOAs to temporarily delegate to smart contracts\n", .{});
    std.debug.print("- Authorizations are signed messages with chain_id, address, and nonce\n", .{});
    std.debug.print("- Multiple authorizations can be included in one transaction\n", .{});
    std.debug.print("- Each authorization has a gas cost (12500 base + 25000 per empty account)\n", .{});
    std.debug.print("- Authority can be recovered from authorization signatures\n", .{});
    std.debug.print("- Delegations can be revoked by setting delegated_address to zero\n", .{});
    std.debug.print("- Transaction type 0x04 indicates EIP-7702 authorization transaction\n", .{});
    std.debug.print("- Nonces prevent replay attacks across different transactions\n", .{});
    std.debug.print("- EIP-7702 transactions can have null 'to' for contract creation\n\n", .{});
}
