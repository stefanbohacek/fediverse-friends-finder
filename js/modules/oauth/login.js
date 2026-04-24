import * as CRYPT    from "./Crypt.js";
import * as PKCE     from "./PKCE.js";
import * as DPOP     from "./DPoPProof.js";
import * as KeyStore from "./KeyStore.js";

const CLIENT_ID    = "https://friends.jointhefediverse.net/client-metadata.json";
const REDIRECT_URI = "https://friends.jointhefediverse.net/";

export const LS = {
    STATE:          "fff:oauth:state",
    CODE_VERIFIER:  "fff:oauth:codeVerifier",
    REDIRECT_URI:   "fff:oauth:redirectUri",
    TOKEN_ENDPOINT: "fff:oauth:tokenEndpoint",
    REVOCATION_EP:  "fff:oauth:revocationEndpoint",
    CALLBACK_DATA:  "fff:oauth:callbackData",
    TOKEN:          "fff:oauth:token",
    DPOP_NONCE:     "fff:oauth:dpopNonce",
    HANDLE:         "fff:oauth:handle",
    PDS_URL:        "fff:oauth:pdsUrl",
};

let _dpopKey = null;

async function getDpopKey() {
    if (_dpopKey) return _dpopKey;
    const stored = await KeyStore.loadKey();
    if (stored) {
        _dpopKey = stored;
        return _dpopKey;
    }
    const keyData = await CRYPT.generateCryptoKey();
    await KeyStore.storeKey(keyData.cryptoKey, keyData.jwk);
    _dpopKey = keyData;
    return _dpopKey;
}

async function createDpopProof(url, method, accessToken = null) {
    const { cryptoKey, jwk } = await getDpopKey();
    const dpopNonce       = localStorage.getItem(LS.DPOP_NONCE) || null;
    const accessTokenHash = accessToken ? await CRYPT.createHash(accessToken, true) : null;
    return DPOP.createDPoPProof({
        privateKey:      cryptoKey.privateKey,
        jwk,
        clientId:        CLIENT_ID,
        accessTokenHash,
        url,
        dpopNonce,
        method,
    });
}

function captureDpopNonce(response) {
    const nonce = response.headers.get("DPoP-Nonce");
    if (nonce) localStorage.setItem(LS.DPOP_NONCE, nonce);
}

async function step01ResolveHandleToDid(handle) {
    const url  = `https://public.api.bsky.app/xrpc/com.atproto.identity.resolveHandle?handle=${encodeURIComponent(handle)}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.message || `Could not resolve handle @${handle}.`);
    }
    const { did } = await resp.json();
    return did;
}

async function step02GetDidDocument(did) {
    const resp = await fetch(`https://plc.directory/${did}`);
    if (!resp.ok) throw new Error(`Failed to fetch DID document (HTTP ${resp.status}).`);
    return resp.json();
}

async function step03GetPdsMetadata(pdsUrl) {
    const resp = await fetch(`${pdsUrl}/.well-known/oauth-protected-resource`);
    if (!resp.ok) throw new Error(`Failed to fetch PDS metadata (HTTP ${resp.status}).`);
    return resp.json();
}

async function step04GetAuthServerDiscovery(authServerUrl) {
    const resp = await fetch(`${authServerUrl}/.well-known/oauth-authorization-server`);
    if (!resp.ok) throw new Error(`Failed to fetch auth server discovery (HTTP ${resp.status}).`);
    return resp.json();
}

async function step05PARRequest(parEndpoint, handle, redirectUri) {
    const { state, codeVerifier, body } = await PKCE.prepareDataForPARRequest(
        handle,
        CLIENT_ID,
        redirectUri,
    );

    localStorage.setItem(LS.STATE,         state);
    localStorage.setItem(LS.CODE_VERIFIER, codeVerifier);
    localStorage.setItem(LS.REDIRECT_URI,  redirectUri);

    for (let attempt = 0; attempt < 2; attempt++) {
        const dpopProof = await createDpopProof(parEndpoint, "POST");

        const resp = await fetch(parEndpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "DPoP":          dpopProof,
            },
            body,
        });

        captureDpopNonce(resp);

        if (resp.ok) {
            const { request_uri } = await resp.json();
            return request_uri;
        }

        const err = await resp.json().catch(() => ({}));
        if (attempt === 0 && err.error === "use_dpop_nonce") continue;
        throw new Error(err.error_description || `PAR request failed (HTTP ${resp.status}).`);
    }
}

function step06RedirectToAuthPage(authorizationEndpoint, requestUri) {
    const url = new URL(authorizationEndpoint);
    url.searchParams.set("client_id",   CLIENT_ID);
    url.searchParams.set("request_uri", requestUri);
    window.location = url.toString();
}

export async function login(handle) {
    const redirectUri = (window.location.hostname === "localhost")
        ? `${window.location.origin}/`
        : REDIRECT_URI;

    localStorage.setItem(LS.HANDLE, handle);

    const did                 = await step01ResolveHandleToDid(handle);
    const didDoc              = await step02GetDidDocument(did);
    const pdsUrl              = didDoc.service[0].serviceEndpoint;
    const pdsMetadata         = await step03GetPdsMetadata(pdsUrl);
    const authServerUrl       = pdsMetadata.authorization_servers[0];
    const authServerDiscovery = await step04GetAuthServerDiscovery(authServerUrl);

    localStorage.setItem(LS.PDS_URL,        pdsUrl);
    localStorage.setItem(LS.TOKEN_ENDPOINT, authServerDiscovery.token_endpoint);
    localStorage.setItem(LS.REVOCATION_EP,  authServerDiscovery.revocation_endpoint || "");

    const requestUri = await step05PARRequest(
        authServerDiscovery.pushed_authorization_request_endpoint,
        handle,
        redirectUri,
    );

    step06RedirectToAuthPage(authServerDiscovery.authorization_endpoint, requestUri);
}

export async function exchangeCodeForToken() {
    const callbackDataStr = localStorage.getItem(LS.CALLBACK_DATA);
    if (!callbackDataStr) return null;

    const { code, state: returnedState } = JSON.parse(callbackDataStr);
    const storedState = localStorage.getItem(LS.STATE);

    if (returnedState !== storedState) {
        throw new Error("OAuth state mismatch — possible CSRF attack.");
    }

    const tokenEndpoint = localStorage.getItem(LS.TOKEN_ENDPOINT);
    const codeVerifier  = localStorage.getItem(LS.CODE_VERIFIER);
    const redirectUri   = localStorage.getItem(LS.REDIRECT_URI) || REDIRECT_URI;

    const dpopProof = await createDpopProof(tokenEndpoint, "POST");

    const body = new URLSearchParams({
        grant_type:    "authorization_code",
        code,
        code_verifier: codeVerifier,
        client_id:     CLIENT_ID,
        redirect_uri:  redirectUri,
    });

    const resp = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            "DPoP":          dpopProof,
        },
        body: body.toString(),
    });

    captureDpopNonce(resp);

    if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error_description || `Token exchange failed (HTTP ${resp.status}).`);
    }

    const tokenData = await resp.json();
    localStorage.setItem(LS.TOKEN, JSON.stringify(tokenData));

    localStorage.removeItem(LS.CALLBACK_DATA);
    localStorage.removeItem(LS.STATE);
    localStorage.removeItem(LS.CODE_VERIFIER);

    return tokenData;
}

export function getToken() {
    const str = localStorage.getItem(LS.TOKEN);
    return str ? JSON.parse(str) : null;
}

export function isLoggedIn() {
    return !!getToken();
}

export async function authenticatedFetch(url, options = {}) {
    const token = getToken();
    if (!token) throw new Error("Not logged in.");
    const method    = (options.method || "GET").toUpperCase();
    const dpopProof = await createDpopProof(url, method, token.access_token);
    const resp = await fetch(url, {
        ...options,
        headers: {
            ...options.headers,
            "Authorization": `DPoP ${token.access_token}`,
            "DPoP":           dpopProof,
        },
    });
    captureDpopNonce(resp);
    return resp;
}

export async function logout() {
    const tokenData    = getToken();
    const revocationEp = localStorage.getItem(LS.REVOCATION_EP);

    if (tokenData?.access_token && revocationEp) {
        try {
            const dpopProof = await createDpopProof(revocationEp, "POST", tokenData.access_token);
            await fetch(revocationEp, {
                method: "POST",
                headers: {
                    "Content-Type":  "application/x-www-form-urlencoded",
                    "Authorization": `DPoP ${tokenData.access_token}`,
                    "DPoP":           dpopProof,
                },
                body: new URLSearchParams({ token: tokenData.access_token }).toString(),
            });
        } catch {}
    }

    Object.values(LS).forEach(k => localStorage.removeItem(k));
    await KeyStore.clearKey();
    _dpopKey = null;
}
