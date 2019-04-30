const express = require('express')
const translate = require('@vitalets/google-translate-api')
const Sequelize = require('sequelize')
const cors = require('cors')

const Op = Sequelize.Op

const db = new Sequelize({
    dialect: "sqlite",
    storage: './db.sqlite3'
})

const Translation = db.define('translation', {
    user_id: Sequelize.STRING,
    lang_from: Sequelize.STRING,
    lang_to: Sequelize.STRING,
    translated: Sequelize.STRING,
    translation: Sequelize.STRING
})

const TranslationContext = db.define('translation', {
    context: Sequelize.STRING
})

TranslationContext.hasOne(Translation)

const User = db.define('user', {
    id: { type: Sequelize.STRING, primaryKey: true },
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    t_count: Sequelize.INTEGER
})

const Exercise = db.define('exercise', {
    points: Sequelize.INTEGER,
    meta: Sequelize.STRING
})

Exercise.hasMany(Translation)

const Test = db.define('test', {

})

Test.hasMany(Exercise)

const app = express()

app.use(cors())

const ExerciseTypes = {
    FILL_BLANK: 0,
    ASSOC: 1,
    IMG_ASSOC: 2
}

const createFillInTheBlank = async user => {

}

const createAssociation = async user => {

}

const createImageAssociation = async user => {

}

const WORD_REGEX = /^\w+$/


app.get('/echo', async (req, res) => res.send("STATUS OK"))

app.get('/translate', async (req, res) => {

    const phrase = (req.query.t || "").trim()
    const phrase_context = req.query.ctx

    const { text, didYouMean } = await translate(phrase, { from: 'en', to: 'pt' })

    res.set("Content-Type", "application/json")
    res.json({ translated: text })

    if (didYouMean) { return }
    if (!WORD_REGEX.exec(phrase)) { return }
    if (phrase === text) { return }

    const user_id = req.query.uid

    if (!user_id) { return }

    const w_count = await Translation.count({ where: { translation: text } })

    if (w_count === 1) { return }

    await Translation.create({
        user_id,
        translated: phrase,
        translation: text
    })

    console.log(`Recording new transation: "${phrase}" --> "${text}"`)

    const t_count = await Translation.count({
        where: { user_id }
    })

    const [ user ] = await User.findCreateFind({ where: { id: user_id } })

    if (t_count % 10 === 0 && t_count !== user.t_count) {
        const ex_type = Math.floor(Math.random() * Object.keys(ExerciseTypes).length)

        const translations = await Translation.findAll({
            limit: 10,
            where: { user_id },
            order: [[ 'createdAt', 'DESC' ]]
        })

        switch (ex_type) {
            case ExerciseTypes.FILL_BLANK:
                createFillInTheBlank(translations)
                break
            case ExerciseTypes.ASSOC:
                createAssociation(translations)
                break
            case ExerciseTypes.IMG_ASSOC:
                createImageAssociation(translations)
                break
        }
    }

    await user.update({ t_count })
})

app.get('/test/:id', async (req, res) => {

    const id = req.params.id

    const test = await Test.findOne({ where: { id } })


})

app.post('/solve', async (req, res) => {

})

db.sync({}).then(() =>
    app.listen(8080,
        () => console.log("App listening on port 8080.")
    )
)
