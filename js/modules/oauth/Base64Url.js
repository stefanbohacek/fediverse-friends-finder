export function toBase64Url(input) {
    const base64string = btoa(String.fromCharCode.apply(0, input));
    return base64string.replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function base64UrlToUint8Array(input) {
    input = input.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
    return new Uint8Array(
        Array.prototype.map.call(atob(input), (c) => c.charCodeAt(0))
    );
}

export function ToBase64UrlString(str) {
    return str.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
}

export const utf8ToUint8Array = (str) => base64UrlToUint8Array(btoa(unescape(encodeURIComponent(str))));

export function base64urlencode(str) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(str)))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
