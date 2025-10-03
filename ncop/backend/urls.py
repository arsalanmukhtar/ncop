from django.urls import path
from .views import index_json

urlpatterns = [
    path("api/index.json", index_json, name="index-json"),
]
