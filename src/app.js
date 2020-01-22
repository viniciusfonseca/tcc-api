import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { init } from './core/init'
import { imageRouter } from './controllers/image'
import { testRouter } from './controllers/tests'
import { translateRouter } from './controllers/translate'
import { translationRouter } from './controllers/translation'
import { userRouter } from './controllers/user'
import { indexRouter } from './controllers'

export const app = express()

if (process.env.NODE_ENV === 'dev') {
    app.use(morgan('dev'))
}

app.use(cors())
app.use(express.json())
app.use('/', indexRouter)
app.use('/image', imageRouter)
app.use('/test', testRouter)
app.use('/translate', translateRouter)
app.use('/translation', translationRouter)
app.use('/user', userRouter)

app.init = init