import { Router } from "express";
import { Translation } from "../models/Translation";

export const translationRouter = Router()

translationRouter.get('/:id', async (req, res) => {

    const id = req.params.id
    const translation = await Translation.findOne({ where: { id } })
    if (!translation) { return res.status(404).send() }
    return res.status(200).send(translation.toJSON())
})

translationRouter.delete('/:id', async (req, res) => {

    const id = req.params.id
    const translation = await Translation.findOne({ where: { id } })
    if (!translation) { return res.status(404).send() }
    await translation.update({ active: 0 })
    res.status(200).send()
})