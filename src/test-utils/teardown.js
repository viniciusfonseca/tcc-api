import { wait } from '../core/wait'

require('segfault-handler').registerHandler("crash.log")

export default function teardown() {
    return new Promise(resolve => { 
        global.app.server.close(async () => {
            await wait(100)
            global.app.db.close().then(resolve)
        })
    })

}