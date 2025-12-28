package com.voltaire

import com.sun.jna.Library
import com.sun.jna.Native
import com.sun.jna.Structure

/**
 * JNA interface to libprimitives_ts_native
 */
internal interface VoltaireLib : Library {
    companion object {
        val INSTANCE: VoltaireLib by lazy {
            Native.load("primitives_ts_native", VoltaireLib::class.java)
        }

        // Error codes
        const val SUCCESS = 0
        const val ERROR_INVALID_HEX = -1
        const val ERROR_INVALID_LENGTH = -2
        const val ERROR_INVALID_CHECKSUM = -3
        const val ERROR_OUT_OF_MEMORY = -4
        const val ERROR_INVALID_INPUT = -5
        const val ERROR_INVALID_SIGNATURE = -6
        const val ERROR_INVALID_SELECTOR = -7
        const val ERROR_UNSUPPORTED_TYPE = -8
        const val ERROR_MAX_LENGTH_EXCEEDED = -9
        const val ERROR_ACCESS_LIST_INVALID = -10
        const val ERROR_AUTHORIZATION_INVALID = -11
    }

    // Address API
    fun primitives_address_from_hex(hex: String, out: PrimitivesAddress): Int
    fun primitives_address_to_hex(address: PrimitivesAddress, buf: ByteArray): Int
    fun primitives_address_to_checksum_hex(address: PrimitivesAddress, buf: ByteArray): Int
    fun primitives_address_is_zero(address: PrimitivesAddress): Byte
    fun primitives_address_equals(a: PrimitivesAddress, b: PrimitivesAddress): Byte
    fun primitives_address_validate_checksum(hex: String): Byte

    // Keccak-256 API
    fun primitives_keccak256(data: ByteArray, dataLen: Long, out: PrimitivesHash): Int
    fun primitives_hash_to_hex(hash: PrimitivesHash, buf: ByteArray): Int
    fun primitives_hash_from_hex(hex: String, out: PrimitivesHash): Int
    fun primitives_hash_equals(a: PrimitivesHash, b: PrimitivesHash): Byte

    // Address derivation
    fun primitives_calculate_create_address(sender: PrimitivesAddress, nonce: Long, out: PrimitivesAddress): Int
    fun primitives_calculate_create2_address(
        sender: PrimitivesAddress,
        salt32: ByteArray,
        initCode: ByteArray,
        initCodeLen: Long,
        out: PrimitivesAddress
    ): Int

    // Hex utilities
    fun primitives_hex_to_bytes(hex: String, outBuf: ByteArray, bufLen: Long): Int
    fun primitives_bytes_to_hex(data: ByteArray, dataLen: Long, outBuf: ByteArray, bufLen: Long): Int

    // U256 API
    fun primitives_u256_from_hex(hex: String, out: PrimitivesU256): Int
    fun primitives_u256_to_hex(value: PrimitivesU256, buf: ByteArray, bufLen: Long): Int

    // Signature utilities
    fun primitives_signature_normalize(r: ByteArray, s: ByteArray): Byte
    fun primitives_signature_is_canonical(r: ByteArray, s: ByteArray): Byte
    fun primitives_signature_parse(sigData: ByteArray, sigLen: Long, outR: ByteArray, outS: ByteArray, outV: ByteArray): Int
    fun primitives_signature_serialize(r: ByteArray, s: ByteArray, v: Byte, includeV: Byte, outBuf: ByteArray): Int

    // Secp256k1 API
    fun primitives_secp256k1_recover_pubkey(messageHash: ByteArray, r: ByteArray, s: ByteArray, v: Byte, outPubkey: ByteArray): Int
    fun primitives_secp256k1_recover_address(messageHash: ByteArray, r: ByteArray, s: ByteArray, v: Byte, out: PrimitivesAddress): Int
    fun primitives_secp256k1_pubkey_from_private(privateKey: ByteArray, outPubkey: ByteArray): Int
    fun primitives_secp256k1_validate_signature(r: ByteArray, s: ByteArray): Byte
    fun primitives_compress_public_key(uncompressed: ByteArray, outCompressed: ByteArray): Int
    fun primitives_generate_private_key(outPrivateKey: ByteArray): Int

    // EIP-191
    fun primitives_eip191_hash_message(message: ByteArray, messageLen: Long, out: PrimitivesHash): Int
}

/** Ethereum address (20 bytes) */
@Structure.FieldOrder("bytes")
open class PrimitivesAddress : Structure() {
    @JvmField var bytes = ByteArray(20)

    class ByReference : PrimitivesAddress(), Structure.ByReference
    class ByValue : PrimitivesAddress(), Structure.ByValue
}

/** Hash value (32 bytes) */
@Structure.FieldOrder("bytes")
open class PrimitivesHash : Structure() {
    @JvmField var bytes = ByteArray(32)

    class ByReference : PrimitivesHash(), Structure.ByReference
    class ByValue : PrimitivesHash(), Structure.ByValue
}

/** 256-bit unsigned integer (32 bytes, big-endian) */
@Structure.FieldOrder("bytes")
open class PrimitivesU256 : Structure() {
    @JvmField var bytes = ByteArray(32)

    class ByReference : PrimitivesU256(), Structure.ByReference
    class ByValue : PrimitivesU256(), Structure.ByValue
}

/** Signature (r + s + v) */
@Structure.FieldOrder("r", "s", "v")
open class PrimitivesSignature : Structure() {
    @JvmField var r = ByteArray(32)
    @JvmField var s = ByteArray(32)
    @JvmField var v: Byte = 0

    class ByReference : PrimitivesSignature(), Structure.ByReference
    class ByValue : PrimitivesSignature(), Structure.ByValue
}
