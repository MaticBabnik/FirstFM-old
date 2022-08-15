import { EventEmitter } from 'events';
import { Variant } from "dbus-next";

type EventMap = Record<string, any>;
type EventKey<T extends EventMap> = string & keyof T;

export function unwrapVariant<T>(variant: Variant<T>): T {
    let out = variant.value;
    if (typeof out === 'bigint') {
        //@ts-ignore
        return Number(out);
    }

    if (typeof out !== 'object') {
        return out;
    }

    for (const key in out) {
        if (out[key] instanceof Variant) {
            //@ts-ignore; runtime safety is thrown out of the window if the interface is invalid so it doesn't make sense to overengineer this
            out[key] = unwrapVariant(out[key]);
        }
    }

    return out;
}

export abstract class Emitter<T extends EventMap> extends EventEmitter {
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