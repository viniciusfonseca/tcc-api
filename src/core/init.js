import { db } from "./db";

const PORT = 3000

export function init() {
    return new Promise(resolve => {
        this.db = db
        db.sync().then(() =>
            this.server = this.listen(PORT, () => resolve(PORT))
        )
    })
}