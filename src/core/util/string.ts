export function getLastIndex (str: string, target: string): number {
    const indexes = [];
    let index = str.indexOf(target)
    while (index !== -1) {
        indexes.push(index);
        index = str.indexOf(target, index + 1);
    }
    return indexes.at(-1) ?? -1;
}