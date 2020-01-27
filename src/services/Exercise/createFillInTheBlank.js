import { createAssoc } from "./createAssoc"
import { ExerciseTypes } from "../../models/Exercise"

export async function createFillInTheBlank(exercise, translations) {

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