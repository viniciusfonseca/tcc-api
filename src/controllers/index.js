import { Router } from "express";

export const indexRouter = Router()

indexRouter.get('/', (_, res) => {
    res.status(200).send("STATUS OK")
})