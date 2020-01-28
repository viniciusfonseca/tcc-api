import { Router } from "express";
import { Translation } from "../models/Translation";
import { postProcessTranslation } from "../services/Translation/postProcessTranslation";

export const translationRouter = Router()

translationRouter.get('/:id', async (req, res) => {

    const id = req.params.id
    const translation = await Translation.findOne({ where: { id } })
    if (!translation) { return res.status(404).send() }
    return res.status(200).send(translation.toJSON())
})

translationRouter.post('/', async (req, res) => {
    const {
        user_id,
        lang_from,
        lang_to,
        translated,
        translation,
        context
    } = req.body
    const translationEntity = await postProcessTranslation({
        user_id,
        text: translation,
        context,
        phrase: translated
    })
    res.status(200).send(translationEntity)
})

translationRouter.delete('/:id', async (req, res) => {

    const id = req.params.id
    const translation = await Translation.findOne({ where: { id } })
    if (!translation) { return res.status(404).send() }
    await translation.update({ active: 0 })
    res.status(200).send()
})