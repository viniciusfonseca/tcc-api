import { db } from "../core/db";
import { DataTypes } from "sequelize";

export const ExerciseTypes = {
    FILL_BLANK: 0,
    ASSOC: 1,
    IMG_ASSOC: 2
}

export const Exercise = db.define('exercise', {
    type: { type: DataTypes.INTEGER },
    points: { type: DataTypes.INTEGER },
    meta: { type: DataTypes.STRING }
})