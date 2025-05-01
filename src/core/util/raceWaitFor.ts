export async function sleep(delay: number) {
    return new Promise(resolve => setTimeout(resolve, delay));
}

export async function raceWaitFor(
    func: () => boolean,
    delay: number,
    timeout: number
): Promise<number> {
    return new Promise((resolve, reject) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (func()) {
                clearInterval(interval);
                resolve(Date.now() - start);
            }
            if (Date.now() - start >= timeout) {
                clearInterval(interval);
                reject(-1);
            }
        }, delay);
    });
}