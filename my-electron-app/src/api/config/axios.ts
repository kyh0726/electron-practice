import axios from 'axios'

const baseURL = process.env.API_BASE_URL

export const API = axios.create({
  baseURL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  }
})

API.interceptors.request.use(
  (config) => {
    console.log(`📤 API 요청: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('📤 요청 에러:', error)
    return Promise.reject(error)
  }
)

API.interceptors.response.use(
  (response) => {
    console.log(`📥 API 응답: ${response.status} ${response.config.url}`)
    return response
  },
  (error) => {
    if (axios.isAxiosError(error)) {
      console.error(`📥 응답 에러: ${error.response?.status || 'NETWORK'} ${error.config?.url}`)
    }
    return Promise.reject(error)
  }
)