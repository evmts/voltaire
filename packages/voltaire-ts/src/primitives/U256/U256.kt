package com.voltaire

import java.nio.charset.StandardCharsets

/** 256-bit unsigned integer (32 bytes, big-endian) */
class U256 private constructor(private val raw: PrimitivesU256) {

    companion object {
        /** Zero */
        @JvmStatic
        val ZERO: U256 = U256(PrimitivesU256())

        /** Create from hex string */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): U256 {
            val u = PrimitivesU256()
            checkResult(VoltaireLib.INSTANCE.primitives_u256_from_hex(hex, u))
            return U256(u)
        }

        /** Create from raw bytes (32 bytes, big-endian) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromBytes(bytes: ByteArray): U256 {
            if (bytes.size != 32) throw VoltaireError.InvalidLength
            val u = PrimitivesU256()
            System.arraycopy(bytes, 0, u.bytes, 0, 32)
            return U256(u)
        }

        /** Create from long value */
        @JvmStatic
        fun fromLong(value: Long): U256 {
            val u = PrimitivesU256()
            for (i in 0..7) {
                u.bytes[31 - i] = ((value shr (i * 8)) and 0xFF).toByte()
            }
            return U256(u)
        }
    }

    /** Hex string with 0x prefix */
    val hex: String
        get() {
            val buf = ByteArray(67)
            val rc = VoltaireLib.INSTANCE.primitives_u256_to_hex(raw, buf, 67)
            require(rc >= 0) { "primitives_u256_to_hex failed: $rc" }
            val end = buf.indexOf(0)
            return String(buf, 0, if (end > 0) end else 66, StandardCharsets.UTF_8)
        }

    /** Raw bytes (32 bytes, big-endian) */
    val bytes: ByteArray
        get() = raw.bytes.copyOf()

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is U256) return false
        return raw.bytes.contentEquals(other.raw.bytes)
    }

    override fun hashCode(): Int = raw.bytes.contentHashCode()

    override fun toString(): String = hex
}
