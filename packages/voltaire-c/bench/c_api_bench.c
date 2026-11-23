/**
 * Voltaire C API performance benchmark suite.
 * Emits SMTHRS_BENCH_JSON structured output on stdout.
 */
#include <stdio.h>
#include <stdint.h>
#include <string.h>
#include <time.h>
#include "../include/voltaire.h"

static uint64_t now_ns(void) {
    struct timespec ts;
    clock_gettime(CLOCK_MONOTONIC, &ts);
    return (uint64_t)ts.tv_sec * 1000000000ULL + (uint64_t)ts.tv_nsec;
}

typedef void (*bench_fn)(void);

static const char *TEST_ADDR_HEX = "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0";
static const char *TEST_HASH_HEX = "0x0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
static PrimitivesAddress g_addr;
static PrimitivesHash g_hash;
static PrimitivesU256 g_u256;
static unsigned char g_data32[32];
static unsigned char g_data1k[1024];
static volatile unsigned long g_sink = 0;

static void bench_address_from_hex(void) {
    PrimitivesAddress out;
    int rc = primitives_address_from_hex(TEST_ADDR_HEX, &out);
    g_sink ^= (unsigned long)(rc + out.bytes[0]);
}

static void bench_address_to_hex(void) {
    unsigned char buf[43];
    int rc = primitives_address_to_hex(&g_addr, buf);
    g_sink ^= (unsigned long)(rc + buf[2]);
}

static void bench_address_to_checksum(void) {
    unsigned char buf[43];
    int rc = primitives_address_to_checksum_hex(&g_addr, buf);
    g_sink ^= (unsigned long)(rc + buf[2]);
}

static void bench_keccak256_32b(void) {
    PrimitivesHash out;
    int rc = primitives_keccak256(g_data32, sizeof(g_data32), &out);
    g_sink ^= (unsigned long)(rc + out.bytes[0]);
}

static void bench_keccak256_1kb(void) {
    PrimitivesHash out;
    int rc = primitives_keccak256(g_data1k, sizeof(g_data1k), &out);
    g_sink ^= (unsigned long)(rc + out.bytes[0]);
}

static void bench_sha256_32b(void) {
    unsigned char out[32];
    int rc = primitives_sha256(g_data32, sizeof(g_data32), out);
    g_sink ^= (unsigned long)(rc + out[0]);
}

static void bench_blake2b_32b(void) {
    unsigned char out[64];
    int rc = primitives_blake2b(g_data32, sizeof(g_data32), out);
    g_sink ^= (unsigned long)(rc + out[0]);
}

static void bench_ripemd160_32b(void) {
    unsigned char out[20];
    int rc = primitives_ripemd160(g_data32, sizeof(g_data32), out);
    g_sink ^= (unsigned long)(rc + out[0]);
}

static void bench_hash_from_hex(void) {
    PrimitivesHash out;
    int rc = primitives_hash_from_hex(TEST_HASH_HEX, &out);
    g_sink ^= (unsigned long)(rc + out.bytes[0]);
}

static void bench_hex_encode_32b(void) {
    unsigned char buf[80];
    int rc = primitives_bytes_to_hex(g_data32, sizeof(g_data32), buf, sizeof(buf));
    g_sink ^= (unsigned long)(rc + buf[2]);
}

static void bench_rlp_encode_bytes(void) {
    unsigned char buf[128];
    int rc = primitives_rlp_encode_bytes(g_data32, sizeof(g_data32), buf, sizeof(buf));
    g_sink ^= (unsigned long)(rc + buf[0]);
}

static void bench_u256_from_hex(void) {
    PrimitivesU256 out;
    int rc = primitives_u256_from_hex(TEST_HASH_HEX, &out);
    g_sink ^= (unsigned long)(rc + out.bytes[31]);
}

static void bench_abi_selector(void) {
    unsigned char sel[4];
    int rc = primitives_abi_compute_selector("transfer(address,uint256)", sel);
    g_sink ^= (unsigned long)(rc + sel[0]);
}

struct bench_case {
    const char *name;
    bench_fn fn;
};

int main(void) {
    memset(g_data32, 0x42, sizeof(g_data32));
    memset(g_data1k, 0x55, sizeof(g_data1k));
    primitives_address_from_hex(TEST_ADDR_HEX, &g_addr);
    primitives_hash_from_hex(TEST_HASH_HEX, &g_hash);
    primitives_u256_from_hex(TEST_HASH_HEX, &g_u256);

    struct bench_case cases[] = {
        {"primitives_address_from_hex", bench_address_from_hex},
        {"primitives_address_to_hex", bench_address_to_hex},
        {"primitives_address_to_checksum_hex", bench_address_to_checksum},
        {"primitives_keccak256_32b", bench_keccak256_32b},
        {"primitives_keccak256_1kb", bench_keccak256_1kb},
        {"primitives_sha256_32b", bench_sha256_32b},
        {"primitives_blake2b_32b", bench_blake2b_32b},
        {"primitives_ripemd160_32b", bench_ripemd160_32b},
        {"primitives_hash_from_hex", bench_hash_from_hex},
        {"primitives_bytes_to_hex_32b", bench_hex_encode_32b},
        {"primitives_rlp_encode_bytes_32b", bench_rlp_encode_bytes},
        {"primitives_u256_from_hex", bench_u256_from_hex},
        {"primitives_abi_compute_selector", bench_abi_selector},
    };
    size_t count = sizeof(cases) / sizeof(cases[0]);

    printf("SMTHRS_BENCH_JSON:{\"suite\":\"voltaire-c:c-api\",\"runtime\":\"c\",\"metrics\":[");
    for (size_t i = 0; i < count; i++) {
        for (int w = 0; w < 200; w++) cases[i].fn();
        uint64_t cal_start = now_ns();
        size_t cal_iters = 0;
        while ((now_ns() - cal_start) < 2000000ULL && cal_iters < 200000) {
            cases[i].fn();
            cal_iters++;
        }
        size_t batch = cal_iters > 2 ? cal_iters / 2 : 1;
        const int samples = 15;
        double sum = 0.0, min_ns = 1e30, max_ns = 0.0;
        for (int s = 0; s < samples; s++) {
            uint64_t t0 = now_ns();
            for (size_t j = 0; j < batch; j++) cases[i].fn();
            double ns = (double)(now_ns() - t0) / (double)batch;
            sum += ns;
            if (ns < min_ns) min_ns = ns;
            if (ns > max_ns) max_ns = ns;
        }
        double mean_ns = sum / (double)samples;
        double ops = mean_ns > 0.0 ? 1e9 / mean_ns : 0.0;
        if (i > 0) printf(",");
        printf("{\"name\":\"%s\",\"unit\":\"ns/op\",\"value\":%.3f,\"lowerIsBetter\":true,\"meanNs\":%.3f,\"minNs\":%.3f,\"maxNs\":%.3f,\"opsPerSec\":%.0f,\"samples\":%d}",
               cases[i].name, mean_ns, mean_ns, min_ns, max_ns, ops, samples);
    }
    printf("]}\n");
    return 0;
}
