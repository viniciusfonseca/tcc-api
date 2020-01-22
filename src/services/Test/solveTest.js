export async function solveTest(response) {
    
    let points = 0
    let total_points = 0
    const correction = {}

    for (const [ exerciseId, col2res ] of Object.entries(response)) {
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

    return correction

}