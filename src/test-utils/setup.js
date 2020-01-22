import { app } from "../app";

export default async function setup() {
    global.app = app
    return app.init()
}