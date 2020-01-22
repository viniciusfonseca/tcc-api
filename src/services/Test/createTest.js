import { Test } from "../../models/Test"

export async function createTest(user, exercises) {
    const test = await Test.create({ status: TEST_STATUS.PENDING, notified: 0 })

    await test.setUser(user)
    await test.setExercises(exercises)

    return test
}