from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path("admin/", admin.site.urls),
    path("", include("frontend.urls")),  # authentication and dashboard
    path("backend/", include("backend.urls")),  # for JSON API routes
]
