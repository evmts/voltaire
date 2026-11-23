#include "voltaire.h"

#include <assert.h>
#include <stdint.h>
#include <string.h>

int main(void) {
    PrimitivesAddress address;
    assert(primitives_address_from_hex(
        "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0",
        &address
    ) == PRIMITIVES_SUCCESS);

    unsigned char address_hex[42];
    assert(primitives_address_to_hex(&address, address_hex) == PRIMITIVES_SUCCESS);
    assert(memcmp(
        address_hex,
        "0x742d35cc6634c0532925a3b844bc9e7595f0beb0",
        sizeof(address_hex)
    ) == 0);

    static const unsigned char message[] = "Hello, Ethereum!";
    PrimitivesHash hash;
    assert(primitives_keccak256(message, sizeof(message) - 1, &hash) == PRIMITIVES_SUCCESS);

    unsigned char hash_hex[66];
    assert(primitives_hash_to_hex(&hash, hash_hex) == PRIMITIVES_SUCCESS);
    assert(memcmp(
        hash_hex,
        "0x0a1e2723bd7f1996832b7ed7406df8ad975deba1aa04020b5bfc3e6fe70ecc29",
        sizeof(hash_hex)
    ) == 0);

    PrimitivesAddress created;
    assert(primitives_calculate_create_address(&address, 0, &created) == PRIMITIVES_SUCCESS);
    assert(!primitives_address_equals(&address, &created));

    unsigned char selector[4];
    assert(primitives_abi_compute_selector(
        "transfer(address,uint256)",
        selector
    ) == PRIMITIVES_SUCCESS);
    static const unsigned char expected_selector[4] = {0xa9, 0x05, 0x9c, 0xbb};
    assert(memcmp(selector, expected_selector, sizeof(selector)) == 0);

    static const unsigned char dog[] = {'d', 'o', 'g'};
    unsigned char rlp[4];
    assert(primitives_rlp_encode_bytes(dog, sizeof(dog), rlp, sizeof(rlp)) == 4);
    static const unsigned char expected_rlp[4] = {0x83, 'd', 'o', 'g'};
    assert(memcmp(rlp, expected_rlp, sizeof(rlp)) == 0);

    static const unsigned char typed_transaction[] = {0x02, 0xc0};
    assert(primitives_tx_detect_type(
        typed_transaction,
        sizeof(typed_transaction)
    ) == 2);
    return 0;
}
