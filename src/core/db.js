import { Sequelize } from "sequelize";

const configs = {
    dev: {
        dialect: "sqlite",
        storage: './db.sqlite3',
        logging: false
    },
    test: {
        dialect: "sqlite",
        logging: false
    }
}

export const db = new Sequelize(configs[process.env.NODE_ENV])