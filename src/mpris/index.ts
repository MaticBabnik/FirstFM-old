import { EventEmitter } from 'node:events';
import DBus, { getBus, DBusConnection } from "dbus";

import { MprisPlayer } from './player';
import { promisify } from './dbus-util';
import { DBusInterface } from "./dbus-types"
import { DBUS_INTERFACE, DBUS_PATH, DBUS_SERVICE, MPRIS_PREFIX } from './constants';





export class Mpris {
    public players: Map<string, MprisPlayer>;

    protected constructor(protected connection: DBusConnection, protected dbus: DBus.DBusInterface<DBusInterface>) {
        this.players = new Map<string, MprisPlayer>();
    }

    protected destroyPlayer(id: string) {
        console.log({ type: "destroyPlayer", id });
        this.players.delete(id);
    }

    protected async createPlayer(id: string) {
        console.log({ type: "createPlayer", id });
        this.players.set(id, await MprisPlayer.fromName(id, this.connection));
    }

    public async initPlayers() {
        const allNames = await promisify(this.dbus.ListNames.bind(this.dbus))();
        const playerNames = allNames.filter(name => name.startsWith(MPRIS_PREFIX)).map(name => name.substring(MPRIS_PREFIX.length));

        playerNames.forEach(id => this.createPlayer(id));

        this.dbus.on("NameOwnerChanged", (name, ownerOld, ownerNew) => {
            if (!name.startsWith(MPRIS_PREFIX))
                return;

            if (ownerOld !== '') { // only destroy the old one if there was one
                this.destroyPlayer(name.substring(MPRIS_PREFIX.length));
            }
            if (ownerNew !== '') { //only create the new one if there is one
                this.createPlayer(name.substring(MPRIS_PREFIX.length));
            }
        });
    }

    public static async create() {
        const conn = getBus("session");
        const dbus = await promisify(conn.getInterface<DBusInterface>.bind(conn))(DBUS_SERVICE, DBUS_PATH, DBUS_INTERFACE);

        const mpris = new Mpris(conn, dbus);
        await mpris.initPlayers();
        return mpris;
    }
}