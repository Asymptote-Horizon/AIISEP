import { getServerSession } from 'next-auth';
import { authOptions } from './auth';

// Get the current session server-side
export async function getSession() {
  return await getServerSession(authOptions);
}

// Require authentication - throws if not logged in
export async function requireAuth() {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('UNAUTHORIZED');
  }
  return session;
}

// Role checks
export function isAdmin(session) {
  return session?.user?.role === 'admin';
}

export function isFaculty(session) {
  return session?.user?.role === 'faculty';
}

export function isStudent(session) {
  return session?.user?.role === 'student';
}

// Require specific roles
export async function requireAdmin() {
  const session = await requireAuth();
  if (!isAdmin(session)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export async function requireFaculty() {
  const session = await requireAuth();
  if (!isFaculty(session)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

export async function requireAdminOrFaculty() {
  const session = await requireAuth();
  if (!isAdmin(session) && !isFaculty(session)) {
    throw new Error('FORBIDDEN');
  }
  return session;
}

// Group permission helpers
export function isGroupMember(group, userId) {
  return group.members?.some(
    (m) => m.userId?.toString() === userId?.toString()
  );
}

export function isGroupLead(group, userId) {
  return group.members?.some(
    (m) => m.userId?.toString() === userId?.toString() && m.isLead
  );
}

export function canMessageInGroup(group, session) {
  const userId = session?.user?.id;
  const role = session?.user?.role;

  // Admin can always message
  if (role === 'admin') return true;

  // Faculty members of the group can always message
  if (role === 'faculty' && isGroupMember(group, userId)) return true;

  // In open mode, any member can message
  if (group.messagingMode === 'open' && isGroupMember(group, userId)) return true;

  // In restricted mode, only faculty + student leads can message
  if (group.messagingMode === 'restricted') {
    if (role === 'faculty' && isGroupMember(group, userId)) return true;
    if (isGroupLead(group, userId)) return true;
  }

  return false;
}

// Club permission helpers
export function isClubCoordinator(club, userId) {
  const coordId = club.facultyCoordinatorId?._id || club.facultyCoordinatorId;
  return coordId?.toString() === userId?.toString();
}

export function isClubLead(club, userId) {
  const leadId = club.studentLeadId?._id || club.studentLeadId;
  return leadId?.toString() === userId?.toString();
}

// Helper to create API error responses
export function apiError(message, status = 500) {
  return Response.json({ error: message }, { status });
}

// Helper to handle permission errors
export function handleAuthError(error) {
  if (error.message === 'UNAUTHORIZED') {
    return apiError('Not authenticated', 401);
  }
  if (error.message === 'FORBIDDEN') {
    return apiError('Not authorized', 403);
  }
  console.error('API Error:', error);
  return apiError(error.message || 'Internal server error', 500);
}
