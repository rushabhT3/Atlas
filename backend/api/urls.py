from django.urls import path
from . import views

urlpatterns = [
    path('generate-trip/', views.generate_trip, name='generate_trip'),
]