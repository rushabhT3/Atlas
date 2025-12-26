# Create your views here.
from rest_framework.decorators import api_view
from rest_framework.response import Response
from .utils import calculate_schedule

@api_view(['POST'])
def generate_trip(request):
    data = request.data
    # Processing the required inputs
    result = calculate_schedule(
        current_loc=data.get('current'),
        pickup_loc=data.get('pickup'),
        dropoff_loc=data.get('dropoff'),
        cycle_used_input=data.get('cycle', 0)
    )
    return Response(result)