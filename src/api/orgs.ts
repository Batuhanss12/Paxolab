import { apiRequest } from './client'

export type OrgSummary = {
  id: string
  name: string
  slug: string
  role: 'owner' | 'admin' | 'member'
  memberCount: number
  seatLimit: number
  planId: string | null
  planLabel: string | null
  unlimited: boolean
}

export type OrgMember = {
  userId: string
  email: string
  name: string | null
  role: string
  createdAt: string
}

export type OrgInvite = {
  id: string
  email: string
  role: string
  token: string
  createdAt: string
  expiresAt: string
}

export type OrgDetail = {
  organization: OrgSummary
  members: OrgMember[]
  invites: OrgInvite[]
  billing: { ownerUserId: string; balance: number; unlimited: boolean }
}

export async function listOrgs(): Promise<OrgSummary[]> {
  const data = await apiRequest<{ organizations: OrgSummary[] }>('/api/orgs')
  return data.organizations
}

export async function createOrg(name: string): Promise<OrgSummary> {
  const data = await apiRequest<{ organization: OrgSummary }>('/api/orgs', {
    method: 'POST',
    body: { name },
  })
  return data.organization
}

export async function getOrg(id: string): Promise<OrgDetail> {
  return apiRequest<OrgDetail>(`/api/orgs/${id}`)
}

export async function inviteOrgMember(orgId: string, email: string, role = 'member'): Promise<OrgInvite> {
  const data = await apiRequest<{ invite: OrgInvite }>(`/api/orgs/${orgId}/invites`, {
    method: 'POST',
    body: { email, role },
  })
  return data.invite
}

export async function revokeOrgInvite(orgId: string, inviteId: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/orgs/${orgId}/invites/${inviteId}`, { method: 'DELETE' })
}

export async function removeOrgMember(orgId: string, userId: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/api/orgs/${orgId}/members/${userId}`, { method: 'DELETE' })
}

export async function acceptOrgInvite(token: string): Promise<OrgSummary> {
  const data = await apiRequest<{ organization: OrgSummary }>(`/api/orgs/invites/${token}/accept`, {
    method: 'POST',
  })
  return data.organization
}
