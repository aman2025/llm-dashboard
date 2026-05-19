import axios from 'axios'

export const apiClient = axios.create({
  baseURL: 'http://localhost:3002/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})
