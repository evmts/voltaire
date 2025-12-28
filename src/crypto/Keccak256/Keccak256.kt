package com.voltaire

/** Keccak-256 hashing */
object Keccak256 {
    /** Compute Keccak-256 hash */
    @JvmStatic
    fun hash(data: ByteArray): Hash {
        val out = PrimitivesHash()
        VoltaireLib.INSTANCE.primitives_keccak256(data, data.size.toLong(), out)
        return Hash(out)
    }

    /** Hash a string (UTF-8 encoded) */
    @JvmStatic
    fun hash(data: String): Hash = hash(data.toByteArray(Charsets.UTF_8))

    /** Hash message with EIP-191 personal sign format */
    @JvmStatic
    fun hashMessage(message: ByteArray): Hash {
        val out = PrimitivesHash()
        VoltaireLib.INSTANCE.primitives_eip191_hash_message(message, message.size.toLong(), out)
        return Hash(out)
    }

    /** Hash message string with EIP-191 personal sign format */
    @JvmStatic
    fun hashMessage(message: String): Hash = hashMessage(message.toByteArray(Charsets.UTF_8))
}
