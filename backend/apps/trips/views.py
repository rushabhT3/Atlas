# Trips app views - uses shared service
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from services.trip_service import process_trip_request


@api_view(["POST"])
def generate_trip(request):
    """Generate trip plan with FMCSA compliance"""
    result, status_code = process_trip_request(request.data)
    return Response(result, status=status_code)


@api_view(["GET"])
def early_starter():
    """API pre-loads on app load to avoid cold-start latency."""
    return Response({"message": "early starter endpoint"}, status=status.HTTP_200_OK)
