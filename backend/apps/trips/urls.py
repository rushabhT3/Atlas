from django.urls import path
from . import views

app_name = "trips"

urlpatterns = [
    path("generate/", views.generate_trip, name="generate_trip"),
    path("auto-early-flight/", views.early_starter, name="early_starter"),
]
