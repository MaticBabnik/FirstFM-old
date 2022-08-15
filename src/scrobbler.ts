import { EventEmitter } from 'events';
import { Metadata } from './mpris/dbus-types';
import { MprisPlayer } from './mpris/player';
import { Emitter } from "./util";

interface PlayerScrobblerEvents { 
    "scrobble": (playerName: string, metadata: Metadata) => void;
}

export class PlayerScrobbler extends EventEmitter implements Emitter<PlayerScrobblerEvents> {

    public constructor(protected player: MprisPlayer) {
        super();
        
    }
}