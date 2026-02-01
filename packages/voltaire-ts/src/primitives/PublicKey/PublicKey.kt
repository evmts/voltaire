package com.voltaire

/** Secp256k1 public key (64 bytes uncompressed, without prefix) */
class PublicKey private constructor(private val data: ByteArray) {

    init {
        require(data.size == 64) { "Public key must be 64 bytes (uncompressed without prefix)" }
    }

    companion object {
        /** Create from uncompressed bytes (64 bytes, no prefix) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromUncompressed(bytes: ByteArray): PublicKey {
            if (bytes.size != 64) throw VoltaireError.InvalidLength
            return PublicKey(bytes.copyOf())
        }

        /** Create from hex string */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): PublicKey {
            val decoded = Hex.decode(hex)
            // Handle both 64-byte and 65-byte (with 0x04 prefix) formats
            return when (decoded.size) {
                64 -> PublicKey(decoded)
                65 -> {
                    if (decoded[0] != 0x04.toByte()) throw VoltaireError.InvalidInput
                    PublicKey(decoded.copyOfRange(1, 65))
                }
                else -> throw VoltaireError.InvalidLength
            }
        }
    }

    /** Derive Ethereum address */
    @Throws(VoltaireError::class)
    fun address(): Address {
        val hash = Keccak256.hash(data)
        return Address.fromBytes(hash.bytes.copyOfRange(12, 32))
    }

    /** Compress to 33-byte SEC1 format */
    @Throws(VoltaireError::class)
    fun compress(): ByteArray {
        val out = ByteArray(33)
        checkResult(VoltaireLib.INSTANCE.primitives_compress_public_key(data, out))
        return out
    }

    /** Uncompressed bytes (64 bytes, no prefix) */
    val bytes: ByteArray
        get() = data.copyOf()

    /** Uncompressed bytes with 0x04 prefix (65 bytes) */
    val bytesWithPrefix: ByteArray
        get() = byteArrayOf(0x04) + data

    /** Hex string of uncompressed key (without prefix) */
    val hex: String
        get() = Hex.encode(data)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PublicKey) return false
        return data.contentEquals(other.data)
    }

    override fun hashCode(): Int = data.contentHashCode()

    override fun toString(): String = "PublicKey(${hex.substring(0, 18)}...)"
}
