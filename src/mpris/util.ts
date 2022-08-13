type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T extends any[]> = (...params: T) => void;

export interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>
        (eventName: K, fn: T[K]): void;
    off<K extends EventKey<T>>
        (eventName: K, fn: T[K]): void;
    emit<K extends EventKey<T>>
        (eventName: K, ...params: Parameters<T[K]>): void;
}

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
