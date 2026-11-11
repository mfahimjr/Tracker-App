import { useAuth } from '../auth/useAuth'
import { useData } from './useData'

// The signed-in person as the UI shows them. Name and contact details come from the profile
// so edits on the Profile page take effect everywhere.
export function useMe() {
  const { user } = useAuth()
  const { data } = useData()
  const role = user?.role ?? 'Staff'
  return {
    name: data.profile.name,
    email: data.profile.email,
    phone: data.profile.phone,
    role,
    isManager: role !== 'Staff',
  }
}
