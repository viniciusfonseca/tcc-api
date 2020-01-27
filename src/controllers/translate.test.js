import { createClient } from "../test-utils/createClient"

describe('translation tests', () => {

    const api = createClient()

    it('translates phrases [en]', async () => {

        const params = {
            t: `Hello World`,
            ctx: "",
            uid: +(new Date()),
            lang: `en`
        }

        const { data } = await api.get(`/translate`, { params })
        
        expect(data.translated).toBe('Olá Mundo')
    })

    it('translates phrases [fr]', async () => {

        const params = {
            t: `bonjour`,
            ctx: "",
            uid: +(new Date()),
            lang: `fr`
        }

        const { data } = await api.get(`/translate`, { params })
        
        expect(data.translated).toBe('Olá')
    })
})