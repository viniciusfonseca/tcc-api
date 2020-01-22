import { Router } from "express"
import { redirectImage } from "../core/redirectImage"

const BING_IMG_URL = "https://tse4.mm.bing.net/th"

export const imageRouter = Router()

imageRouter.get('/', async (req, res) => {
    await redirectImage(`${BING_IMG_URL}?q=${req.query.q}`, res)
})