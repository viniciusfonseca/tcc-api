import { Router } from "express";
import { Translation } from "../models/Translation";
import { Test } from "../models/Test";

export const userRouter = Router()

userRouter.get('/:id/dictionary', async (req, res) => {

    const translations = await Translation.findAll({ where: { user_id: req.params.id, active: 1 } })

    const rawTranslations = translations.map(
        ({ id, translation, translated }) => ({ id, translation, translated })
    )

    res.status(200).send(rawTranslations)
})

userRouter.get('/:id/dictionary/reset', async (req, res) => {

    await Translation.updateAll({ active: 0 }, { where: { use_id: req.params.id } })

    res.status(200).send()
})

userRouter.get('/:id/tests', async (req, res) => {

    const tests = await Test.findAll({ where: { userId: req.params.id } })

    const rawTests = tests.map(({ id, status, points, max_points }) => ({
        id, status, points, max_points
    }))

    res.status(200).send(rawTests)
})

userRouter.get('/:id/notify_test', async (req, res) => {
    const notify_test = await Test.findOne({ where: { userId: req.params.id, notified: 0 } })
     
    res.status(200).send({ notify: !!notify_test })
})

userRouter.put('/:id/notify_test', async (req, res) => {
    const notify_test = await Test.findOne({ where: { userId: req.params.id, notified: 0 } })

    await notify_test.update({ notified: 1 })

    res.status(200).send()
})