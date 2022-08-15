import {EmitherIBarelyEvenKnowHer} from '../util';

interface DBusEvents {
    NameOwnerChanged: (name: string, old_owner: string, new_owner: string) => void;
}

export interface DBusInterface extends EmitherIBarelyEvenKnowHer<DBusEvents> {
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




export interface Metadata extends Record<string, any> {
    'mpris:trackid': string;

    'mpris:length'?: number;
    'mpris:artUrl'?: string

    'xesam:album'?: string
    'xesam:albumArtist'?: string[]
    'xesam:artist'?: string[]
    'xesam:asText'?: string
    'xesam:audioBPM'?: number
    'xesam:autoRating'?: number
    'xesam:comment'?: string[]
    'xesam:composer'?: string[]
    'xesam:contentCreated'?: number
    'xesam:discNumber'?: number
    'xesam:firstUsed'?: string
    'xesam:genre'?: string[]
    'xesam:lastUsed'?: string
    'xesam:lyricist'?: string[]
    'xesam:title'?: string
    'xesam:trackNumber'?: number
    'xesam:url'?: string
    'xesam:useCount'?: number
    'xesam:userRating'?: number
}

export enum PlaybackStatus {
    Playing = 'Playing',
    Paused = 'Paused',
    Stopped = 'Stopped'
}

export enum LoopStatus {
    None = 'None',
    Track = 'Track',
    Playlist = 'Playlist'
}

export interface MPRISPlayerIntrefaceProps {
    PlaybackStatus: PlaybackStatus;
    LoopStatus?: LoopStatus;
    Rate: number;
    Shuffle?: boolean;
    Metadata: Metadata;
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

export interface MPRISPlayerIntrefaceMethods {
    Next(): void;
    Previous(): void;
    Pause(): void;
    PlayPause(): void;
    Stop(): void;
    Play(): void;
    Seek(offset: number): void;
    SetPosition(trackId: string, position: number): void;
    OpenUri(uri: string): void;
}

type DBusCallback<T> = (err: any, res: T) => void;

interface MPRISPlayerEvents {
    Seeked: (time: number) => void;
}

export interface MPRISPlayerIntreface extends MPRISPlayerIntrefaceProps, EmitherIBarelyEvenKnowHer<MPRISPlayerEvents> {
    Next(cb: DBusCallback<never>): void;
    Previous(cb: DBusCallback<never>): void;
    Pause(cb: DBusCallback<never>): void;
    PlayPause(cb: DBusCallback<never>): void;
    Stop(cb: DBusCallback<never>): void;
    Play(cb: DBusCallback<never>): void;
    Seek(offset: number, cb: DBusCallback<never>): void;
    SetPosition(trackId: string, position: number, cb: DBusCallback<never>): void;
    OpenUri(uri: string, cb: DBusCallback<never>): void;
}