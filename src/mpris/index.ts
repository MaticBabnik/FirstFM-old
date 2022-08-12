import { EventEmitter } from 'node:events';
import DBus, { getBus, DBusConnection } from "dbus";
import { promisify } from './dbus-util';


interface DBusInterface extends EventEmitter {
    ListNames: (cb: (err: any, res: string[]) => any) => any;
}

const MPRIS_PREFIX = "org.mpris.MediaPlayer2.";

export class Mpris {
    public players: string[];

    protected constructor(protected connection: DBusConnection, protected dbus: DBus.DBusInterface<DBusInterface>) {
        this.players = [];
    }

    protected destroyPlayer(id: string) {
        console.log({ type: "destroyPlayer", id });
    }

    protected createPlayer(id: string) {
        console.log({ type: "createPlayer", id });
    }

    public async initPlayers() {
        const allNames = await promisify(this.dbus.ListNames.bind(this.dbus))();
        this.players = allNames.filter(name => name.startsWith(MPRIS_PREFIX)).map(name => name.substring(MPRIS_PREFIX.length));

        this.players.forEach(id => this.createPlayer(id));

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
        const dbus = await promisify(conn.getInterface<DBusInterface>.bind(conn))("org.freedesktop.DBus", "/org/freedesktop/DBus", "org.freedesktop.DBus");

        const mpris = new Mpris(conn, dbus);
        await mpris.initPlayers();
        return mpris;
    }
}