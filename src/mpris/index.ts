import { EventEmitter } from 'node:events';
import * as DBus from "dbus-next";

import { MprisPlayer } from './player';
import { promisify, Emitter, debug } from '../util';
import { DBusInterface } from "./dbus-types"
import { DBUS_INTERFACE, DBUS_PATH, DBUS_SERVICE, MPRIS_SERVICE_PREFIX } from './constants';


interface MprisEvents {
    "playeradded": (player: MprisPlayer) => void;
}

export class Mpris extends Emitter<MprisEvents> {
    public players: Map<string, MprisPlayer>;

    protected constructor(protected connection: DBus.MessageBus, protected dbus: DBusInterface) {
        super();
        this.players = new Map<string, MprisPlayer>();
    }


    protected destroyPlayer(id: string) {
        // this.players.get(id)?.cleanup();
        this.players.delete(id);
    }

    protected async createPlayer(id: string) {
        try {
            const player = await MprisPlayer.fromName(id, this.connection);
            debug(`Creating ${id}`);
            this.players.set(id, player);
            this.emit("playeradded", player);
        } catch {
            console.log(`Could not create player ${id}`);
        }
    }

    public async initPlayers() {
        const allNames = await this.dbus.ListNames();
        const playerNames = allNames.filter(name => name.startsWith(MPRIS_SERVICE_PREFIX)).map(name => name.substring(MPRIS_SERVICE_PREFIX.length));

        playerNames.forEach(id => this.createPlayer(id));

        this.dbus.on("NameOwnerChanged", (name, ownerOld, ownerNew) => {
            if (!name.startsWith(MPRIS_SERVICE_PREFIX))
                return;

            if (ownerOld !== '') { // only destroy the old one if there was one
                this.destroyPlayer(name.substring(MPRIS_SERVICE_PREFIX.length));
            }
            if (ownerNew !== '') { //only create the new one if there is one
                this.createPlayer(name.substring(MPRIS_SERVICE_PREFIX.length));
            }
        });
    }

    public static async create() {
        const connnection = DBus.sessionBus();

        const dbusObject = await connnection.getProxyObject(DBUS_SERVICE, DBUS_PATH);
        const dbusInterface = dbusObject.getInterface<DBusInterface>(DBUS_INTERFACE);

        const mpris = new Mpris(connnection, dbusInterface);
        await mpris.initPlayers();
        return mpris;
    }
}