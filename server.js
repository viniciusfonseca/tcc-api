const express = require('express')
const translate = require('@vitalets/google-translate-api')
const Sequelize = require('sequelize')
const cors = require('cors')
const request = require('request')

const TRANSLATIONS_PER_EXERCISE = 6
const EXERCISES_PER_TEST = 5

const db = new Sequelize({
    dialect: "sqlite",
    storage: './db.sqlite3'
})

const Translation = db.define('translation', {
    user_id: Sequelize.STRING,
    lang_from: Sequelize.STRING,
    lang_to: Sequelize.STRING,
    translated: Sequelize.STRING,
    translation: Sequelize.STRING,
    context: Sequelize.STRING,
    active: Sequelize.INTEGER
})

const User = db.define('user', {
    id: { type: Sequelize.STRING, primaryKey: true },
    email: Sequelize.STRING,
    password: Sequelize.STRING,
    t_count: Sequelize.INTEGER
})

const Exercise = db.define('exercise', {
    type: Sequelize.INTEGER,
    points: Sequelize.INTEGER,
    meta: Sequelize.STRING
})

Exercise.hasMany(Translation)
Exercise.belongsTo(User)

const TEST_STATUS = {
    PENDING : "PENDING",
    DONE: "DONE"
}

const Test = db.define('test', {
    status: Sequelize.STRING,
    points: Sequelize.INTEGER,
    max_points: Sequelize.INTEGER,
    notified: Sequelize.INTEGER
})

Test.belongsTo(User)
Test.hasMany(Exercise)
Exercise.belongsTo(Test)

const app = express()

app.use(express.json())
app.use(cors())

const ExerciseTypes = {
    FILL_BLANK: 0,
    ASSOC: 1,
    IMG_ASSOC: 2
}

const WORD_REGEX = /^\w+$/

app.get('/echo', async (_, res) => res.send("STATUS OK"))

function shuffle(array) {
    var currentIndex = array.length, temporaryValue, randomIndex;
  
    while (0 !== currentIndex) {
  
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex -= 1;
    
        temporaryValue = array[currentIndex];
        array[currentIndex] = array[randomIndex];
        array[randomIndex] = temporaryValue;
    }
  
    return array;
}

const createAssoc = async (exercise, translations) => {
    const t_ids = translations.map(translation => translation.id)
    const col1 = shuffle([ ...t_ids ])
    const col2 = shuffle([ ...t_ids ])

    console.log('ASSOC META', JSON.stringify({ col1, col2 }))
    
    await exercise.update({ meta: JSON.stringify({ col1, col2 }) })
}

const createFillInTheBlank = async (exercise, translations) => {

    const translationsWithContext = translations.filter(({ context }) => !!context)

    const hasSufficientContexts = translationsWithContext.length >= 5

    if (!hasSufficientContexts) {
        console.log('No sufficient contexts. Fallback to Assoc.')
        await exercise.update({ type: ExerciseTypes.ASSOC })
        return await createAssoc(exercise, translations)
    }

    const t_ids = translationsWithContext.map(translation => translation.id)
    const col1 = shuffle([ ...t_ids ])
    const col2 = shuffle([ ...t_ids ])

    console.log('FILL_BLANK META', JSON.stringify({ col1, col2 }))
    
    await exercise.update({ meta: JSON.stringify({ col1, col2 }) })
}

const createExercise = async (user) => {

    const { id } = user

    const type = Math.floor(Math.random() * Object.keys(ExerciseTypes).length)

    const translations = await Translation.findAll({
        limit: TRANSLATIONS_PER_EXERCISE,
        where: { user_id: id, active: 1 },
        order: [[ 'createdAt', 'DESC' ]]
    })

    const exercise = await Exercise.create({ type })
    await exercise.setTranslations(translations)
    await exercise.setUser(user)

    switch (type) {
        case ExerciseTypes.FILL_BLANK:
            return createFillInTheBlank(exercise, translations)
        case ExerciseTypes.ASSOC:
        case ExerciseTypes.IMG_ASSOC:
            return createAssoc(exercise, translations)
    }

}

const createTest = async (user, exercises) => {
    const test = await Test.create({ status: TEST_STATUS.PENDING, notified: 0 })

    await test.setUser(user)
    await test.setExercises(exercises)

    return test
}

app.get('/translate', async (req, res) => {

    const phrase = (req.query.t || "").trim()
    console.log('context', req.query.ctx)
    const context = decodeURIComponent(req.query.ctx)

    const { text, didYouMean } = await translate(phrase, { from: 'en', to: 'pt' })

    res.set("Content-Type", "application/json")
    res.json({ translated: text })

    if (didYouMean) { return }
    if (!WORD_REGEX.exec(phrase)) { return }
    if (phrase === text) { return }

    const user_id = req.query.uid

    if (!user_id) { return }

    const translation = await Translation.findOne({ where: { translation: text } })

    if (translation) {
        if (!translation.context) {
            await translation.update({ context })
        }
        return
    }
    else {
        await Translation.create({
            user_id,
            translated: phrase,
            translation: text,
            context,
            active: 1
        })
    }

    console.log(`Recording new transation: "${phrase}" --> "${text}"`)
    
    const t_count = await Translation.count({
        where: { user_id, active: 1 }
    })

    const [ user ] = await User.findCreateFind({ where: { id: user_id } })

    if (
        t_count % TRANSLATIONS_PER_EXERCISE === 0 &&
        t_count !== user.t_count
    ) {
        await createExercise(user)
        const exercises_without_test = await Exercise.findAll({ where: { testId: null } })
        if (exercises_without_test.length >= EXERCISES_PER_TEST) {
            await createTest(user, exercises_without_test)
        }
    }

    await user.update({ t_count })
})

app.get('/translation/:id', async (req, res) => {

    const id = req.params.id

    const translation = await Translation.findOne({ where: { id } })

    if (!translation) { return res.status(404).send() }

    return res.status(200).send(translation.toJSON())
})

app.delete('/translation/:id', async (req, res) => {

    const id = req.params.id

    const translation = await Translation.findOne({ where: { id } })

    if (!translation) { return res.status(404).send() }

    await translation.update({ active: 0 })

    res.status(200).send()
})

app.get('/test', async (req, res) => {

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

app.get('/test/:id', async (req, res) => {

    const test_id = req.params.id

    if (!test_id) { return res.status(404).send() }

    const test = await Test.findOne({ where: { id: test_id } })

    if (!test) return res.status(404).send()

    const exercises = await test.getExercises()

    const exTranslations = {}

    await Promise.all(
        exercises.map(exercise =>
            new Promise(resolve => {
                exercise.getTranslations().then(translations => {
                    exTranslations[exercise.id] = translations
                    resolve()
                })
            })
        )
    )

    const rawExercises = exercises.map(
        exercise => exercise.toJSON()
    )
    
    rawExercises.forEach(exercise => {
        const { col1, col2 } = JSON.parse(exercise.meta)
        delete exercise.meta
        exercise.col1 = (() => {
            if (exercise.type === ExerciseTypes.FILL_BLANK) {
                return col1.map(trId => {
                    const translation = exTranslations[exercise.id].find(({ id }) => trId === id)
                    return translation && {
                        id: translation.id,
                        text: translation.translated
                    }
                })
            }
            return col1.map(trId => {
                const translation = exTranslations[exercise.id].find(({ id }) => trId === id)
                return translation && {
                    id: translation.id,
                    text: translation.translation
                }
            })
        })().filter(Boolean)
        exercise.col2 = (() => {
            if (exercise.type === ExerciseTypes.FILL_BLANK) {
                return col2.map(trId => (exTranslations[exercise.id].find(({ id }) => trId === id) || {}).context)
            }
            return col2.map(trId => (exTranslations[exercise.id].find(({ id }) => trId === id) || {}).translated)
        })().filter(Boolean)
    })

    res.send({
        exercises: rawExercises
    })
})


/**
 * This endpoint expects the body to be like:
 *  {
 *      [exerciseId1]: [ids]
 *      [exerciseId2]: [ids]
 *      [exerciseId3]: [ids]
 *      ... and so on
 *  }
 */
app.post('/test/:id/solve', async (req, res) => {

    const test = await Test.findOne({ where: { id: req.params.id } })
    if (!test) { return res.status(404).send() }

    let points = 0
    let total_points = 0
    const correction = {}

    for (const [ exerciseId, col2res ] of Object.entries(req.body)) {
        const { meta } = await Exercise.findOne({ where: { id: exerciseId } })
        const { col2 } = JSON.parse(meta)
        correction[exerciseId] = col2
        for (let i = 0; i < col2res.length; i++) {
            points += col2res[i] === col2[i]
        }
        total_points += col2.length
    }

    correction.total_points = total_points
    correction.points = points

    await test.update({
        status: TEST_STATUS.DONE,
        max_points: total_points,
        points
    })

    res.status(200).send(correction)

})

app.get('/user/:id/dictionary', async (req, res) => {

    const translations = await Translation.findAll({ where: { user_id: req.params.id, active: 1 } })

    const rawTranslations = translations.map(
        ({ id, translation, translated }) => ({ id, translation, translated })
    )

    res.status(200).send(rawTranslations)
})

app.get('/user/:id/dictionary/reset', async (req, res) => {

    await Translation.updateAll({ active: 0 }, { where: { use_id: req.params.id } })

    res.status(200).send()
})

app.get('/user/:id/tests', async (req, res) => {

    const tests = await Test.findAll({ where: { userId: req.params.id } })

    const rawTests = tests.map(({ id, status, points, max_points }) => ({
        id, status, points, max_points
    }))

    res.status(200).send(rawTests)
})

app.get('/user/:id/notify_test', async (req, res) => {

    const notify_test = await Test.findOne({ where: { userId: req.params.id, notified: 0 } })

    res.status(200).send({ notify: !!notify_test })
})

app.put('/user/:id/notify_test', async (req, res) => {
    const notify_test = await Test.findOne({ where: { userId: req.params.id, notified: 0 } })

    await notify_test.update({ notified: 1 })

    res.status(200).send()
})

const BING_IMG_URL = "https://tse4.mm.bing.net/th"

const redirectImage = (uri, targetStream) => new Promise(resolve => {
    request.head(uri, () => {
        request(uri).pipe(targetStream).on('close', resolve);
    });
})

app.get('/image', async (req, res) => {
    await redirectImage(`${BING_IMG_URL}?q=${req.query.q}`, res)
})

db.sync({}).then(() =>
    app.listen(8080,
        () => console.log("App listening on port 8080.")
    )
)