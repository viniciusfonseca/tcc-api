import { TRANSLATIONS_PER_EXERCISE, EXERCISES_PER_TEST } from "../../models/setAssociations"
import { createExercise } from "../Exercise/createExercise"
import { createTest } from "../Test/createTest"
import { Exercise } from "../../models/Exercise"
import { User } from "../../models/User"
import { Translation } from "../../models/Translation"

export async function postProcessTranslation({
    user_id,
    text,
    context,
    phrase
}) {
    
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
}