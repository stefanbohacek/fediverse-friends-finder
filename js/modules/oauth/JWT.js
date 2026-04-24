import * as Base64 from "./Base64Url.js";
import * as CRYPT  from "./Crypt.js";

export async function create(privateKey, header, payload) {
    const h = JSON.stringify(header);
    const p = JSON.stringify(payload);

    const partialToken = [
        Base64.toBase64Url(Base64.utf8ToUint8Array(h)),
        Base64.toBase64Url(Base64.utf8ToUint8Array(p)),
    ].join(".");

    const messageAsUint8Array = Base64.utf8ToUint8Array(partialToken);
    var signatureAsBase64 = await CRYPT.Sign(privateKey, messageAsUint8Array);
    var token = `${partialToken}.${signatureAsBase64}`;

    return token;
}

export function getParts(accessToken) {
    const parts = accessToken.split(".");
    return { header: parts[0], payload: parts[1], signature: parts[2] };
}

export function partToJson(section) {
    const b64 = Base64.ToBase64UrlString(section);
    const str = atob(b64);
    return JSON.parse(str);
}

function prettyJWTString(section) {
    var json = partToJson(section);
    return JSON.stringify(json, null, "    ");
}

export function getJWTAsSemiJSON(accessToken) {
    var parts = getParts(accessToken);

    var headerString    = prettyJWTString(parts.header);
    var payloadString   = prettyJWTString(parts.payload);
    var signatureBase64Url = Base64.ToBase64UrlString(parts.signature);

    return { header: headerString, payload: payloadString, signature: signatureBase64Url };
}

export function jwtToPrettyJSON(jwt) {
    let partsAsString = getJWTAsSemiJSON(jwt);
    return `${partsAsString.header}.${partsAsString.payload}.${partsAsString.signature}`;
}
