/**
 * Permission utilities for role-based access control
 * Enforces admin-only operations in the UI layer
 */

import { Member } from '@/hooks/useMembers';

export type MemberRole = 'admin' | 'member';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

/**
 * Check if member is an admin
 */
export function isAdmin(member?: Member | null): boolean {
  return member?.role === 'admin';
}

/**
 * Check if member is the creator of a resource
 */
export function isCreator(member?: Member | null, creatorId?: string | null): boolean {
  if (!member || !creatorId) return false;
  return member.id === creatorId;
}

/**
 * Admin-only permissions
 * These actions require admin role
 */
export const AdminPermissions = {
  /**
   * Can manage household settings (name, icon)
   */
  canEditHousehold(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can edit household settings',
    };
  },

  /**
   * Can delete household
   */
  canDeleteHousehold(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can delete the household',
    };
  },

  /**
   * Can add new members to household
   */
  canAddMember(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can add new members',
    };
  },

  /**
   * Can remove members from household
   */
  canRemoveMember(member?: Member | null, targetMemberId?: string): PermissionCheck {
    if (!isAdmin(member)) {
      return {
        allowed: false,
        reason: 'Only admins can remove members',
      };
    }

    // Admins can remove others, but cannot remove themselves
    if (member?.id === targetMemberId) {
      return {
        allowed: false,
        reason: 'You cannot remove yourself. Transfer admin role first.',
      };
    }

    return { allowed: true };
  },

  /**
   * Can change member roles (promote/demote admin)
   */
  canChangeRole(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can change member roles',
    };
  },

  /**
   * Can manage household rooms
   */
  canManageRooms(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can add or remove rooms',
    };
  },

  /**
   * Can configure captain rotation settings
   */
  canConfigureCaptainSettings(member?: Member | null): PermissionCheck {
    if (isAdmin(member)) {
      return { allowed: true };
    }
    return {
      allowed: false,
      reason: 'Only admins can configure captain settings',
    };
  },
};

/**
 * Member permissions
 * These actions are available to all household members
 */
export const MemberPermissions = {
  /**
   * Can create tasks
   */
  canCreateTask(member?: Member | null): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }
    return { allowed: true };
  },

  /**
   * Can edit their own profile
   */
  canEditOwnProfile(member?: Member | null, targetMemberId?: string): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be logged in' };
    }

    if (member.id === targetMemberId) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'You can only edit your own profile',
    };
  },

  /**
   * Can complete tasks (own tasks or unassigned)
   */
  canCompleteTask(
    member?: Member | null,
    taskAssigneeId?: string | null
  ): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }

    // Can complete if unassigned or assigned to self
    if (!taskAssigneeId || taskAssigneeId === member.id) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'You can only complete tasks assigned to you',
    };
  },

  /**
   * Can edit tasks they created
   */
  canEditTask(
    member?: Member | null,
    taskCreatorId?: string,
    taskStatus?: string
  ): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }

    // Cannot edit completed tasks
    if (taskStatus === 'completed') {
      return {
        allowed: false,
        reason: 'Cannot edit completed tasks',
      };
    }

    // Creator or admin can edit
    if (isCreator(member, taskCreatorId) || isAdmin(member)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'You can only edit tasks you created',
    };
  },

  /**
   * Can delete tasks they created (or admin can delete any)
   */
  canDeleteTask(member?: Member | null, taskCreatorId?: string): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }

    // Creator or admin can delete
    if (isCreator(member, taskCreatorId) || isAdmin(member)) {
      return { allowed: true };
    }

    return {
      allowed: false,
      reason: 'You can only delete tasks you created',
    };
  },

  /**
   * Can send messages in household chat
   */
  canSendMessage(member?: Member | null): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }
    return { allowed: true };
  },

  /**
   * Can rate the current captain
   */
  canRateCaptain(member?: Member | null, captainId?: string): PermissionCheck {
    if (!member) {
      return { allowed: false, reason: 'You must be a household member' };
    }

    // Cannot rate yourself
    if (member.id === captainId) {
      return {
        allowed: false,
        reason: 'You cannot rate yourself',
      };
    }

    return { allowed: true };
  },
};

/**
 * Helper to show permission denied alert
 */
export function showPermissionDenied(reason: string): void {
  // This will be used in components with Alert
  console.warn('[Permission Denied]:', reason);
}

/**
 * Check if user has any admin capabilities in any household
 * Useful for showing/hiding admin-specific UI elements globally
 */
export function hasAdminCapabilities(member?: Member | null): boolean {
  return isAdmin(member);
}

/**
 * Get user-friendly role name
 */
export function getRoleName(role: MemberRole): string {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'member':
      return 'Member';
    default:
      return 'Unknown';
  }
}
