import { Router } from "express";
import translate from '@vitalets/google-translate-api'
import { postProcessTranslation } from "../services/Translation/postProcessTranslation";

export const translateRouter = Router()

const WORD_REGEX = /^\w+$/

translateRouter.get('/', async (req, res) => {

    console.log({ query: req.query })

    const phrase = (req.query.t || "").trim()
    // console.log('context', req.query.ctx)
    const context = decodeURIComponent(req.query.ctx)

    const { text, didYouMean } = await translate(phrase, {
        from: req.query.lang || "en",
        to: 'pt'
    })

    res.set("Content-Type", "application/json")
    res.json({ translated: text })

    const user_id = req.query.uid

    if (didYouMean) { return }
    if (!WORD_REGEX.exec(phrase)) { return }
    if (phrase === text) { return }
    if (!user_id) { return }

    postProcessTranslation({ user_id, text, context, phrase })
})