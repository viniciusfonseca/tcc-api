import { writeFile } from 'fs'
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

    /**
     * 
     * @param {string} word 
     */
    async function insertTranslation(word) {

        const params = {
            t: word,
            ctx: "",
            uid: parseInt(new Date()),
            lang: `en`
        }

        const { data } = await api.get('/translate', { params })

        return data.translated
    }

    async function createExercise(words) {
        return promiseSeq(words.map(word =>
            () => insertTranslation(word)
        ))
    }

    it('creates a test', async () => {

        await createExercise([
            'book',
            'table',
            'world',
            'pencil',
            'notebook',
            'school'
        ])
        await wait(300)
        await createExercise([
            'car',
            'road',
            'wheel',
            'seat',
            'truck',
            'bicycle'
        ])
        await wait(300)
        await createExercise([
            'work',
            'charts',
            'pen',
            'shirt',
            'pants',
            'shoe'
        ])
        await wait(300)
        await createExercise([
            'math',
            'function',
            'subtraction',
            'division',
            'multiplication',
            'exponentiation'
        ])
        await wait(300)
        await createExercise([
            'grammar',
            'nouns',
            'adjective',
            'verbs',
            'subject',
            'predicate'
        ])
        await wait(300)

        const { data: translations } = await api.get('/test/dump_translations')
        writeFile('./translations.dump.json', JSON.stringify(translations), function() {})

        const { data } = await api.get(`/user/${uid}/notify_test`)
        expect(data.notify).toBe(true)

    }, 30000)
})