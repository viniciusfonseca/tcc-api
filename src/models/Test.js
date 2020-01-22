import { db } from "../core/db";
import { DataTypes } from "sequelize";

export const TEST_STATUS = {
    PENDING : "PENDING",
    DONE: "DONE"
}

export const Test = db.define('test', {
    status: { type: DataTypes.STRING },
    points: { type: DataTypes.INTEGER },
    max_points: { type: DataTypes.INTEGER },
    notified: { type: DataTypes.INTEGER }
})