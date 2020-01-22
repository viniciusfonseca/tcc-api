import { shuffle } from "../../core/shuffle"

export async function createAssoc(exercise, translations) {
    const t_ids = translations.map(translation => translation.id)
    const col1 = shuffle([ ...t_ids ])
    const col2 = shuffle([ ...t_ids ])

    console.log('ASSOC META', JSON.stringify({ col1, col2 }))
    
    await exercise.update({ meta: JSON.stringify({ col1, col2 }) })
}