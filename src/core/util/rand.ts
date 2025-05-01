const hexSeed = "0123456789abcdef";

export function generateHexString() {
    let result = "";
    for(let i = 0; i < 24; i++) {
        const hexValue = Math.floor(Math.random() * 16);
        result += hexSeed[hexValue]
    }
    return result;
}