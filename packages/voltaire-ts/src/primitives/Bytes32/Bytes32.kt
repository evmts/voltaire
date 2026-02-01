package com.voltaire

/** Fixed 32-byte value */
class Bytes32 private constructor(private val data: ByteArray) {

    init {
        require(data.size == 32) { "Bytes32 must be exactly 32 bytes" }
    }

    companion object {
        /** Zero */
        @JvmStatic
        val ZERO: Bytes32 = Bytes32(ByteArray(32))

        /** Create from hex string */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): Bytes32 {
            val decoded = Hex.decode(hex)
            if (decoded.size != 32) throw VoltaireError.InvalidLength
            return Bytes32(decoded)
        }

        /** Create from raw bytes */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromBytes(bytes: ByteArray): Bytes32 {
            if (bytes.size != 32) throw VoltaireError.InvalidLength
            return Bytes32(bytes.copyOf())
        }
    }

    /** Hex string with 0x prefix */
    val hex: String
        get() = Hex.encode(data)

    /** Raw bytes */
    val bytes: ByteArray
        get() = data.copyOf()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Bytes32) return false
        return data.contentEquals(other.data)
    }

    override fun hashCode(): Int = data.contentHashCode()

    override fun toString(): String = hex
}
