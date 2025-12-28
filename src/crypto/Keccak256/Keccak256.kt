package com.voltaire

/** Keccak-256 hashing */
object Keccak256 {
    /** Compute Keccak-256 hash */
    @JvmStatic
    fun hash(data: ByteArray): Hash {
        val out = PrimitivesHash()
        val rc = VoltaireLib.INSTANCE.primitives_keccak256(data, data.size.toLong(), out)
        require(rc == VoltaireLib.SUCCESS) { "primitives_keccak256 failed: $rc" }
        return Hash(out)
    }

    /** Hash a string (UTF-8 encoded) */
    @JvmStatic
    fun hash(data: String): Hash = hash(data.toByteArray(Charsets.UTF_8))

    /** Hash message with EIP-191 personal sign format */
    @JvmStatic
    fun hashEthereumMessage(message: ByteArray): Hash {
        val out = PrimitivesHash()
        val rc = VoltaireLib.INSTANCE.primitives_eip191_hash_message(message, message.size.toLong(), out)
        require(rc == VoltaireLib.SUCCESS) { "primitives_eip191_hash_message failed: $rc" }
        return Hash(out)
    }

    /** Hash message string with EIP-191 personal sign format */
    @JvmStatic
    fun hashEthereumMessage(message: String): Hash = hashEthereumMessage(message.toByteArray(Charsets.UTF_8))
}
