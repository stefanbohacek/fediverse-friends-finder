export async function generate() {
    function randomDigit() {
        if (crypto && crypto.getRandomValues) {
            var randomdata = new Uint8Array(1);
            crypto.getRandomValues(randomdata);
            return (randomdata[0] % 16).toString(16);
        } else {
            return ((Math.random() * 16) | 0).toString(16);
        }
    }

    var crypto = window.crypto || window.msCrypto;
    return 'xxxxxxxx-xxxx-4xxx-8xxx-xxxxxxxxxxxx'.replace(/x/g, randomDigit);
}

export function generateRandomState() {
    if (self?.crypto?.randomUUID) {
        return self.crypto.randomUUID();
    } else {
        console.error("self.crypto not available");
    }
}

export function generateRandomCodeVerifier() {
    let randomData = new Uint32Array(28);
    window.crypto.getRandomValues(randomData);
    return Array.from(randomData, dec => ('0' + dec.toString(16)).substr(-2)).join('');
}
