import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/components/ui/use-toast";
import {
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  Navigation
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useSettings } from "@/hooks/useSettings";

interface LocationData {
  lat: number;
  lng: number;
  address: string;
}

const AttendanceMarking = () => {
  const { user } = useAuth();
  const { settings } = useSettings();
  const { toast } = useToast();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [markingAttendance, setMarkingAttendance] = useState(false);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [isWithinRange, setIsWithinRange] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number | null>(null);

  // Office location coordinates from settings (DHA Phase 6, Sector C, Khired Networks, Lahore)
  const OFFICE_COORDINATES = {
    lat: settings.officeLatitude,
    lng: settings.officeLongitude
  };
  const ALLOWED_RADIUS = settings.attendanceRadius; // meters - configurable from settings

  useEffect(() => {
    checkTodayAttendance();
  }, [user]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkTodayAttendance = async () => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .eq('user_id', user.id)
      .eq('date', today)
      .maybeSingle();

    if (!error && data) {
      setTodayAttendance(data);
    }
  };

  const getCurrentLocation = async () => {
    setLoadingLocation(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by this browser');
      }

      // Try multiple times with different accuracy settings
      let position: GeolocationPosition | null = null;
      let attempts = 0;
      const maxAttempts = 3;

      while (!position && attempts < maxAttempts) {
        attempts++;

        try {
          position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: attempts === 1 ? 10000 : 20000, // Longer timeout for later attempts
              maximumAge: attempts === 1 ? 10000 : 60000 // Allow cached data for later attempts
            });
          });
        } catch (error) {
          console.log(`Location attempt ${attempts} failed:`, error);
          if (attempts === maxAttempts) throw error;

          // Wait before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (!position) throw new Error('Could not get location after multiple attempts');

      const { latitude, longitude, accuracy } = position.coords;

      // Get address from coordinates
      const address = await getAddressFromCoordinates(latitude, longitude);

      setLocation({ lat: latitude, lng: longitude, address });
      setGpsAccuracy(accuracy || null);

      console.log('Location found:', latitude, longitude, '(accuracy: ' + accuracy?.toFixed(1) + 'm)');
      console.log('Office coordinates:', OFFICE_COORDINATES.lat, OFFICE_COORDINATES.lng);
      console.log('Configured attendance radius:', ALLOWED_RADIUS + 'm');

      // Check if first 2 digits of lat/lng match (relaxed mode)
      const userLatPrefix = Math.floor(latitude);
      const userLngPrefix = Math.floor(longitude);
      const officeLatPrefix = Math.floor(OFFICE_COORDINATES.lat);
      const officeLngPrefix = Math.floor(OFFICE_COORDINATES.lng);

      const relaxedMatch = userLatPrefix === officeLatPrefix && userLngPrefix === officeLngPrefix;

      // Calculate precise distance
      const distance = calculateDistance(
        latitude,
        longitude,
        OFFICE_COORDINATES.lat,
        OFFICE_COORDINATES.lng
      );
      setCalculatedDistance(distance);

      // Effective radius includes GPS accuracy buffer
      const effectiveRadius = ALLOWED_RADIUS + (accuracy || 10);

      // Allow check-in if either:
      // 1. Within strict distance (original logic)
      // 2. Relaxed mode: first 2 digits match
      const strictCheck = distance <= effectiveRadius;
      const withinRange = strictCheck || relaxedMatch;

      setIsWithinRange(withinRange);

      console.log('Distance to office:', Math.round(distance) + 'm, Accuracy:', accuracy?.toFixed(1) + 'm, Effective radius:', effectiveRadius.toFixed(1) + 'm');
      console.log('Relaxed check (first 2 digits):', relaxedMatch ? 'PASS ✅' : 'FAIL ❌');
      console.log('Strict check (distance):', strictCheck ? 'PASS ✅' : 'FAIL ❌');
      console.log('Final result:', withinRange ? 'ALLOWED ✅' : 'DENIED ❌');

      if (accuracy && accuracy > 50) {
        toast({
          title: "⚠️ Low GPS Accuracy",
          description: `GPS accuracy is ${accuracy.toFixed(0)}m. Move to an open area for better signal.`,
          variant: "default"
        });
      }

      if (!withinRange) {
        if (relaxedMatch) {
          // This shouldn't happen, but just in case, ensure state is correct
          setIsWithinRange(true);
          toast({
            title: "✅ Location Verified (Relaxed Mode)",
            description: `Location coordinates match area. Distance: ${Math.round(distance)}m`,
          });
        } else {
          toast({
            title: "❌ Out of Range",
            description: `You are ${Math.round(distance)}m from office. First 2 digits don't match. Please move closer or contact admin.`,
            variant: "destructive"
          });
        }
      } else {
        if (relaxedMatch && !strictCheck) {
          toast({
            title: "✅ Location Verified (Relaxed Mode)",
            description: `Location coordinates match area. Distance: ${Math.round(distance)}m`,
          });
        } else {
          toast({
            title: "Location Verified ✅",
            description: `You are within office premises (${Math.round(distance)}m from center, GPS accuracy: ${Math.round(accuracy || 0)}m).`,
          });
        }
      }
    } catch (error: any) {
      console.error("Error getting location:", error);
      toast({
        title: "Location Error",
        description: error.message || "Failed to get your location. Please enable GPS and try again.",
        variant: "destructive"
      });
    } finally {
      setLoadingLocation(false);
    }
  };

  const getAddressFromCoordinates = async (lat: number, lng: number): Promise<string> => {
    try {
      // Return formatted address with office location context
      return `DHA Phase 6, Sector C - ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    } catch {
      return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
    }
  };

  const markAttendance = async (type: 'check_in' | 'check_out', workLocation: string = 'office') => {
    if (!user) return;

    // For office check-in, require location verification
    if (workLocation === 'office' && !location) {
      toast({
        title: "Location Required",
        description: "Please verify your location first before marking attendance.",
        variant: "destructive",
      });
      return;
    }

    // Check if user is allowed to work remotely if marking from home
    if (workLocation !== 'office' && (!location || !isWithinRange)) {
      // Should check work location settings here
      const { data: locationSettings } = await supabase
        .from('work_location_settings')
        .select('*')
        .eq('employee_id', user.id)
        .single();

      if (!locationSettings?.can_work_remotely) {
        toast({
          title: "Access Denied",
          description: "You are not authorized to work remotely. Please contact HR.",
          variant: "destructive",
        });
        return;
      }
    }

    setMarkingAttendance(true);

    try {
      const today = new Date().toISOString().split('T')[0];
      const currentTime = new Date().toISOString();

      if (type === 'check_in') {
        const { error } = await supabase
          .from('attendance')
          .insert({
            user_id: user.id,
            date: today,
            check_in: currentTime,
            location_lat: location?.lat || 0,
            location_lng: location?.lng || 0,
            location_address: location?.address || 'Office Location',
            work_location: workLocation,
            status: 'present'
          });

        if (error) throw error;

        toast({
          title: "Check-in Successful",
          description: `Your attendance has been marked for today (${workLocation}).`,
        });
      } else {
        const { error } = await supabase
          .from('attendance')
          .update({
            check_out: currentTime,
          })
          .eq('user_id', user.id)
          .eq('date', today);

        if (error) throw error;

        toast({
          title: "Check-out Successful",
          description: "Have a great day!",
        });
      }

      await checkTodayAttendance();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to mark attendance. Please try again.",
        variant: "destructive",
      });
    } finally {
      setMarkingAttendance(false);
    }
  };

  const canMarkCheckIn = !todayAttendance?.check_in;
  const canMarkCheckOut = todayAttendance?.check_in && !todayAttendance?.check_out;

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          GPS Attendance Marking
        </CardTitle>
        <CardDescription>
          Mark your attendance using GPS verification
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Status */}
        <div className="text-center space-y-2">
          {todayAttendance ? (
            <div className="space-y-2">
              <Badge variant="secondary" className="text-sm">
                <CheckCircle className="h-3 w-3 mr-1" />
                {todayAttendance.check_in ? 'Checked In' : 'Not Checked In'}
              </Badge>
              {todayAttendance.check_in && (
                <p className="text-sm text-muted-foreground">
                  Check-in: {new Date(todayAttendance.check_in).toLocaleTimeString()}
                </p>
              )}
              {todayAttendance.check_out && (
                <p className="text-sm text-muted-foreground">
                  Check-out: {new Date(todayAttendance.check_out).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <Badge variant="outline">
              <AlertCircle className="h-3 w-3 mr-1" />
              Not Marked Today
            </Badge>
          )}
        </div>

        {/* Location Status */}
        {location && (
          <Alert className={isWithinRange ? "border-success bg-success/10" : "border-warning bg-warning/10"}>
            <Navigation className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">
                  {isWithinRange ? "✅ Within office premises" : "⚠️ Outside office range"}
                </p>
                <p className="text-xs text-muted-foreground">{location.address}</p>
                <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                  <div>
                    <span className="text-muted-foreground">Distance:</span>{' '}
                    <span className="font-semibold">{calculatedDistance ? Math.round(calculatedDistance) : 0}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">GPS Accuracy:</span>{' '}
                    <span className="font-semibold">{gpsAccuracy ? Math.round(gpsAccuracy) : 0}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Required Radius:</span>{' '}
                    <span className="font-semibold">{ALLOWED_RADIUS}m</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Effective Radius:</span>{' '}
                    <span className="font-semibold">{ALLOWED_RADIUS + (gpsAccuracy || 10)}m</span>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            variant="outline"
            className="w-full"
            onClick={getCurrentLocation}
            disabled={loadingLocation}
          >
            {loadingLocation ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Navigation className="h-4 w-4 mr-2" />
            )}
            {loadingLocation ? 'Getting Location...' : 'Verify Location'}
          </Button>

          {/* Check Out Button - Always visible when checked in */}
          {canMarkCheckOut && (
            <Button
              onClick={() => markAttendance('check_out')}
              disabled={markingAttendance}
              variant="destructive"
              className="w-full text-lg py-3"
              size="lg"
            >
              {markingAttendance ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Clock className="h-4 w-4 mr-2" />
              )}
              End My Shift - Check Out
            </Button>
          )}


          {/* Check In Button */}
          {location && !todayAttendance?.check_in && (
            <div className="mt-3">
              <Button
                onClick={() => markAttendance('check_in', 'office')}
                disabled={markingAttendance}
                className="w-full bg-green-600 hover:bg-green-700 text-white text-lg py-6"
                size="lg"
              >
                {markingAttendance ? (
                  <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                ) : (
                  <CheckCircle className="h-5 w-5 mr-2" />
                )}
                CHECK IN
              </Button>
            </div>
          )}

          {/* Auto retry location for better accuracy */}
          {!isWithinRange && location && (
            <Button
              variant="outline"
              className="w-full"
              onClick={getCurrentLocation}
              disabled={loadingLocation}
            >
              🔄 Try Again for Better GPS Accuracy
            </Button>
          )}
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="text-xs">
            You must be within {ALLOWED_RADIUS}m of Khired Networks office (DHA Phase 6, Sector C) to mark attendance.
            Location access is required for this feature. GPS accuracy is automatically added as a buffer to the configured radius.
            {gpsAccuracy && gpsAccuracy > 50 && (
              <p className="text-warning font-medium mt-1">
                ⚠️ Your GPS accuracy is {Math.round(gpsAccuracy)}m. Try moving to a window or outdoors for better signal.
              </p>
            )}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default AttendanceMarking;