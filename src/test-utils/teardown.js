export default async function teardown() {
    await global.app.server.close()
    return global.app.db.close()
}