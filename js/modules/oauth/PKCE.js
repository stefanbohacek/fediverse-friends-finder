import * as CRYPT from "./Crypt.js";
import * as UUID  from "./UUID.js";

export function base64urlencode(str) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export async function pkceChallengeFromVerifier(v) {
    let hashed = await CRYPT.sha256(v);
    return base64urlencode(hashed);
}

export async function prepareDataForPARRequest(userHandle, clientId, callbackUrl) {
    const state         = UUID.generateRandomState();
    const codeVerifier  = UUID.generateRandomCodeVerifier();
    const codeChallenge = await pkceChallengeFromVerifier(codeVerifier);

    let body = "response_type=code";
    body += "&prompt=login";
    body += "&code_challenge_method=S256";
    body += "&scope=atproto+transition:generic";
    body += "&client_id="       + encodeURIComponent(clientId);
    body += "&redirect_uri="    + encodeURIComponent(callbackUrl);
    body += "&code_challenge="  + codeChallenge;
    body += "&state="           + state;
    body += "&login_hint="      + userHandle;

    return { state, codeVerifier, codeChallenge, body };
}
