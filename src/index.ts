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

        player.on('seeked',(np,op)=> {
            console.log(`${player.name} seeked from ${op/1000} to ${np/1000}`);
        });
        
        const s = new PlayerScrobbler(player);
        s.on('scrobble', (playerName, metadata) => {
            console.log(`${playerName} scrobbled ${metadata['xesam:title']}`);
        });

    });
})  
