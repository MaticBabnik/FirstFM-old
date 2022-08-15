import { EventEmitter } from 'events';
import { Metadata } from './mpris/dbus-types';
import { MprisPlayer } from './mpris/player';
import { EmitherIBarelyEvenKnowHer } from "./util";

interface PlayerScrobblerEvents { 
    "scrobble": (playerName: string, metadata: Metadata) => void;
}

export class PlayerScrobbler extends EventEmitter implements EmitherIBarelyEvenKnowHer<PlayerScrobblerEvents> {

    public constructor(protected player: MprisPlayer) {
        super();
        
    }
}