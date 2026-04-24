import * as Base64 from "./Base64Url.js";

export const JWK_DB_KEY         = "jwkBluesky";
export const JWK_EXPORT_FORMAT  = "jwk";
export const SIGNING_ALGORITM   = "ECDSA";
export const KEY_ALGORITM       = "ES256";
export const CURVE_ALGORITM     = "P-256";
export const HASHING_ALGORITM   = "SHA-256";

export async function generateCryptoKey() {
    let cryptoKey = await generateKey();
    let jwk = await crypto.subtle.exportKey(JWK_EXPORT_FORMAT, cryptoKey.publicKey);
    delete jwk.ext;
    delete jwk.key_ops;
    return { cryptoKey, jwk };
}

export async function generateKey() {
    let cryptoKeyOptions  = { name: SIGNING_ALGORITM, namedCurve: CURVE_ALGORITM };
    let cryptoKeyPurposes = ["sign", "verify"];
    return await crypto.subtle.generateKey(cryptoKeyOptions, false, cryptoKeyPurposes);
}

export async function exportJwk(publicKey) {
    var jwk = await crypto.subtle.exportKey(JWK_EXPORT_FORMAT, publicKey).then(function(keydata) {
        return keydata;
    }).catch(function(err) {
        console.error(err);
    });
    return jwk;
}

export async function sign(privateKey, message) {
    const messageAsUint8Array = Base64.utf8ToUint8Array(message);
    let signOptions = {
        name: SIGNING_ALGORITM,
        hash: { name: HASHING_ALGORITM },
    };
    const signature = await crypto.subtle.sign(signOptions, privateKey, messageAsUint8Array);
    return Base64.toBase64Url(new Uint8Array(signature));
}

export async function sha256(str) {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    return window.crypto.subtle.digest(HASHING_ALGORITM, data);
}

export async function createHash(accessToken, noPadding = false) {
    const hash = await sha256(accessToken);
    let base = Base64.toBase64Url(new Uint8Array(hash));
    if (noPadding) {
        base = base.replace(/=+$/, '');
    }
    return base;
}
