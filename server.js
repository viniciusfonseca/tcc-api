const express = require('express')
const translate = require('@vitalets/google-translate-api')
const Sequelize = require('sequelize')
const cors = require('cors')
const request = require('request')

// const Op = Sequelize.Op

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
    context: Sequelize.STRING
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
    status: Sequelize.STRING
})

Test.belongsTo(User)
Test.hasMany(Exercise)
Exercise.belongsTo(Test)

const app = express()

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
    
    await exercise.update({ meta: JSON.stringify({ col1, col2 }) })
}

const createFillInTheBlank = async (exercise, translations) => {

    const translationsWithContext = translations.filter(({ context }) => !!context)

    const hasSufficientContexts = translationsWithContext.length >= 5

    if (!hasSufficientContexts) {
        await exercise.update({ type: ExerciseTypes.ASSOC })
        return createAssoc(exercise, translations)
    }

    const t_ids = translationsWithContext.map(translation => translation.id)
    const col1 = shuffle([ ...t_ids ])
    const col2 = shuffle([ ...t_ids ])
    
    await exercise.update({ meta: JSON.stringify({ col1, col2 }) })
}

const TRANSLATIONS_PER_EXERCISE = 10

const createExercise = async (user) => {

    const { id } = user

    const type = Math.floor(Math.random() * Object.keys(ExerciseTypes).length)

    const translations = await Translation.findAll({
        limit: TRANSLATIONS_PER_EXERCISE,
        where: { user_id: id },
        order: [[ 'createdAt', 'DESC' ]]
    })

    const exercise = Exercise.create({ type })
    await exercise.setTranslations(translations)
    exercise.setUser(user)

    switch (type) {
        case ExerciseTypes.FILL_BLANK:
            return createFillInTheBlank(exercise, translations)
        case ExerciseTypes.ASSOC:
        case ExerciseTypes.IMG_ASSOC:
            return createAssoc(exercise)
    }

}

const createTest = async (user, exercises) => {
    const test = Test.create({ status: TEST_STATUS.PENDING })

    test.setUser(user)
    test.setExercises(exercises)

    return test
}

app.get('/translate', async (req, res) => {

    const phrase = (req.query.t || "").trim()
    const context = req.query.ctx

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
            context
        })
    }

    console.log(`Recording new transation: "${phrase}" --> "${text}"`)
    
    const t_count = await Translation.count({
        where: { user_id }
    })

    const [ user ] = await User.findCreateFind({ where: { id: user_id } })

    if (
        t_count % TRANSLATIONS_PER_EXERCISE === 0 &&
        t_count !== user.t_count
    ) {
        await createExercise(user)
        const exercises_without_test = await Exercise.findAll({ where: { testId: null } })
        if (exercises_without_test.length >= 5) {
            await createTest(user, exercises)
        }
    }

    await user.update({ t_count })
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

    res.send({
        exercises: exercises.map(exercise => exercise.toJSON())
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
app.post('/solve', async (req, res) => {

    const user_response = req.body



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