import DBus from "dbus-next";

import { MPRIS_SERVICE_PREFIX, MPRIS_PATH, MPRIS_INTERFACE, MPRIS_PLAYER_INTERFACE, DBUS_PROPERTIES_INTERFACE, MPRIS_NO_TRACK } from "./constants.js"
import { LoopStatus, Metadata, MPRISIntreface, MPRISPlayerIntreface, MPRISPlayerIntrefaceMethods, PlayerInterfaceProps, OrgMprisMediaPlayer2, PlaybackStatus, TypedPropertiesInterface } from "./dbus-types.js";
import { Emitter, debug, unwrapVariant } from "../util.js";

interface PlayerEvents {
    "metadatachange": (metadata: Metadata) => void;
    "playbackstatechange": (status: PlaybackStatus) => void;
    "loopchange": (status: LoopStatus) => void;
    "shufflechange": (status: boolean) => void;
    "ratechange": (rate: number) => void;
    "volumechange": (volume: number) => void;
    "seeked": (newPosition: number, oldPosition: number) => void;
    "destroyed": () => void;
}


const KeyToEventMap: { [Property in keyof PlayerInterfaceProps]?: keyof PlayerEvents } = {
    "Metadata": "metadatachange",
    "PlaybackStatus": "playbackstatechange",
    "LoopStatus": "loopchange",
    "Shuffle": "shufflechange",
    "Rate": "ratechange",
    "Volume": "volumechange",
};

export class MprisPlayer
    extends Emitter<PlayerEvents>
    implements PlayerInterfaceProps, MPRISPlayerIntrefaceMethods {

    //#region DBUS Methods
    public async Next() {
        await this.player.Next();
    }

    public async Previous() {
        await this.player.Previous();
    }

    public async PlayPause() {
        await this.player.PlayPause();
    }

    public async Play() {
        await this.player.Play();
    }

    public async Pause() {
        await this.player.Pause();
    }

    public async Stop() {
        await this.player.Stop();
    }

    public async Seek(position: number) {
        await this.player.Seek(position)
    }

    public async SetPosition(trackid: string, position: number) {
        await this.player.SetPosition(trackid, position)
    }

    public async OpenUri(uri: string) {
        await this.player.OpenUri(uri);
    }
    //#endregion DBUS Methods

    //#region DBUS Props
    public get PlaybackStatus(): PlaybackStatus {
        return this.playerProperties.PlaybackStatus;
    }

    public get Rate(): number {
        return this.playerProperties.Rate;
    }

    public get Metadata(): Metadata {
        return this.playerProperties.Metadata;
    }

    public get Volume(): number {
        return this.playerProperties.Volume;
    }

    public get Position(): number {
        // the private position is only updated on other events since it's changed event is not emitted
        // we can calculate the accurate position by keeping the last event's timestamp
        if (this.playerProperties.PlaybackStatus === PlaybackStatus.Playing) {
            const usSinceLastUpdate = (Date.now() - this.lastPositionUpdate) * 1000;
            const playedSinceLastUpdate = usSinceLastUpdate * this.playerProperties.Rate;

            return this.playerProperties.Position + playedSinceLastUpdate;
        }

        return this.playerProperties.Position;
    }

    public get MinimumRate(): number {
        return this.playerProperties.MinimumRate;
    }

    public get MaximumRate(): number {
        return this.playerProperties.MaximumRate;
    }

    public get CanGoNext(): boolean {
        return this.playerProperties.CanGoNext;
    }

    public get CanGoPrevious(): boolean {
        return this.playerProperties.CanGoPrevious;
    }

    public get CanPlay(): boolean {
        return this.playerProperties.CanPlay;
    }

    public get CanPause(): boolean {
        return this.playerProperties.CanPause;
    }

    public get CanSeek(): boolean {
        return this.playerProperties.CanSeek;
    }

    public get CanControl(): boolean {
        return this.playerProperties.CanControl;
    }

    public get LoopStatus(): LoopStatus {
        return this.playerProperties.LoopStatus ?? LoopStatus.None;
    }

    public get Shuffle(): boolean {
        return this.playerProperties.Shuffle ?? false;
    }

    public set Volume(val: number) {
        this.properties.Set(MPRIS_PLAYER_INTERFACE, "Volume", new DBus.Variant('d', val)).then(() => {
            this.playerProperties.Volume = val;
        }).catch(() => { })
    }

    public set Rate(val: number) {
        this.properties.Set(MPRIS_PLAYER_INTERFACE, "Rate", new DBus.Variant('d', val)).then(() => {
            this.playerProperties.Rate = val;
        }).catch(() => { })
    }

    public set LoopStatus(val: LoopStatus) {
        this.properties.Set(MPRIS_PLAYER_INTERFACE, "LoopStatus", new DBus.Variant('s', val)).then(() => {
            this.playerProperties.LoopStatus = val;
        }).catch(() => { })
    }

    public set Shuffle(val: boolean) {
        this.properties.Set(MPRIS_PLAYER_INTERFACE, "Shuffle", new DBus.Variant('b', val)).then(() => {
            this.playerProperties.Shuffle = val;
        }).catch(() => { })
    }

    //#endregion DBUS Props

    protected playerProperties: PlayerInterfaceProps = {
        PlaybackStatus: PlaybackStatus.Stopped,
        Rate: 1,
        Metadata: {
            "mpris:trackid": MPRIS_NO_TRACK
        },
        Volume: 1,
        Position: 0,
        MinimumRate: 1,
        MaximumRate: 1,
        CanGoNext: false,
        CanGoPrevious: false,
        CanPlay: false,
        CanPause: false,
        CanSeek: false,
        CanControl: false
    };

    protected lastPositionUpdate: number = Date.now();

    protected updatePositonTracking(time: number) {
        console.assert(typeof time === "number");
        this.playerProperties.Position = time;
        this.lastPositionUpdate = Date.now();
    }

    public async fetchProperties() {
        const newProps = await this.properties.GetAll(MPRIS_PLAYER_INTERFACE);

        for (const key in newProps) {
            //@ts-ignore ; typescript is not smart enough to understand that this is a key of the interface
            //or im just stupid
            this.playerProperties[key] = unwrapVariant(newProps[key]);
        }
    }

    protected constructor(
        public readonly name: string,
        protected mpris: MPRISIntreface,
        protected player: MPRISPlayerIntreface,
        protected properties: TypedPropertiesInterface<OrgMprisMediaPlayer2>
    ) {
        super();

        properties.on("PropertiesChanged", (iface, properties) => {
            if (iface === MPRIS_PLAYER_INTERFACE) {
                const newProps: Partial<PlayerInterfaceProps> = {};

                Object.keys(properties).forEach(key => {
                    //@ts-ignore; no idea how to type this
                    newProps[key] = unwrapVariant(<DBus.Variant<any>>properties[key]);
                });

                this.playerProperties = { ...newProps, ...this.playerProperties };

                //get current position before sending any events; might not be the best but it ensures the position is accurate
                this.properties.Get(MPRIS_PLAYER_INTERFACE, "Position").then(position => {
                    this.updatePositonTracking(Number(position.value));

                    (<Array<keyof PlayerInterfaceProps>><any>Object.keys(newProps)).forEach((key) => {
                        debug(`[${this.name}] '${key}' changed to ${newProps[key]}`);
                        const event = KeyToEventMap[key];
                        if (event) {
                            //@ts-ignore ; can't be bothered to fix the type error
                            this.emit(event, newProps[key]);
                        }
                    });
                }).catch(() => { });
            }
        });

        player.on("Seeked", (t: BigInt) => {
            const time = Number(t);
            debug({ e: 'seek', time, t, ct: this.Position })
            const oldTime = this.Position;
            this.updatePositonTracking(time);
            this.emit("seeked", time, oldTime);
        });
    }

    /** @internal */
    public cleanup() {
        this.emit('destroyed');

        this.player.removeAllListeners();
        this.properties.removeAllListeners();
        this.removeAllListeners();
    }

    public static async fromName(name: string, connection: DBus.MessageBus): Promise<MprisPlayer> {

        const playerObject = await connection.getProxyObject(MPRIS_SERVICE_PREFIX + name, MPRIS_PATH);

        const mpris = playerObject.getInterface<MPRISIntreface>(MPRIS_INTERFACE);
        const mprisPlayer = playerObject.getInterface<MPRISPlayerIntreface>(MPRIS_PLAYER_INTERFACE);
        const properties = playerObject.getInterface<TypedPropertiesInterface<OrgMprisMediaPlayer2>>(DBUS_PROPERTIES_INTERFACE);

        const player = new MprisPlayer(name, mpris, mprisPlayer, properties);

        await player.fetchProperties()

        return player;
    }

}