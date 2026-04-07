# Legacy API views - uses shared service
from rest_framework.decorators import api_view
from rest_framework.response import Response
from services.trip_service import process_trip_request


@api_view(["POST"])
def generate_trip(request):
    """Legacy endpoint - uses shared service"""
    result, status_code = process_trip_request(request.data)
    return Response(result, status=status_code)
