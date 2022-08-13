import { Mpris } from "./mpris"
import Repl from "node:repl"


function formatUsToTimestamp(us: number) {
    const seconds = Math.floor(us / 1000000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const remainder = seconds % 60;
    return `${hours}:${minutes}:${remainder}`;
}

Mpris.create().then(mpris => {
    setInterval(() => {
        console.log([...mpris.players.values()].map(player => [player.name,formatUsToTimestamp(player.Position)]))
    }, 100);
})  
