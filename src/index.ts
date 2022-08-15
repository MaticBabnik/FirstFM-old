import { Mpris } from "./mpris"
import { PlayerScrobbler } from "./scrobbler"
import { debug } from "./util";

const playerAllowList = [
    /spotify/,
    /clementine/,
];

Mpris.create().then(mpris => {
    mpris.on('playeradded', (player) => {

        if (!playerAllowList.find(x => x.test(player.name))) return;

        console.log(`Found player ${player.name}`);
        debug(player);
        const s = new PlayerScrobbler(player);
        s.on('scrobble', (playerName, metadata) => {
            console.log(`${playerName} scrobbled ${metadata['xesam:title']}`);
        });

    });
})  
