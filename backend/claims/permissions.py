"""
Custom permission classes for insurance company RBAC.

Roles hierarchy:
  admin     – Full system access, user management, configuration
  manager   – Oversee operations, approve high-value claims, assign work, analytics
  adjuster  – Investigate/process claims, approve/deny within limits
  reviewer  – QA / compliance review, audit, fraud investigation (read-heavy)
  agent     – Customer-facing, help file claims, view policies (no approve/deny)
  customer  – File claims, view own data, appeal decisions
"""
from rest_framework import permissions

# ---------- helpers ----------

STAFF_ROLES = ('admin', 'manager', 'adjuster', 'reviewer', 'agent')
MANAGEMENT_ROLES = ('admin', 'manager')
PROCESSING_ROLES = ('admin', 'manager', 'adjuster')  # can approve / deny / settle
OVERSIGHT_ROLES = ('admin', 'manager', 'reviewer')    # analytics, fraud, audits


def _get_role(user):
    """Get the role from user's profile, defaulting to 'customer'."""
    profile = getattr(user, 'profile', None)
    return profile.role if profile else 'customer'


# ---------- permission classes ----------

class IsAdmin(permissions.BasePermission):
    """Only administrators can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) == 'admin'


class IsManagement(permissions.BasePermission):
    """Admin and manager roles can access."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in MANAGEMENT_ROLES


class IsStaff(permissions.BasePermission):
    """Any internal role (admin, manager, adjuster, reviewer, agent)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in STAFF_ROLES


class IsStaffOrReadOnly(permissions.BasePermission):
    """Staff gets full access; customers get read-only."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.method in permissions.SAFE_METHODS:
            return True
        return _get_role(request.user) in STAFF_ROLES


class IsOwnerOrStaff(permissions.BasePermission):
    """Object owner or any staff role can access."""
    def has_object_permission(self, request, view, obj):
        role = _get_role(request.user)
        if role in STAFF_ROLES:
            return True
        if hasattr(obj, 'claimant') and obj.claimant == request.user:
            return True
        if hasattr(obj, 'holder') and obj.holder == request.user:
            return True
        if hasattr(obj, 'user') and obj.user == request.user:
            return True
        return False


class CanProcessClaims(permissions.BasePermission):
    """Admin, manager, and adjuster can process / approve / deny claims."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in PROCESSING_ROLES


class CanAssignClaims(permissions.BasePermission):
    """Admin and manager can assign claims to staff."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in MANAGEMENT_ROLES


class CanManageFraudAlerts(permissions.BasePermission):
    """Admin, manager, adjuster, reviewer can view; admin/manager/adjuster can resolve."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        role = _get_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return role in ('admin', 'manager', 'adjuster', 'reviewer')
        return role in ('admin', 'manager', 'adjuster')


class CanViewAnalytics(permissions.BasePermission):
    """Admin, manager, reviewer can view analytics and reports."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in OVERSIGHT_ROLES


class CanManageUsers(permissions.BasePermission):
    """Admin and manager can manage users (admin can manage all, manager can manage non-admin)."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and _get_role(request.user) in MANAGEMENT_ROLES
