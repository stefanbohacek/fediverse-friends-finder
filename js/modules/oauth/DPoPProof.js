import * as Base64 from "./Base64Url.js";
import * as CRYPT from "./Crypt.js";
import * as UUID from "./UUID.js";
import * as JWT from "./JWT.js";

const DPoP_HEADER_TYPE = "dpop+jwt";

async function createDPoPProofWithParams(
  privateKey,
  jwk,
  clientId,
  accessTokenHash,
  url,
  dpopNonce = null,
  method = "POST",
) {
  const dpopProofHeader = {
    typ: DPoP_HEADER_TYPE,
    alg: CRYPT.KEY_ALGORITM,
    jwk: jwk,
  };

  const dpopProofPayload = {
    iss: clientId,
    jti: UUID.generateRandomState(),
    htm: method,
    htu: url,
    iat: Math.floor(Date.now() / 1000),
  };

  if (dpopNonce) {
    dpopProofPayload.nonce = dpopNonce;
  }

  if (accessTokenHash) {
    dpopProofPayload.ath = accessTokenHash;
  }

  const h = JSON.stringify(dpopProofHeader);
  const p = JSON.stringify(dpopProofPayload);
  const partialToken = [
    Base64.toBase64Url(Base64.utf8ToUint8Array(h)),
    Base64.toBase64Url(Base64.utf8ToUint8Array(p)),
  ].join(".");

  const signatureAsBase64 = await CRYPT.sign(privateKey, partialToken);
  return `${partialToken}.${signatureAsBase64}`;
}

export async function createDPoPProof(dpopRequest) {
  return createDPoPProofWithParams(
    dpopRequest.privateKey,
    dpopRequest.jwk,
    dpopRequest.clientId,
    dpopRequest.accessTokenHash,
    dpopRequest.url,
    dpopRequest.dpopNonce,
    dpopRequest.method,
  );
}

export function getPayload(encodedJWT) {
  const parts = JWT.getParts(encodedJWT);
  const json = JWT.partToJson(parts.payload);
  return json;
}
