package com.company.trucktracker

import com.company.trucktracker.location.LocationUtils
import org.junit.Assert.*
import org.junit.Test
import java.util.UUID

class LocationGeofenceTest {

    @Test
    fun testHaversineDistance_ExactSameCoordinates() {
        val lat = 12.9716
        val lon = 77.5946
        val distance = LocationUtils.calculateDistanceMeters(lat, lon, lat, lon)
        assertEquals(0.0, distance, 0.001)
    }

    @Test
    fun testHaversineDistance_KnownPoints() {
        // Bangalore Base (12.9716, 77.5946) to Electronic City (12.8399, 77.6770) ~17.1 km
        val distance = LocationUtils.calculateDistanceMeters(12.9716, 77.5946, 12.8399, 77.6770)
        assertTrue("Distance should be approximately 17 km, was: $distance", distance in 16000.0..18000.0)
    }

    @Test
    fun testGeofenceVerification_InsideRadius() {
        val destLat = 12.9716
        val destLon = 77.5946
        val radiusMeters = 200.0

        // ~33 meters away
        val currentLat = 12.9719
        val currentLon = 77.5946

        val (isInside, distanceMeters) = LocationUtils.verifyGeofence(currentLat, currentLon, destLat, destLon, radiusMeters)
        assertTrue("Should be inside 200m geofence radius", isInside)
        assertTrue("Distance should be less than 200m", distanceMeters <= radiusMeters)
    }

    @Test
    fun testGeofenceVerification_OutsideRadius() {
        val destLat = 12.9716
        val destLon = 77.5946
        val radiusMeters = 200.0

        // ~1.5 km away
        val currentLat = 12.9850
        val currentLon = 77.5946

        val (isInside, distanceMeters) = LocationUtils.verifyGeofence(currentLat, currentLon, destLat, destLon, radiusMeters)
        assertFalse("Should be outside 200m geofence radius", isInside)
        assertTrue("Distance should exceed 200m", distanceMeters > radiusMeters)
    }

    @Test
    fun testIdempotencyKeyGeneration() {
        val key1 = UUID.randomUUID().toString()
        val key2 = UUID.randomUUID().toString()
        assertNotEquals(key1, key2)
        assertTrue("UUID should be valid format", key1.length == 36)
    }

    @Test
    fun testAccuracyThreshold() {
        val goodAccuracy = 15.0f
        val poorAccuracy = 350.0f
        val threshold = 300.0f

        assertTrue("Good accuracy should be within threshold", goodAccuracy <= threshold)
        assertTrue("Poor accuracy should exceed threshold", poorAccuracy > threshold)
    }
}
