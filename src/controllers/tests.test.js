import { readFileSync } from 'fs'
import { join } from 'path'
import { createClient } from "../test-utils/createClient"
import { wait } from "../core/wait"
import { promiseSeq } from "../core/promiseSeq"

describe('tests tests', () => {

    const api = createClient()
    const uid = +(new Date())
    api.interceptors.request.use(config => {
        config.params = { ...config.params, uid }
        return config
    })

    async function createExercise(words) {
        return promiseSeq(words.map(word =>
            () => insertTranslation(word)
        ))
    }

    it('creates a test', async () => {

        const translationsSeed = JSON.parse(readFileSync(join(__dirname, 'translations.dump.json')))

        await Promise.all(
            translationsSeed.map(
                translation => api.post('/translation', translation)
            )
        )

        const { data } = await api.get(`/user/${uid}/notify_test`)
        expect(data.notify).toBe(true)

    })
})