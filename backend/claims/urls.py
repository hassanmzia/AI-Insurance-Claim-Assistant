from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'claims', views.ClaimViewSet, basename='claim')
router.register(r'policies', views.InsurancePolicyViewSet, basename='policy')
router.register(r'policy-documents', views.PolicyDocumentViewSet, basename='policy-document')
router.register(r'fraud-alerts', views.FraudAlertViewSet, basename='fraud-alert')
router.register(r'agent-tasks', views.AgentTaskViewSet, basename='agent-task')
router.register(r'notifications', views.NotificationViewSet, basename='notification')

urlpatterns = [
    path('health/', views.health_check, name='health-check'),
    path('auth/register/', views.register, name='register'),
    path('auth/me/', views.current_user, name='current-user'),
    path('auth/profile/', views.update_profile, name='update-profile'),
    path('auth/change-password/', views.change_password, name='change-password'),
    path('auth/delete-account/', views.delete_account, name='delete-account'),
    path('admin/users/', views.list_users, name='admin-list-users'),
    path('admin/users/create/', views.create_user, name='admin-create-user'),
    path('admin/users/<int:user_id>/', views.update_user, name='admin-update-user'),
    path('staff/', views.list_staff, name='list-staff'),
    path('dashboard/', views.dashboard_summary, name='dashboard'),
    path('analytics/', views.analytics_report, name='analytics'),
    path('', include(router.urls)),
]
