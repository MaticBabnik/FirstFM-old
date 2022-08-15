import * as DBus from 'dbus-next';

//#region DBus interface
export interface DBusInterface extends DBus.ClientInterface {
    ListNames(): Promise<string[]>;
    on(e: "NameOwnerChanged", listener: (name: string, old_owner: string, new_owner: string) => void): this;
}
//#endregion DBus interface

//#region DBus Properties interface

// interface definition = key:type
export type Interface = Record<string, any>;
// prop in interface
export type PropOf<I extends Interface> = string & keyof I;

// path definition = key:interface
export type InterfaceMap = Record<string, Interface>;
// interface in path
export type InterfaceOf<IM extends InterfaceMap> = string & keyof IM;

type Variantify<I extends Interface> = {
    [P in PropOf<I>]: DBus.Variant<I[P]>
}

export interface TypedPropertiesInterface<Path extends InterfaceMap> extends DBus.ClientInterface {
    Get<IF extends InterfaceOf<Path>, P extends PropOf<Path[IF]>>(interfaceName: IF, propName: P): Promise<DBus.Variant<Path[IF][P]>>;
    Set<IF extends InterfaceOf<Path>, P extends PropOf<Path[IF]>>(interfaceName: IF, propName: P, value: DBus.Variant<Path[IF][P]>): Promise<void>
    GetAll<IF extends InterfaceOf<Path>>(interfaceName: IF): Promise<Variantify<Path[IF]>>;

    on<IF extends InterfaceOf<Path>>(event: 'PropertiesChanged', listener: (interfaceName: IF, changedProps: Partial<Variantify<Path[IF]>>, invalidatedProps: PropOf<Path[IF]>[]) => void): this;
}
//#endregion DBus Properties interface

//#region MPRIS types
interface MPRISInterfaceProps {
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

export interface MPRISIntreface extends DBus.ClientInterface {
    Raise(): void;
    Quit(): void
}
//#endregion MPRIS types

//#region MPRIS Player types
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

export interface PlayerInterfaceProps {
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

export interface MPRISPlayerIntrefaceProps extends Omit<PlayerInterfaceProps, "Position"> {
    Position: BigInt;
}

export interface MPRISPlayerIntreface extends DBus.ClientInterface {
    Next(): Promise<void>;
    Previous(): Promise<void>;
    Pause(): Promise<void>;
    PlayPause(): Promise<void>;
    Stop(): Promise<void>;
    Play(): Promise<void>;
    Seek(offset: number): Promise<void>;
    SetPosition(trackId: string, position: number): Promise<void>;
    OpenUri(uri: string): Promise<void>;
}

//#endregion MPRIS Player types

export interface OrgMprisMediaPlayer2 extends InterfaceMap {
    'org.mpris.MediaPlayer2': MPRISInterfaceProps,
    'org.mpris.MediaPlayer2.Player': MPRISPlayerIntrefaceProps
}