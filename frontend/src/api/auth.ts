import { api } from './client'

export type Role = 'CEO' | 'Admin' | 'Staff'

export interface User {
  id: number
  name: string
  email: string
  phone: string | null
  role: Role
  photo_url: string | null
}

export interface LoginInput {
  email: string
  password: string
}

// Endpoints from the spec, section 7.5 (Auth).
export const authApi = {
  me: () => api.get<{ data: User }>('/me'),
  login: (input: LoginInput) => api.post<{ data: User }>('/login', input),
  logout: () => api.post<void>('/logout'),
}
