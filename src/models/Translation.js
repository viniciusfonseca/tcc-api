import { db } from "../core/db";
import { DataTypes } from "sequelize";

export const Translation = db.define('translation', {
    user_id: { type: DataTypes.STRING },
    lang_from: { type: DataTypes.STRING },
    lang_to: { type: DataTypes.STRING },
    translated: { type: DataTypes.STRING },
    translation: { type: DataTypes.STRING },
    context: { type: DataTypes.STRING },
    active: DataTypes.INTEGER
})