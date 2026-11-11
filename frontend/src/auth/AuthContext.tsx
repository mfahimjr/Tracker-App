import { type ReactNode } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { authApi } from '../api/auth'
import { ApiError } from '../api/client'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient()

  const me = useQuery({
    queryKey: ['me'],
    queryFn: async () => (await authApi.me()).data,
    retry: false,
    // A 401 means "not signed in", which is a normal state, not an error to show.
    throwOnError: (error) => !(error instanceof ApiError && error.status === 401),
  })

  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: ({ data }) => queryClient.setQueryData(['me'], data),
  })

  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSettled: () => queryClient.setQueryData(['me'], null),
  })

  const value: AuthState = {
    user: me.data ?? null,
    isLoading: me.isPending,
    login: async (input) => {
      await loginMutation.mutateAsync(input)
    },
    logout: async () => {
      await logoutMutation.mutateAsync()
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
