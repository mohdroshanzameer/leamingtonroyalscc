// Role-based access control utility
// Roles: super_admin, captain, treasurer, social_media, member

export const PERMISSIONS = {
  // Player management
  add_edit_player: ['super_admin', 'captain'],
  
  // Match management
  create_edit_delete_match: ['super_admin', 'captain'],
  add_remove_player_to_match: ['super_admin', 'captain'],
  
  // Finance management
  manage_finances: ['super_admin', 'treasurer'],
  view_all_finances: ['super_admin', 'treasurer'],
  
  // News/Social media
  manage_news: ['super_admin', 'social_media'],
  
  // Admin access
  view_admin: ['super_admin', 'captain', 'treasurer', 'social_media'],
  view_finance: ['super_admin', 'treasurer'],
  
  // Full access
  full_access: ['super_admin'],
};

export function hasPermission(user, permission) {
  if (!user) return false;
  // If user is a system admin, treat them as super_admin
  if (user.role === 'admin') return true;
  // Backend currently returns `role`; some UI expects `club_role`.
  const clubRole = user.club_role || user.role || 'member';
  const allowedRoles = PERMISSIONS[permission] || [];
  return allowedRoles.includes(clubRole);
}

export function canViewFinance(user) {
  return hasPermission(user, 'view_finance');
}

export function canManageFinance(user) {
  return hasPermission(user, 'manage_finances');
}

export function canManagePlayers(user) {
  return hasPermission(user, 'add_edit_player');
}

export function canManageMatches(user) {
  return hasPermission(user, 'create_edit_delete_match');
}

export function canManageNews(user) {
  return hasPermission(user, 'manage_news');
}

export function canViewAdmin(user) {
  return hasPermission(user, 'view_admin');
}

export function getRoleLabel(role) {
  const labels = {
    super_admin: 'Super Admin',
    captain: 'Captain',
    treasurer: 'Treasurer',
    social_media: 'Social Media',
    member: 'Member'
  };
  return labels[role] || 'Member';
}