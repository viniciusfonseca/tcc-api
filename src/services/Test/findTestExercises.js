import { ExerciseTypes } from "../../models/Exercise"

export async function findTestExercises(test) {
    
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

    return rawExercises
}