import type { Role } from '../api/auth'

export interface NavItem {
  path: string
  label: string
  // Empty means every signed-in role. The server still enforces access; this only hides links.
  roles?: Role[]
}

// Billing is Admin and CEO only (spec 5.5). The prototype shows it to everyone; do not copy that.
export const NAV: NavItem[] = [
  { path: '/', label: 'Dashboard' },
  { path: '/projects', label: 'Projects' },
  { path: '/leave', label: 'Leave' },
  { path: '/attendance', label: 'e-Attendance' },
  { path: '/payroll', label: 'Payroll' },
  { path: '/relations', label: 'Relations' },
  { path: '/billing', label: 'Billing', roles: ['CEO', 'Admin'] },
  { path: '/directories', label: 'Directories' },
]

export function navFor(role: Role): NavItem[] {
  return NAV.filter((item) => !item.roles || item.roles.includes(role))
}
