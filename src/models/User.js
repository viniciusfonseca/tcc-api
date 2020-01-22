import { db } from "../core/db";
import { DataTypes } from "sequelize";

export const User = db.define('user', {
    id: { type: DataTypes.STRING, primaryKey: true },
    email: { type: DataTypes.STRING },
    password: { type: DataTypes.STRING },
    t_count: { type: DataTypes.INTEGER }
})