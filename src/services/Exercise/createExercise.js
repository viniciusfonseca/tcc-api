import { Exercise, ExerciseTypes } from "../../models/Exercise"
import { Translation } from "../../models/Translation"
import { TRANSLATIONS_PER_EXERCISE } from '../../models/setAssociations'
import { createFillInTheBlank } from "./createFillInTheBlank"
import { createAssoc } from "./createAssoc"

export async function createExercise(user) {

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