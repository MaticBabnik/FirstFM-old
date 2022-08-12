import { Mpris } from "./mpris"


Mpris.create().then(mpris => {
    setInterval(() => {
        console.log(mpris.players);

    }, 10000)
})
