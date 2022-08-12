export function promisify<Args extends any[], ErrType, ResType>(fn: (...args: [...Args, (e: ErrType, r: ResType) => any]) => any): (...a: Args) => Promise<ResType> {
    return (...args: Args) => {
        return new Promise<ResType>((resolve, reject) => {
            fn(...args, (e: ErrType, r: ResType) => {
                if (e) {
                    reject(e);
                } else {
                    resolve(r);
                }
            });
        });
    };
}
