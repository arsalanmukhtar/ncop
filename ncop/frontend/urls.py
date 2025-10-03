from django.urls import path
from . import views

urlpatterns = [
    path("", views.login_view, name="home"),  # Redirect home to login
    path("dashboard/", views.index, name="dashboard"),
    path("accounts/login/", views.login_view, name="login"),
    path("accounts/signup/", views.signup_view, name="signup"),
    path("accounts/logout/", views.logout_view, name="logout"),
    path("accounts/password_reset/", views.password_reset_request, name="password_reset"),
    path("accounts/reset/<uidb64>/<token>/", views.password_reset_confirm, name="password_reset_confirm"),
]