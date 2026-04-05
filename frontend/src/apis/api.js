import axios from 'axios'

const BASE_URL = 'http://localhost:8080/api'
const api = axios.create({
    baseURL: `${BASE_URL}`,
    withCredentials: true,
})

export default api