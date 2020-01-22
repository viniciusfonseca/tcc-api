import { Exercise } from "./Exercise"
import { Translation } from "./Translation"
import { User } from "./User"
import { Test } from "./Test"

Exercise.hasMany(Translation)
Exercise.belongsTo(User)
Exercise.belongsTo(Test)

Test.belongsTo(User)
Test.hasMany(Exercise)

export const TRANSLATIONS_PER_EXERCISE = 6
export const EXERCISES_PER_TEST = 5