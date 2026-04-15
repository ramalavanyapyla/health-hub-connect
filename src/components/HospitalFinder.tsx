import { useState, useEffect } from "react";
import { MapPin, Navigation, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Hospital {
  name: string;
  lat: number;
  lon: number;
  distance: number;
}

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

const HospitalFinder = () => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);

  useEffect(() => {
    fetchHospitals();
  }, []);

  const fetchHospitals = async () => {
    setLoading(true);
    setError(null);

    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const { latitude: lat, longitude: lon } = pos.coords;
      setUserLoc({ lat, lon });

      const radius = 10000; // 10km
      const query = `[out:json][timeout:10];(node["amenity"="hospital"](around:${radius},${lat},${lon});way["amenity"="hospital"](around:${radius},${lat},${lon}););out center 10;`;

      const resp = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: `data=${encodeURIComponent(query)}`,
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      });

      if (!resp.ok) throw new Error("Failed to fetch hospitals");

      const data = await resp.json();
      const results: Hospital[] = data.elements
        .map((el: any) => {
          const elLat = el.lat || el.center?.lat;
          const elLon = el.lon || el.center?.lon;
          const name = el.tags?.name || "Hospital";
          if (!elLat || !elLon) return null;
          return {
            name,
            lat: elLat,
            lon: elLon,
            distance: haversineDistance(lat, lon, elLat, elLon),
          };
        })
        .filter(Boolean)
        .sort((a: Hospital, b: Hospital) => a.distance - b.distance)
        .slice(0, 5);

      setHospitals(results);
      if (results.length === 0) setError("No hospitals found nearby. Please call emergency services.");
    } catch (e: any) {
      if (e?.code === 1) {
        setError("Location access denied. Please enable location to find nearby hospitals.");
      } else {
        setError("Could not find hospitals. Please call emergency services.");
      }
    } finally {
      setLoading(false);
    }
  };

  const openMap = (h: Hospital) => {
    window.open(`https://www.openstreetmap.org/directions?from=${userLoc?.lat},${userLoc?.lon}&to=${h.lat},${h.lon}`, "_blank");
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
        <Loader2 className="h-3 w-3 animate-spin" /> Finding nearby hospitals...
      </div>
    );
  }

  if (error) {
    return <p className="text-xs text-destructive">{error}</p>;
  }

  return (
    <div className="space-y-1.5">
      {hospitals.map((h, i) => (
        <div key={i} className="flex items-center justify-between rounded-md bg-background p-2 text-xs">
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin className="h-3 w-3 text-destructive shrink-0" />
            <span className="truncate font-medium">{h.name}</span>
          </div>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            <span className="text-muted-foreground">{h.distance.toFixed(1)} km</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openMap(h)}>
              <Navigation className="h-3 w-3" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default HospitalFinder;
