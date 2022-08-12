type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T extends any[]> = (...params: T) => void;

interface Emitter<T extends EventMap> {
    on<K extends EventKey<T>>
        (eventName: K, fn: T[K]): void;
    off<K extends EventKey<T>>
        (eventName: K, fn: T[K]): void;
}

interface DBusEvents {
    NameOwnerChanged: (name: string, old_owner: string, new_owner: string) => void;
}

export interface DBusInterface extends Emitter<DBusEvents> {
    ListNames: (cb: (err: any, res: string[]) => any) => any;
}

export interface MPPRISIntreface {
    Raise(): void;
    Quit(): void;

    CanQuit: boolean;
    Fullscreen?: boolean;
    CanSetFullscreen?: boolean;
    CanRaise: boolean;
    HasTrackList: boolean;
    Identity: string;
    DesktopEntry?: string;
    SupportedUriSchemes: string[];
    SupportedMimeTypes: string[];

}


interface DBusEvents {
    Seeked: (time: number) => void;
}

export interface MPRISPlayerIntreface {
    Next(): void;
    Previous(): void;
    Pause(): void;
    PlayPause(): void;
    Stop(): void;
    Play(): void;
    Seek(offset: number): void;
    SetPosition(trackId: string, position: number): void;
    OpenUri(uri: string): void;

    PlaybackStatus: string;
    LoopStatus?: string;
    Rate: number;
    Shuffle?: boolean;
    Metadata: Record<string, any>;
    Volume: number;
    Position: number;
    MinimumRate: number;
    MaximumRate: number;
    CanGoNext: boolean;
    CanGoPrevious: boolean;
    CanPlay: boolean;
    CanPause: boolean;
    CanSeek: boolean;
    CanControl: boolean;
}