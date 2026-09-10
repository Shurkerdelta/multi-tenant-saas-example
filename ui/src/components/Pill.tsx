import type { Role } from '../types'

const ROLE_LABEL: Record<Role, string> = {
  'platform-admin': 'Platform admin',
  'tenant-admin': 'Tenant admin',
  'tenant-member': 'Tenant member',
}

const ROLE_CLASS: Record<Role, string> = {
  'platform-admin': 'pill platform',
  'tenant-admin': 'pill admin',
  'tenant-member': 'pill member',
}

export function RolePill({ role }: { role: Role }) {
  return <span className={ROLE_CLASS[role]}>{ROLE_LABEL[role]}</span>
}

export function StatusPill({ active }: { active: boolean }) {
  return (
    <span className={active ? 'pill status-active' : 'pill status-inactive'}>
      {active ? 'Active' : 'Inactive'}
    </span>
  )
}
