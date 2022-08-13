import DBus, { getBus, DBusConnection } from "dbus";
import { EventEmitter } from "node:events";

import { MPRIS_PREFIX, MPRIS_PATH, MPRIS_INTERFACE, MPRIS_PLAYER_INTERFACE, DBUS_PROPERTIES, MPRIS_NO_TRACK } from "./constants"
import { LoopStatus, Metadata, MPPRISIntreface, MPRISPlayerIntreface, MPRISPlayerIntrefaceMethods, MPRISPlayerIntrefaceProps, PlaybackStatus } from "./dbus-types";
import { Emitter, promisify } from "./util";

interface PlayerEvents {
    "metadatachange": (metadata: Metadata) => void;
    "playbackstatechange": (status: PlaybackStatus) => void;
    "loopchange": (status: LoopStatus) => void;
    "shufflechange": (status: boolean) => void;
    "ratechange": (rate: number) => void;
    "volumechange": (volume: number) => void;
    "seeked": (newPosition: number, oldPosition: number) => void;
}


const KeyToEventMap: { [Property in keyof MPRISPlayerIntrefaceProps]?: keyof PlayerEvents } = {
    "Metadata": "metadatachange",
    "PlaybackStatus": "playbackstatechange",
    "LoopStatus": "loopchange",
    "Shuffle": "shufflechange",
    "Rate": "ratechange",
    "Volume": "volumechange",
};

export class MprisPlayer extends EventEmitter implements MPRISPlayerIntrefaceProps, MPRISPlayerIntrefaceMethods, Emitter<PlayerEvents> {

    //#region DBUS Methods
    public async Next() {
        await promisify(this.player.Next.bind(this.player))();
    }

    public async Previous() {
        await promisify(this.player.Previous.bind(this.player))();
    }

    public async PlayPause() {
        await promisify(this.player.PlayPause.bind(this.player))();
    }

    public async Play() {
        await promisify(this.player.Play.bind(this.player))();
    }

    public async Pause() {
        await promisify(this.player.Pause.bind(this.player))();
    }

    public async Stop() {
        await promisify(this.player.Stop.bind(this.player))();
    }

    public async Seek(position: number) {
        await promisify(this.player.Seek.bind(this.player))(position);
    }

    public async SetPosition(trackid: string, position: number) {
        await promisify(this.player.SetPosition.bind(this.player))(trackid, position);
    }

    public async OpenUri(uri: string) {
        await promisify(this.player.OpenUri.bind(this.player))(uri);
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
        this.player.setProperty("Volume", val, (err) => {
            if (!err) {
                this.playerProperties.Volume = val;
            }
        });
    }

    public set Rate(val: number) {
        this.player.setProperty("Rate", val, (err) => {
            if (!err) {
                this.playerProperties.Rate = val;
            }
        });
    }

    public set LoopStatus(val: LoopStatus) {
        this.player.setProperty("LoopStatus", val, (err) => {
            if (!err) {
                this.playerProperties.LoopStatus = val;
            }
        });
    }

    public set Shuffle(val: boolean) {
        this.player.setProperty("Shuffle", val, (err) => {
            if (!err) {
                this.playerProperties.Shuffle = val;
            }
        });
    }

    //#endregion DBUS Props

    protected playerProperties: MPRISPlayerIntrefaceProps = {
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
        this.playerProperties.Position = time;

        this.lastPositionUpdate = Date.now();
    }

    protected constructor(
        public readonly name: string,
        protected mpris: DBus.DBusInterface<MPPRISIntreface>,
        protected player: DBus.DBusInterface<MPRISPlayerIntreface>,
        protected changed: DBus.DBusInterface<EventEmitter>
    ) {
        super();

        changed.on("PropertiesChanged", (iface: string, properties: Partial<MPRISPlayerIntrefaceProps>) => {
            if (iface === MPRIS_PLAYER_INTERFACE) {
                this.playerProperties = { ...this.playerProperties, ...properties };

                //get current position before sending any events; might not be the best but it ensures the position is accurate
                this.player.getProperty("Position", (err, position) => {
                    if (!err) this.updatePositonTracking(<number><any>position);

                    //emit the event
                    (<Array<keyof MPRISPlayerIntrefaceProps>><any>Object.keys(properties)).forEach((key) => {
                        console.log(`${key} changed`);
                        const event = KeyToEventMap[key];
                        if (event) {
                            this.emit(event, properties[key]);
                        }
                    });
                });

            }
        });

        player.on("Seeked", (time: number) => {
            const oldTime = this.Position;

            this.updatePositonTracking(time);
            this.emit("seeked", time, oldTime);
        })
    }

    public static async fromName(name: string, connection: DBus.DBusConnection): Promise<MprisPlayer> {

        const interfaces = await Promise.all([
            promisify(connection.getInterface<MPPRISIntreface>.bind(connection))(MPRIS_PREFIX + name, MPRIS_PATH, MPRIS_INTERFACE),
            promisify(connection.getInterface<MPRISPlayerIntreface>.bind(connection))(MPRIS_PREFIX + name, MPRIS_PATH, MPRIS_PLAYER_INTERFACE),
            promisify(connection.getInterface<EventEmitter>.bind(connection))(MPRIS_PREFIX + name, MPRIS_PATH, DBUS_PROPERTIES)
        ]);

        const player = new MprisPlayer(name, ...interfaces);
        await player.fetchProperties()
        return player;
    }

    public async fetchProperties() {
        this.playerProperties = <MPRISPlayerIntrefaceProps>await promisify(this.player.getProperties.bind(this.player))()
    }
}