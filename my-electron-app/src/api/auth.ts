import axios from 'axios'
import { API } from './config/axios'

export interface BackendAuthResponse {
  isSuccess: boolean
  code: string
  message: string
  data?: {
    accessToken: string
    refreshToken: string
    user?: any
  }
}

export async function authenticateWithBackend(supabaseAccessToken: string): Promise<BackendAuthResponse> {
  try {
    console.log('백엔드 인증 API 호출 중...', { 
      token: supabaseAccessToken.substring(0, 20) + '...' 
    });
    
    const response = await API.post('/auth/social-login', {
      accessToken: supabaseAccessToken
    });

    console.log('백엔드 인증 응답:', response.data);
    
    return response.data;
  } catch (error) {
    console.error('백엔드 인증 에러:', error);
    
    if (axios.isAxiosError(error)) {
      if (error.code === 'ECONNABORTED') {
        throw new Error('백엔드 API 요청 타임아웃 (10초)');
      }
      if (error.response) {
        throw new Error(`HTTP error! status: ${error.response.status} - ${error.response.statusText}`);
      }
      if (error.request) {
        throw new Error('네트워크 연결 오류');
      }
    }
    
    throw error;
  }
}