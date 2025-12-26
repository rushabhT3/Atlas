import requests

# ============================================
# FMCSA REGULATIONS
# ============================================
MAX_DRIVE_TIME = 11.0  # 11-hour driving limit
MAX_DUTY_WINDOW = 14.0  # 14-hour duty window
BREAK_REQUIRED_AFTER = 8.0  # 30-min break after 8 hours driving
MIN_BREAK = 0.5  # 30 minutes
SLEEPER_REST = 10.0  # 10-hour sleeper berth reset
FUEL_INTERVAL = 1000.0  # Fuel every 1000 miles
LOAD_UNLOAD_TIME = 1.0  # 1 hour for pickup/dropoff
MAX_CYCLE_LIMIT = 70.0  # 70-hour/8-day cycle
RESTART_34 = 34.0  # 34-hour restart

AVG_SPEED = 55.0  # Average driving speed


def get_osrm_route(start_coords, end_coords):
    """Get route from OSRM API"""
    url = f"http://router.project-osrm.org/route/v1/driving/{start_coords};{end_coords}?overview=full&geometries=geojson"
    try:
        res = requests.get(url, timeout=30).json()
        if "routes" not in res or len(res["routes"]) == 0:
            return None
        route = res["routes"][0]
        return {
            "distance_miles": route["distance"] * 0.000621371,
            "geometry": route["geometry"],
        }
    except Exception as e:
        print(f"OSRM Error: {e}")
        return None


def geocode(place):
    """Convert address to coordinates"""
    url = f"https://nominatim.openstreetmap.org/search?q={place}&format=json&limit=1&countrycodes=us"
    headers = {"User-Agent": "SpotterELD/1.0"}
    try:
        res = requests.get(url, headers=headers, timeout=15).json()
        if not res:
            return None
        return f"{res[0]['lon']},{res[0]['lat']}"
    except Exception as e:
        print(f"Geocode Error: {e}")
        return None


def interpolate_along_route(geometry_coords, fraction):
    """
    Get a point along the route at a given fraction (0.0 to 1.0)
    Uses LOCAL interpolation - NO API calls needed!
    """
    if not geometry_coords or len(geometry_coords) == 0:
        return None

    fraction = max(0.0, min(1.0, fraction))

    if len(geometry_coords) == 1:
        return f"{geometry_coords[0][0]},{geometry_coords[0][1]}"

    # Calculate total route length (approximate using coordinate distances)
    total_length = 0
    segment_lengths = []

    for i in range(len(geometry_coords) - 1):
        p1 = geometry_coords[i]
        p2 = geometry_coords[i + 1]
        # Simple euclidean distance (good enough for interpolation)
        seg_len = ((p2[0] - p1[0]) ** 2 + (p2[1] - p1[1]) ** 2) ** 0.5
        segment_lengths.append(seg_len)
        total_length += seg_len

    if total_length == 0:
        return f"{geometry_coords[0][0]},{geometry_coords[0][1]}"

    # Find the point at the given fraction
    target_distance = fraction * total_length
    current_distance = 0

    for i, seg_len in enumerate(segment_lengths):
        if current_distance + seg_len >= target_distance:
            # Interpolate within this segment
            seg_fraction = (
                (target_distance - current_distance) / seg_len if seg_len > 0 else 0
            )
            p1 = geometry_coords[i]
            p2 = geometry_coords[i + 1]
            lon = p1[0] + (p2[0] - p1[0]) * seg_fraction
            lat = p1[1] + (p2[1] - p1[1]) * seg_fraction
            return f"{lon},{lat}"
        current_distance += seg_len

    # Return last point if we've gone past
    last = geometry_coords[-1]
    return f"{last[0]},{last[1]}"


def calculate_schedule(current_loc, pickup_loc, dropoff_loc, cycle_used_input):
    """
    Main scheduling function - handles ANY distance
    """

    # 1. Geocode all locations
    curr_coords = geocode(current_loc)
    pick_coords = geocode(pickup_loc)
    drop_coords = geocode(dropoff_loc)

    if not curr_coords:
        return {"error": f"Could not locate current location: {current_loc}"}
    if not pick_coords:
        return {"error": f"Could not locate pickup location: {pickup_loc}"}
    if not drop_coords:
        return {"error": f"Could not locate dropoff location: {dropoff_loc}"}

    # 2. Get routes (only 2 API calls total!)
    leg1 = get_osrm_route(curr_coords, pick_coords)
    if not leg1:
        return {"error": "Could not calculate route from Current Location to Pickup."}

    leg2 = get_osrm_route(pick_coords, drop_coords)
    if not leg2:
        return {"error": "Could not calculate route from Pickup to Dropoff."}

    # Store geometries for local interpolation (NO more API calls needed!)
    leg1_geometry = leg1["geometry"]["coordinates"] if leg1.get("geometry") else []
    leg2_geometry = leg2["geometry"]["coordinates"] if leg2.get("geometry") else []

    # Initialize trackers
    logs = []
    stops = []
    current_time = 6.0  # Start at 6:00 AM
    cycle_used = float(cycle_used_input) if cycle_used_input else 0.0
    drive_clock = 0.0
    window_clock = 0.0
    since_break_clock = 0.0
    miles_since_fuel = 0.0

    # --- HELPER FUNCTION ---
    def add_event(status, duration, loc_coords, remark, stop_type=None):
        nonlocal current_time, cycle_used, window_clock, drive_clock, since_break_clock

        duration = max(0, duration)
        start = current_time
        end = current_time + duration

        logs.append(
            {
                "status": status,
                "start": round(start, 3),
                "end": round(end, 3),
                "location": loc_coords,
                "remarks": remark,
            }
        )

        if stop_type:
            stops.append(
                {
                    "coords": loc_coords,
                    "type": stop_type,
                    "remark": remark,
                    "time": round(start, 3),
                    "duration": round(duration, 3),
                }
            )

        current_time = end

        if status == "DRIVING":
            drive_clock += duration
            since_break_clock += duration
            cycle_used += duration
            window_clock += duration
        elif status == "ON_DUTY":
            cycle_used += duration
            window_clock += duration
            if duration >= 0.5:
                since_break_clock = 0
        elif status in ["OFF_DUTY", "SLEEPER"]:
            window_clock += duration
            if duration >= 0.5:
                since_break_clock = 0
            if duration >= 10.0:
                drive_clock = 0
                window_clock = 0
                since_break_clock = 0
            if duration >= 34.0:
                cycle_used = 0

    # --- POSITION HELPER ---
    def get_position(geometry_coords, fraction, fallback_coords):
        """Get position with proper string fallback"""
        pos = interpolate_along_route(geometry_coords, fraction)
        return pos if pos else fallback_coords

    # --- DRIVING SIMULATION FUNCTION ---
    def drive_leg(start_coords, total_miles, geometry_coords, leg_name):
        nonlocal miles_since_fuel

        remaining = total_miles
        driven_on_leg = 0.0

        while remaining > 0.5:  # 0.5 mile tolerance

            # Current position on this leg
            fraction = driven_on_leg / total_miles if total_miles > 0 else 0
            current_pos = get_position(geometry_coords, fraction, start_coords)

            # Calculate available driving time under each constraint
            time_to_finish = remaining / AVG_SPEED
            time_until_11hr = max(0, MAX_DRIVE_TIME - drive_clock)
            time_until_14hr = max(0, MAX_DUTY_WINDOW - window_clock)
            time_until_8hr = max(0, BREAK_REQUIRED_AFTER - since_break_clock)
            time_until_70hr = max(0, MAX_CYCLE_LIMIT - cycle_used)
            time_until_fuel = max(0, (FUEL_INTERVAL - miles_since_fuel) / AVG_SPEED)

            # Determine limiting factor
            limiting_time = min(
                time_to_finish,
                time_until_11hr,
                time_until_14hr,
                time_until_8hr,
                time_until_70hr,
                time_until_fuel,
            )

            # If we can't drive at all, take required rest
            if limiting_time <= 0.001:
                # Determine which limit we hit
                if time_until_70hr <= 0.001:
                    add_event(
                        "OFF_DUTY",
                        RESTART_34,
                        current_pos,
                        "34-hr Restart (Cycle Reset)",
                        "restart",
                    )
                elif time_until_11hr <= 0.001 or time_until_14hr <= 0.001:
                    add_event(
                        "SLEEPER",
                        SLEEPER_REST,
                        current_pos,
                        "10-hr Sleeper Berth",
                        "sleep",
                    )
                elif time_until_8hr <= 0.001:
                    add_event(
                        "OFF_DUTY", MIN_BREAK, current_pos, "30-min Break", "break"
                    )
                elif time_until_fuel <= 0.001:
                    add_event("ON_DUTY", 0.5, current_pos, "Fuel Stop", "fuel")
                    miles_since_fuel = 0
                continue

            # Check what stops the drive
            if limiting_time >= time_to_finish:
                # We can finish this leg!
                add_event(
                    "DRIVING", time_to_finish, f"En Route ({leg_name})", "Driving"
                )
                miles_driven = remaining
                remaining = 0
            else:
                # We need to stop for something
                miles_driven = limiting_time * AVG_SPEED
                add_event("DRIVING", limiting_time, f"En Route ({leg_name})", "Driving")
                remaining -= miles_driven

            driven_on_leg += miles_driven
            miles_since_fuel += miles_driven

            # Now handle the stop if we didn't finish
            if remaining > 0.5:
                fraction = driven_on_leg / total_miles if total_miles > 0 else 1
                stop_pos = get_position(geometry_coords, fraction, current_pos)

                # Check what we need
                new_time_until_fuel = (FUEL_INTERVAL - miles_since_fuel) / AVG_SPEED

                if new_time_until_fuel <= 0.001:
                    add_event("ON_DUTY", 0.5, stop_pos, "Fuel Stop", "fuel")
                    miles_since_fuel = 0
                elif MAX_CYCLE_LIMIT - cycle_used <= 0.001:
                    add_event(
                        "OFF_DUTY",
                        RESTART_34,
                        stop_pos,
                        "34-hr Restart (Cycle Reset)",
                        "restart",
                    )
                elif (
                    MAX_DRIVE_TIME - drive_clock <= 0.001
                    or MAX_DUTY_WINDOW - window_clock <= 0.001
                ):
                    add_event(
                        "SLEEPER",
                        SLEEPER_REST,
                        stop_pos,
                        "10-hr Sleeper Berth",
                        "sleep",
                    )
                elif BREAK_REQUIRED_AFTER - since_break_clock <= 0.001:
                    add_event("OFF_DUTY", MIN_BREAK, stop_pos, "30-min Break", "break")

    # ========================================
    # EXECUTE TRIP
    # ========================================

    # Starting point
    stops.append(
        {
            "coords": curr_coords,
            "type": "start",
            "remark": "Trip Start",
            "time": current_time,
            "duration": 0,
        }
    )

    # Pre-trip inspection
    add_event("ON_DUTY", 0.25, curr_coords, "Pre-trip Inspection", "inspection")

    # LEG 1: Current -> Pickup
    drive_leg(curr_coords, leg1["distance_miles"], leg1_geometry, "to Pickup")

    # Pickup (1 hour loading)
    add_event("ON_DUTY", LOAD_UNLOAD_TIME, pick_coords, "Loading at Pickup", "pickup")

    # LEG 2: Pickup -> Dropoff
    drive_leg(pick_coords, leg2["distance_miles"], leg2_geometry, "to Dropoff")

    # Dropoff (1 hour unloading)
    add_event(
        "ON_DUTY", LOAD_UNLOAD_TIME, drop_coords, "Unloading at Dropoff", "dropoff"
    )

    # End point
    stops.append(
        {
            "coords": drop_coords,
            "type": "end",
            "remark": "Trip Complete",
            "time": current_time,
            "duration": 0,
        }
    )

    # ========================================
    # BUILD RESPONSE
    # ========================================

    # Calculate summary
    total_drive = sum(l["end"] - l["start"] for l in logs if l["status"] == "DRIVING")
    total_rest = sum(
        l["end"] - l["start"] for l in logs if l["status"] in ["OFF_DUTY", "SLEEPER"]
    )
    total_on_duty = sum(l["end"] - l["start"] for l in logs if l["status"] == "ON_DUTY")
    trip_duration = current_time - 6.0

    return {
        "logs": logs,
        "stops": stops,
        "route_geometry": {
            "leg1": {"type": "LineString", "coordinates": leg1_geometry},
            "leg2": {"type": "LineString", "coordinates": leg2_geometry},
        },
        "summary": {
            "total_miles": round(leg1["distance_miles"] + leg2["distance_miles"], 1),
            "leg1_miles": round(leg1["distance_miles"], 1),
            "leg2_miles": round(leg2["distance_miles"], 1),
            "total_drive_time": round(total_drive, 1),
            "total_rest_time": round(total_rest, 1),
            "total_on_duty_time": round(total_on_duty, 1),
            "total_trip_time": round(trip_duration, 1),
            "num_stops": len(stops),
            "num_days": max(1, int(current_time / 24) + 1),
        },
    }
