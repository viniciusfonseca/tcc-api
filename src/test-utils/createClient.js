import axios from 'axios'

const PORT = 3000

export function createClient() {
    return axios.create({ baseURL: `http://localhost:${PORT}` })
}