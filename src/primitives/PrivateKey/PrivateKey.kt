package com.voltaire

/** Secp256k1 private key (32 bytes) */
class PrivateKey private constructor(private val data: ByteArray) {

    init {
        require(data.size == 32) { "Private key must be 32 bytes" }
    }

    companion object {
        /** Generate random private key */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun generate(): PrivateKey {
            val out = ByteArray(32)
            checkResult(VoltaireLib.INSTANCE.primitives_generate_private_key(out))
            return PrivateKey(out)
        }

        /** Create from raw bytes */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromBytes(bytes: ByteArray): PrivateKey {
            if (bytes.size != 32) throw VoltaireError.InvalidLength
            return PrivateKey(bytes.copyOf())
        }

        /** Create from hex string */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): PrivateKey {
            val decoded = Hex.decode(hex)
            return fromBytes(decoded)
        }
    }

    /** Derive public key */
    @Throws(VoltaireError::class)
    fun publicKey(): PublicKey {
        val out = ByteArray(64)
        checkResult(VoltaireLib.INSTANCE.primitives_secp256k1_pubkey_from_private(data, out))
        return PublicKey.fromUncompressed(out)
    }

    /** Derive Ethereum address */
    @Throws(VoltaireError::class)
    fun address(): Address {
        val pubkey = publicKey()
        return pubkey.address()
    }

    /** Raw bytes */
    val bytes: ByteArray
        get() = data.copyOf()

    /** Hex string with 0x prefix */
    val hex: String
        get() = Hex.encode(data)

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is PrivateKey) return false
        return data.contentEquals(other.data)
    }

    override fun hashCode(): Int = data.contentHashCode()

    override fun toString(): String = "PrivateKey(${hex.substring(0, 10)}...)"
}
