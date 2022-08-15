import { EventEmitter } from 'events';

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;

export abstract class EmitherIBarelyEvenKnowHer<T extends EventMap> extends EventEmitter {
    protected constructor() {
        super();
    }

    public on<K extends EventKey<T>>(eventName: K, fn: T[K]): this {
        super.on(eventName, fn);
        return this;
    }

    public off<K extends EventKey<T>>(eventName: K, fn: T[K]): this {
        super.on(eventName, fn);
        return this;
    }

    public emit<K extends EventKey<T>>(eventName: K, ...params: Parameters<T[K]>): boolean {
        return super.emit(eventName, ...params);
    }

    public removeAllListeners(): this {
        super.removeAllListeners();
        return this;
    }
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

export const debug = process.env.DEBUG ? console.log : () => { }; 