import { Router } from "express";
import { TEST_STATUS, Test } from "../models/Test";
import { findTestExercises } from "../services/Test/findTestExercises";
import { solveTest } from "../services/Test/solveTest";
import { Translation } from "../models/Translation";

export const testRouter = Router()

testRouter.get('/', async (req, res) => {
    
    const uid = req.query.uid

    if (!uid) { return res.send({ test_id: null }) }

    const test = await Test.findOne({
        where: {
            status: TEST_STATUS.PENDING,
            userId: uid
        }
    })

    const test_id = test ? test.id : null

    res.send({ test_id })
})

if (process.env.NODE_ENV === "test") {
    testRouter.get('/dump_translations', async (req, res) => {
    
        const translations = await Translation.findAll({ raw: true })
        res.status(200).send(translations)
    })
}

testRouter.get('/:id', async (req, res) => {

    const test_id = req.params.id
    if (!test_id) { return res.status(404).send() }

    const test = await Test.findOne({ where: { id: test_id } })
    if (!test) return res.status(404).send()

    const exercises = await findTestExercises(test)

    res.send({ exercises })
})

testRouter.post('/:id/solve', async (req, res) => {
    
    const test = await Test.findOne({ where: { id: req.params.id } })
    if (!test) { return res.status(404).send() }

    const { points, total_points } = await solveTest(req.body)

    await test.update({
        status: TEST_STATUS.DONE,
        max_points: total_points,
        points
    })

    res.status(200).send(correction)
})