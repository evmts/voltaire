package com.voltaire

/** ECDSA signature (r, s, v) */
class Signature private constructor(
    private val _r: ByteArray,
    private val _s: ByteArray,
    private val _v: Byte
) {
    init {
        require(_r.size == 32 && _s.size == 32) { "r and s must be 32 bytes each" }
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
            messageHash.bytes, _r, _s, _v, out
        ))
        return PublicKey.fromUncompressed(out)
    }

    /** Recover address from message hash */
    @Throws(VoltaireError::class)
    fun recoverAddress(messageHash: Hash): Address {
        val out = PrimitivesAddress()
        checkResult(VoltaireLib.INSTANCE.primitives_secp256k1_recover_address(
            messageHash.bytes, _r, _s, _v, out
        ))
        return Address.fromBytes(out.bytes)
    }

    /** Check if signature is canonical (low-s) */
    val isCanonical: Boolean
        get() = VoltaireLib.INSTANCE.primitives_signature_is_canonical(_r, _s) != 0.toByte()

    /** Validate signature components */
    val isValid: Boolean
        get() = VoltaireLib.INSTANCE.primitives_secp256k1_validate_signature(_r, _s) != 0.toByte()

    /** Normalize to canonical form (low-s) */
    fun normalize(): Signature {
        val newR = _r.copyOf()
        val newS = _s.copyOf()
        VoltaireLib.INSTANCE.primitives_signature_normalize(newR, newS)
        return Signature(newR, newS, _v)
    }

    /** Serialize to compact format (64 or 65 bytes) */
    fun serialize(includeV: Boolean = true): ByteArray {
        val out = ByteArray(if (includeV) 65 else 64)
        val rc = VoltaireLib.INSTANCE.primitives_signature_serialize(
            _r, _s, _v, if (includeV) 1 else 0, out
        )
        require(rc >= 0) { "primitives_signature_serialize failed: $rc" }
        return out
    }

    /** Serialize to compact bytes (64 bytes without v) */
    fun toCompact(): ByteArray = serialize(includeV = false)

    /** Serialize to bytes with v (65 bytes) */
    fun toBytes(): ByteArray = serialize(includeV = true)

    /** R component (32 bytes) */
    val r: ByteArray get() = _r.copyOf()

    /** S component (32 bytes) */
    val s: ByteArray get() = _s.copyOf()

    /** V recovery id (0,1,27,28) */
    val v: Byte get() = _v

    /** Hex string (65 bytes with v) */
    val hex: String get() = Hex.encode(toBytes())

    override fun equals(other: Any?): Boolean {
        if (this === other) return true
        if (other !is Signature) return false
        return _r.contentEquals(other._r) && _s.contentEquals(other._s) && _v == other._v
    }

    override fun hashCode(): Int {
        var result = _r.contentHashCode()
        result = 31 * result + _s.contentHashCode()
        result = 31 * result + _v.hashCode()
        return result
    }

    override fun toString(): String = "Signature(${hex.substring(0, 18)}...)"
}
