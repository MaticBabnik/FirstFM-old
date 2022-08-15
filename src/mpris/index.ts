import { EventEmitter } from 'node:events';
import DBus, { getBus, DBusConnection } from "dbus";

import { MprisPlayer } from './player';
import { promisify, EmitherIBarelyEvenKnowHer, debug } from '../util';
import { DBusInterface } from "./dbus-types"
import { DBUS_INTERFACE, DBUS_PATH, DBUS_SERVICE, MPRIS_PREFIX } from './constants';

interface MprisEvents {
    "playeradded": (player: MprisPlayer) => void;
}

export class Mpris extends EmitherIBarelyEvenKnowHer<MprisEvents> {
    public players: Map<string, MprisPlayer>;

    protected constructor(protected connection: DBusConnection, protected dbus: DBus.DBusInterface<DBusInterface>) {
        super();
        this.players = new Map<string, MprisPlayer>();
    }


    protected destroyPlayer(id: string) {
        this.players.get(id)?.cleanup();
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
        const connnection: DBus.DBusConnection = getBus("session");

        const dbus = await promisify
            (connnection.getInterface<DBusInterface>.bind(connnection))(DBUS_SERVICE, DBUS_PATH, DBUS_INTERFACE);

        const mpris = new Mpris(connnection, dbus);
        await mpris.initPlayers();
        return mpris;
    }
}