package com.voltaire

/** ECDSA signature (r, s, v) */
class Signature private constructor(
    private val r: ByteArray,
    private val s: ByteArray,
    private val v: Byte
) {
    init {
        require(r.size == 32 && s.size == 32) { "r and s must be 32 bytes each" }
    }

    companion object {
        /** Parse from compact bytes (64 or 65 bytes) */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun parse(data: ByteArray): Signature {
            if (data.size != 64 && data.size != 65) throw VoltaireError.InvalidLength
            val outR = ByteArray(32)
            val outS = ByteArray(32)
            val outV = ByteArray(1)
            checkResult(VoltaireLib.INSTANCE.primitives_signature_parse(data, data.size.toLong(), outR, outS, outV))
            return Signature(outR, outS, outV[0])
        }

        /** Create from r, s, v components */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromComponents(r: ByteArray, s: ByteArray, v: Byte): Signature {
            if (r.size != 32 || s.size != 32) throw VoltaireError.InvalidLength
            return Signature(r.copyOf(), s.copyOf(), v)
        }

        /** Create from hex string */
        @JvmStatic
        @Throws(VoltaireError::class)
        fun fromHex(hex: String): Signature = parse(Hex.decode(hex))
    }

    /** Recover public key from message hash */
    @Throws(VoltaireError::class)
    fun recoverPublicKey(messageHash: Hash): PublicKey {
        val out = ByteArray(64)
        checkResult(VoltaireLib.INSTANCE.primitives_secp256k1_recover_pubkey(
            messageHash.bytes, r, s, v, out
        ))
        return PublicKey.fromUncompressed(out)
    }

    /** Recover address from message hash */
    @Throws(VoltaireError::class)
    fun recoverAddress(messageHash: Hash): Address {
        val out = PrimitivesAddress()
        checkResult(VoltaireLib.INSTANCE.primitives_secp256k1_recover_address(
            messageHash.bytes, r, s, v, out
        ))
        return Address.fromBytes(out.bytes)
    }

    /** Check if signature is canonical (low-s) */
    val isCanonical: Boolean
        get() = VoltaireLib.INSTANCE.primitives_signature_is_canonical(r, s) != 0.toByte()

    /** Validate signature components */
    val isValid: Boolean
        get() = VoltaireLib.INSTANCE.primitives_secp256k1_validate_signature(r, s) != 0.toByte()

    /** Normalize to canonical form (low-s) */
    fun normalize(): Signature {
        val newR = r.copyOf()
        val newS = s.copyOf()
        VoltaireLib.INSTANCE.primitives_signature_normalize(newR, newS)
        return Signature(newR, newS, v)
    }

    /** Serialize to compact bytes (64 bytes without v) */
    fun toCompact(): ByteArray {
        val out = ByteArray(64)
        VoltaireLib.INSTANCE.primitives_signature_serialize(r, s, v, 0, out)
        return out
    }

    /** Serialize to bytes with v (65 bytes) */
    fun toBytes(): ByteArray {
        val out = ByteArray(65)
        VoltaireLib.INSTANCE.primitives_signature_serialize(r, s, v, 1, out)
        return out
    }

    /** R component */
    val rBytes: ByteArray get() = r.copyOf()

    /** S component */
    val sBytes: ByteArray get() = s.copyOf()

    /** V component (recovery id) */
    val vByte: Byte get() = v

    /** Hex string (65 bytes with v) */
    val hex: String get() = Hex.encode(toBytes())

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Signature) return false
        return r.contentEquals(other.r) && s.contentEquals(other.s) && v == other.v
    }

    override fun hashCode(): Int {
        var result = r.contentHashCode()
        result = 31 * result + s.contentHashCode()
        result = 31 * result + v.hashCode()
        return result
    }

    override fun toString(): String = "Signature(${hex.substring(0, 18)}...)"
}
