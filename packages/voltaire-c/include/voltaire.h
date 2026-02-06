/**
 * Voltaire C API
 *
 * Ethereum primitives and cryptography exported from Zig.
 *
 * Build:
 *   zig build build-ts-native
 *
 * Link:
 *   gcc your_program.c -L./zig-out/lib -lprimitives -o your_program
 */

#ifndef VOLTAIRE_H
#define VOLTAIRE_H

#include <stddef.h>
#include <stdint.h>
#include <stdbool.h>

#ifdef __cplusplus
extern "C" {
#endif

/* ============================================================================
 * Primitives Error Codes
 * ========================================================================= */

#define PRIMITIVES_SUCCESS              0
#define PRIMITIVES_ERROR_INVALID_HEX    -1
#define PRIMITIVES_ERROR_INVALID_LENGTH -2
#define PRIMITIVES_ERROR_INVALID_CHECKSUM -3
#define PRIMITIVES_ERROR_OUT_OF_MEMORY  -4
#define PRIMITIVES_ERROR_INVALID_INPUT  -5
#define PRIMITIVES_ERROR_INVALID_SIGNATURE -6
#define PRIMITIVES_ERROR_INVALID_SELECTOR -7
#define PRIMITIVES_ERROR_UNSUPPORTED_TYPE -8
#define PRIMITIVES_ERROR_MAX_LENGTH_EXCEEDED -9
#define PRIMITIVES_ERROR_ACCESS_LIST_INVALID -10
#define PRIMITIVES_ERROR_AUTHORIZATION_INVALID -11
#define PRIMITIVES_ERROR_KZG_NOT_LOADED -20
#define PRIMITIVES_ERROR_KZG_INVALID_BLOB -21
#define PRIMITIVES_ERROR_KZG_INVALID_PROOF -22

/* ============================================================================
 * State Manager Error Codes
 * ========================================================================= */

#define STATE_MANAGER_SUCCESS              0
#define STATE_MANAGER_ERROR_INVALID_INPUT  -1
#define STATE_MANAGER_ERROR_OUT_OF_MEMORY  -2
#define STATE_MANAGER_ERROR_INVALID_SNAPSHOT -3
#define STATE_MANAGER_ERROR_RPC_FAILED     -4
#define STATE_MANAGER_ERROR_INVALID_HEX    -5
#define STATE_MANAGER_ERROR_RPC_PENDING    -6
#define STATE_MANAGER_ERROR_NO_PENDING_REQUEST -7
#define STATE_MANAGER_ERROR_OUTPUT_TOO_SMALL -8
#define STATE_MANAGER_ERROR_INVALID_REQUEST -9

/* ============================================================================
 * Blockchain Error Codes
 * ========================================================================= */

#define BLOCKCHAIN_SUCCESS               0
#define BLOCKCHAIN_ERROR_INVALID_INPUT   -1
#define BLOCKCHAIN_ERROR_OUT_OF_MEMORY   -2
#define BLOCKCHAIN_ERROR_BLOCK_NOT_FOUND -3
#define BLOCKCHAIN_ERROR_INVALID_PARENT  -4
#define BLOCKCHAIN_ERROR_ORPHAN_HEAD     -5
#define BLOCKCHAIN_ERROR_INVALID_HASH    -6
#define BLOCKCHAIN_ERROR_RPC_PENDING     -7
#define BLOCKCHAIN_ERROR_NO_PENDING_REQUEST -8
#define BLOCKCHAIN_ERROR_OUTPUT_TOO_SMALL -9
#define BLOCKCHAIN_ERROR_INVALID_REQUEST -10
#define BLOCKCHAIN_ERROR_NOT_IMPLEMENTED -999

/* ============================================================================
 * Types
 * ========================================================================= */

typedef struct {
    unsigned char bytes[20];
} PrimitivesAddress;

typedef struct {
    unsigned char bytes[32];
} PrimitivesHash;

typedef struct {
    unsigned char bytes[32];
} PrimitivesU256;

typedef struct {
    unsigned char r[32];
    unsigned char s[32];
    unsigned char v;
} PrimitivesSignature;

typedef struct {
    PrimitivesAddress address;
    const PrimitivesHash* storage_keys_ptr;
    size_t storage_keys_len;
} PrimitivesAccessListEntry;

typedef struct {
    uint64_t chain_id;
    PrimitivesAddress address;
    uint64_t nonce;
    uint64_t v;
    unsigned char r[32];
    unsigned char s[32];
} PrimitivesAuthorization;

/* Opaque handle types */
typedef void* StateManagerHandle;
typedef void* ForkBackendHandle;
typedef void* BlockchainHandle;
typedef void* ForkBlockCacheHandle;

/* ============================================================================
 * Address API
 * ========================================================================= */

int primitives_address_from_hex(const char* hex, PrimitivesAddress* out);
int primitives_address_to_hex(const PrimitivesAddress* address, unsigned char* buf);
int primitives_address_to_checksum_hex(const PrimitivesAddress* address, unsigned char* buf);
bool primitives_address_is_zero(const PrimitivesAddress* address);
bool primitives_address_equals(const PrimitivesAddress* a, const PrimitivesAddress* b);
bool primitives_address_validate_checksum(const char* hex);
int primitives_calculate_create_address(const PrimitivesAddress* sender, uint64_t nonce, PrimitivesAddress* out);
int primitives_calculate_create2_address(const PrimitivesAddress* sender, const unsigned char salt[32], const unsigned char* init_code, size_t init_code_len, PrimitivesAddress* out);

/* ============================================================================
 * Hash API
 * ========================================================================= */

int primitives_keccak256(const unsigned char* data, size_t data_len, PrimitivesHash* out_hash);
int primitives_hash_to_hex(const PrimitivesHash* hash, unsigned char* buf);
int primitives_hash_from_hex(const char* hex, PrimitivesHash* out_hash);
bool primitives_hash_equals(const PrimitivesHash* a, const PrimitivesHash* b);
int primitives_eip191_hash_message(const unsigned char* message, size_t message_len, PrimitivesHash* out_hash);
int primitives_sha256(const unsigned char* data, size_t data_len, unsigned char out_hash[32]);
int primitives_ripemd160(const unsigned char* data, size_t data_len, unsigned char out_hash[20]);
int primitives_blake2b(const unsigned char* data, size_t data_len, unsigned char out_hash[64]);
int primitives_solidity_keccak256(const unsigned char* packed_data, size_t data_len, PrimitivesHash* out_hash);
int primitives_solidity_sha256(const unsigned char* packed_data, size_t data_len, unsigned char out_hash[32]);

/* ============================================================================
 * Hex API
 * ========================================================================= */

int primitives_hex_to_bytes(const char* hex, unsigned char* out_buf, size_t buf_len);
int primitives_bytes_to_hex(const unsigned char* data, size_t data_len, unsigned char* out_buf, size_t buf_len);
int primitives_u256_from_hex(const char* hex, PrimitivesU256* out_u256);
int primitives_u256_to_hex(const PrimitivesU256* value, unsigned char* buf, size_t buf_len);

/* ============================================================================
 * secp256k1 API
 * ========================================================================= */

int primitives_secp256k1_recover_pubkey(const unsigned char message_hash[32], const unsigned char r[32], const unsigned char s[32], unsigned char v, unsigned char out_pubkey[64]);
int primitives_secp256k1_recover_address(const unsigned char message_hash[32], const unsigned char r[32], const unsigned char s[32], unsigned char v, PrimitivesAddress* out_address);
int primitives_secp256k1_pubkey_from_private(const unsigned char private_key[32], unsigned char out_pubkey[64]);
bool primitives_secp256k1_validate_signature(const unsigned char r[32], const unsigned char s[32]);
int secp256k1Sign(const unsigned char* msgHash_ptr, const unsigned char* privKey_ptr, unsigned char* sig_ptr, unsigned char* recid_ptr);
int secp256k1Verify(const unsigned char* msgHash_ptr, const unsigned char* sig_ptr, const unsigned char* pubKey_ptr);
int secp256k1Recover(const unsigned char* msgHash_ptr, const unsigned char* sig_ptr, unsigned char recid, unsigned char* pubKey_ptr);
int secp256k1DerivePublicKey(const unsigned char* privKey_ptr, unsigned char* pubKey_ptr);

/* ============================================================================
 * Signature API
 * ========================================================================= */

bool primitives_signature_normalize(unsigned char r[32], unsigned char s[32]);
bool primitives_signature_is_canonical(const unsigned char r[32], const unsigned char s[32]);
int primitives_signature_parse(const unsigned char* sig_data, size_t sig_len, unsigned char out_r[32], unsigned char out_s[32], unsigned char* out_v);
int primitives_signature_serialize(const unsigned char r[32], const unsigned char s[32], unsigned char v, bool include_v, unsigned char* out_buf);
int primitives_generate_private_key(unsigned char out_private_key[32]);
int primitives_compress_public_key(const unsigned char uncompressed[64], unsigned char out_compressed[33]);

/* ============================================================================
 * RLP API
 * ========================================================================= */

int primitives_rlp_encode_bytes(const unsigned char* data, size_t data_len, unsigned char* out_buf, size_t buf_len);
int primitives_rlp_encode_uint(const unsigned char value_bytes[32], unsigned char* out_buf, size_t buf_len);
int primitives_rlp_to_hex(const unsigned char* rlp_data, size_t rlp_len, unsigned char* out_buf, size_t buf_len);
int primitives_rlp_from_hex(const char* hex, unsigned char* out_buf, size_t buf_len);

/* ============================================================================
 * ABI API
 * ========================================================================= */

int primitives_abi_compute_selector(const char* signature, unsigned char out_selector[4]);
int primitives_abi_encode_parameters(const char* types_json, const char* values_json, unsigned char* out_buf, size_t buf_len);
int primitives_abi_decode_parameters(const unsigned char* data, size_t data_len, const char* types_json, unsigned char* out_buf, size_t buf_len);
int primitives_abi_encode_function_data(const char* signature, const char* types_json, const char* values_json, unsigned char* out_buf, size_t buf_len);
int primitives_abi_decode_function_data(const unsigned char* data, size_t data_len, const char* types_json, unsigned char out_selector[4], unsigned char* out_buf, size_t buf_len);
int primitives_abi_encode_packed(const char* types_json, const char* values_json, unsigned char* out_buf, size_t buf_len);
long long primitives_abi_estimate_gas(const unsigned char* data, size_t data_len);

/* ============================================================================
 * Transaction API
 * ========================================================================= */

int primitives_tx_detect_type(const unsigned char* data, size_t data_len);

/* ============================================================================
 * Blob API (EIP-4844)
 * ========================================================================= */

#define BYTES_PER_BLOB 131072
#define BLOB_GAS_PER_BLOB 131072

int primitives_blob_from_data(const unsigned char* data, size_t data_len, unsigned char out_blob[131072]);
int primitives_blob_to_data(const unsigned char blob[131072], unsigned char* out_data, size_t* out_len);
int primitives_blob_is_valid(size_t blob_len);
uint64_t primitives_blob_calculate_gas(uint32_t blob_count);
uint32_t primitives_blob_estimate_count(size_t data_size);
uint64_t primitives_blob_calculate_gas_price(uint64_t excess_blob_gas);
uint64_t primitives_blob_calculate_excess_gas(uint64_t parent_excess, uint64_t parent_used);

/* ============================================================================
 * KZG API
 * ========================================================================= */

#define KZG_BLOB_SIZE 131072
#define KZG_COMMITMENT_SIZE 48
#define KZG_PROOF_SIZE 48

int kzg_load_trusted_setup(void);
int kzg_free_trusted_setup(void);
int kzg_blob_to_commitment(const unsigned char blob[131072], unsigned char out_commitment[48]);
int kzg_compute_proof(const unsigned char blob[131072], const unsigned char z[32], unsigned char out_proof[48], unsigned char out_y[32]);
int kzg_compute_blob_proof(const unsigned char blob[131072], const unsigned char commitment[48], unsigned char out_proof[48]);
int kzg_verify_proof(const unsigned char commitment[48], const unsigned char z[32], const unsigned char y[32], const unsigned char proof[48]);
int kzg_verify_blob_proof(const unsigned char blob[131072], const unsigned char commitment[48], const unsigned char proof[48]);

/* ============================================================================
 * Bytecode API
 * ========================================================================= */

int primitives_bytecode_analyze_jumpdests(const unsigned char* code, size_t code_len, uint32_t* out_jumpdests, size_t max_jumpdests);
bool primitives_bytecode_is_boundary(const unsigned char* code, size_t code_len, uint32_t position);
bool primitives_bytecode_is_valid_jumpdest(const unsigned char* code, size_t code_len, uint32_t position);
int primitives_bytecode_validate(const unsigned char* code, size_t code_len);
int64_t primitives_bytecode_get_next_pc(const unsigned char* code, size_t code_len, uint32_t current_pc);
int primitives_bytecode_scan(const unsigned char* code, size_t code_len, uint32_t start_pc, uint32_t end_pc, unsigned char* out_instructions, size_t* out_len);
int primitives_bytecode_detect_fusions(const unsigned char* code, size_t code_len, unsigned char* out_fusions, size_t* out_len);

/* ============================================================================
 * Access List API (EIP-2930)
 * ========================================================================= */

#define ACCESS_LIST_ADDRESS_COST 2400
#define ACCESS_LIST_STORAGE_KEY_COST 1900

int primitives_access_list_gas_cost(const PrimitivesAccessListEntry* entries, size_t entries_len, uint64_t* out_cost);

/* ============================================================================
 * Authorization API (EIP-7702)
 * ========================================================================= */

int primitives_authorization_validate(const PrimitivesAuthorization* auth);
int primitives_authorization_signing_hash(uint64_t chain_id, const PrimitivesAddress* address, uint64_t nonce, PrimitivesHash* out_hash);
int primitives_authorization_authority(const PrimitivesAuthorization* auth, PrimitivesAddress* out_address);
uint64_t primitives_authorization_gas_cost(size_t count, size_t empty_accounts);

/* ============================================================================
 * Event Log API
 * ========================================================================= */

int primitives_eventlog_matches_address(const unsigned char log_address[20], const unsigned char (*filter_addresses)[20], size_t filter_count);
int primitives_eventlog_matches_topic(const unsigned char log_topic[32], const unsigned char filter_topic[32], int null_topic);
int primitives_eventlog_matches_topics(const unsigned char (*log_topics)[32], size_t log_topic_count, const unsigned char (*filter_topics)[32], const int* filter_nulls, size_t filter_count);

/* ============================================================================
 * Ed25519 API
 * ========================================================================= */

int ed25519Sign(const unsigned char* message, size_t message_len, const unsigned char secret_key[64], unsigned char out_signature[64]);
int ed25519Verify(const unsigned char* message, size_t message_len, const unsigned char signature[64], const unsigned char public_key[32]);
int ed25519DerivePublicKey(const unsigned char secret_key[64], unsigned char out_public_key[32]);

/* ============================================================================
 * P256 API
 * ========================================================================= */

int p256Sign(const unsigned char hash[32], const unsigned char private_key[32], unsigned char out_signature[64]);
int p256Verify(const unsigned char hash[32], const unsigned char signature[64], const unsigned char public_key[64]);
int p256DerivePublicKey(const unsigned char private_key[32], unsigned char out_public_key[64]);
int p256Ecdh(const unsigned char private_key[32], const unsigned char public_key[64], unsigned char out_shared[32]);

/* ============================================================================
 * X25519 API
 * ========================================================================= */

int x25519DerivePublicKey(const unsigned char secret[32], unsigned char out_public[32]);
int x25519Scalarmult(const unsigned char secret[32], const unsigned char public_key[32], unsigned char out_shared[32]);
int x25519KeypairFromSeed(const unsigned char seed[32], unsigned char out_secret[32], unsigned char out_public[32]);

/* ============================================================================
 * AES-GCM API
 * ========================================================================= */

int aesGcm128Encrypt(const unsigned char* plaintext, size_t plaintext_len, const unsigned char key[16], const unsigned char nonce[12], const unsigned char* additional_data, size_t ad_len, unsigned char* out);
int aesGcm128Decrypt(const unsigned char* ciphertext, size_t ciphertext_len, const unsigned char key[16], const unsigned char nonce[12], const unsigned char* additional_data, size_t ad_len, unsigned char* out);
int aesGcm256Encrypt(const unsigned char* plaintext, size_t plaintext_len, const unsigned char key[32], const unsigned char nonce[12], const unsigned char* additional_data, size_t ad_len, unsigned char* out);
int aesGcm256Decrypt(const unsigned char* ciphertext, size_t ciphertext_len, const unsigned char key[32], const unsigned char nonce[12], const unsigned char* additional_data, size_t ad_len, unsigned char* out);

/* ============================================================================
 * HD Wallet API (BIP-32/39)
 * ========================================================================= */

int hdwallet_generate_mnemonic(const unsigned char* entropy, size_t entropy_len, unsigned char* out_mnemonic, size_t out_len);
int hdwallet_validate_mnemonic(const char* mnemonic);
int hdwallet_mnemonic_to_seed(const char* mnemonic, const char* passphrase, unsigned char out_seed[64]);
size_t hdwallet_from_seed(const unsigned char* seed, size_t seed_len);
size_t hdwallet_derive(size_t hdkey_handle, const uint32_t* path, size_t path_len);
int hdwallet_get_private_key(size_t hdkey_handle, unsigned char out_private_key[32]);
int hdwallet_get_public_key(size_t hdkey_handle, unsigned char out_public_key[33]);
int hdwallet_get_address(size_t hdkey_handle, PrimitivesAddress* out_address);
int hdwallet_free(size_t hdkey_handle);

/* ============================================================================
 * State Manager API
 * ========================================================================= */

/* Lifecycle */
StateManagerHandle state_manager_create(void);
StateManagerHandle state_manager_create_with_fork(ForkBackendHandle fork_backend);
void state_manager_destroy(StateManagerHandle handle);

/* Fork Backend */
ForkBackendHandle fork_backend_create(void* rpc_client_ptr, void* rpc_vtable, const char* block_tag, size_t max_cache_size);
void fork_backend_destroy(ForkBackendHandle handle);
void fork_backend_clear_cache(ForkBackendHandle handle);
int fork_backend_next_request(ForkBackendHandle handle, uint64_t* out_request_id, unsigned char* out_method, size_t method_buf_len, size_t* out_method_len, unsigned char* out_params, size_t params_buf_len, size_t* out_params_len);
int fork_backend_continue(ForkBackendHandle handle, uint64_t request_id, const unsigned char* response, size_t response_len);

/* Balance */
int state_manager_get_balance_sync(StateManagerHandle handle, const char* address_hex, unsigned char* out_buffer, size_t buffer_len);
int state_manager_set_balance(StateManagerHandle handle, const char* address_hex, const char* balance_hex);

/* Nonce */
int state_manager_get_nonce_sync(StateManagerHandle handle, const char* address_hex, uint64_t* out_nonce);
int state_manager_set_nonce(StateManagerHandle handle, const char* address_hex, uint64_t nonce);

/* Storage */
int state_manager_get_storage_sync(StateManagerHandle handle, const char* address_hex, const char* slot_hex, unsigned char* out_buffer, size_t buffer_len);
int state_manager_set_storage(StateManagerHandle handle, const char* address_hex, const char* slot_hex, const char* value_hex);

/* Code */
int state_manager_get_code_len_sync(StateManagerHandle handle, const char* address_hex, size_t* out_len);
int state_manager_get_code_sync(StateManagerHandle handle, const char* address_hex, unsigned char* out_buffer, size_t buffer_len);
int state_manager_set_code(StateManagerHandle handle, const char* address_hex, const unsigned char* code, size_t code_len);

/* Checkpoint/Revert */
int state_manager_checkpoint(StateManagerHandle handle);
void state_manager_revert(StateManagerHandle handle);
void state_manager_commit(StateManagerHandle handle);

/* Snapshots */
int state_manager_snapshot(StateManagerHandle handle, uint64_t* out_snapshot_id);
int state_manager_revert_to_snapshot(StateManagerHandle handle, uint64_t snapshot_id);

/* Cache */
void state_manager_clear_caches(StateManagerHandle handle);
void state_manager_clear_fork_cache(StateManagerHandle handle);

/* Mock Data (Testing) */
void mock_data_load(uint32_t num_accounts, uint32_t num_blocks, uint64_t fork_block_number, const unsigned char* data, size_t data_len);
void mock_data_clear(void);

/* ============================================================================
 * Blockchain API
 * ========================================================================= */

/* Lifecycle */
BlockchainHandle blockchain_create(void);
BlockchainHandle blockchain_create_with_fork(ForkBlockCacheHandle fork_cache);
void blockchain_destroy(BlockchainHandle handle);

/* Chain Info */
size_t blockchain_local_block_count(BlockchainHandle handle);
size_t blockchain_canonical_chain_length(BlockchainHandle handle);
size_t blockchain_orphan_count(BlockchainHandle handle);
int blockchain_get_head_block_number(BlockchainHandle handle, uint64_t* out_number);
bool blockchain_is_fork_block(BlockchainHandle handle, uint64_t number);

/* Block Operations */
int blockchain_get_block_by_number(BlockchainHandle handle, uint64_t number, unsigned char* out_block);
int blockchain_get_block_by_hash(BlockchainHandle handle, const unsigned char block_hash[32], unsigned char* out_block);
bool blockchain_has_block(BlockchainHandle handle, const unsigned char block_hash[32]);
int blockchain_get_canonical_hash(BlockchainHandle handle, uint64_t number, unsigned char out_hash[32]);
int blockchain_put_block(BlockchainHandle handle, const unsigned char* block_data);
int blockchain_set_canonical_head(BlockchainHandle handle, const unsigned char block_hash[32]);

/* Fork Block Cache */
ForkBlockCacheHandle fork_block_cache_create(size_t rpc_context, size_t vtable_fetch_by_number, size_t vtable_fetch_by_hash, uint64_t fork_block_number);
void fork_block_cache_destroy(ForkBlockCacheHandle handle);
int fork_block_cache_next_request(ForkBlockCacheHandle handle, uint64_t* out_request_id, unsigned char* out_method, size_t method_buf_len, size_t* out_method_len, unsigned char* out_params, size_t params_buf_len, size_t* out_params_len);
int fork_block_cache_continue(ForkBlockCacheHandle handle, uint64_t request_id, const unsigned char* response, size_t response_len);

/* ============================================================================
 * Version
 * ========================================================================= */

const char* primitives_version_string(void);

#ifdef __cplusplus
}
#endif

#endif /* VOLTAIRE_H */
