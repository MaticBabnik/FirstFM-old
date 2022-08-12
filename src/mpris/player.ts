import DBus, { getBus, DBusConnection } from "dbus";
import { EventEmitter } from "node:events";

import { MPRIS_PREFIX, MPRIS_PATH, MPRIS_INTERFACE, MPRIS_PLAYER_INTERFACE } from "./constants"
import { MPPRISIntreface, MPRISPlayerIntreface } from "./dbus-types";
import { promisify } from "./dbus-util";

export class MprisPlayer {
    protected constructor(
        public readonly name: string,
        protected mpris: DBus.DBusInterface<MPPRISIntreface>,
        protected player: DBus.DBusInterface<MPRISPlayerIntreface>,
    ) {
    }

    public static async fromName(name: string, connection: DBus.DBusConnection): Promise<MprisPlayer> {
        try {

            const mpris = await promisify(connection.getInterface<MPPRISIntreface>.bind(connection))(MPRIS_PREFIX + name, MPRIS_PATH, MPRIS_INTERFACE);
            const player = await promisify(connection.getInterface<MPRISPlayerIntreface>.bind(connection))(MPRIS_PREFIX + name, MPRIS_PATH, MPRIS_PLAYER_INTERFACE)

            return new MprisPlayer(name, mpris, player);
        } catch {
            throw "could not create mpris player";
        }
    }

}