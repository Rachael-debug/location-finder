import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import SearchForm from "./SearchForm";

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN;

export default function Map() {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const [lng] = useState<number>(-98.5795); 
  const [lat] = useState<number>(39.8283); 
  const [zoom] = useState<number>(10);

  // Initialize map
  useEffect(() => {
    if (mapRef.current) return; // Prevent multiple initializations

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current!,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: zoom,
    });

    // Add navigation controls (zoom buttons, compass)
    mapRef.current.addControl(new mapboxgl.NavigationControl(), "top-right");

     // Listen for clicks
    mapRef.current.on("click", async (e) => {
      const coords: [number, number] = [e.lngLat.lng, e.lngLat.lat];
      console.log("Clicked coords:", coords);

      // Call reverse geocoding API
      try {
        const response = await fetch(
          `https://api.mapbox.com/search/geocode/v6/reverse?longitude=${coords[0]}&latitude=${coords[1]}&access_token=${mapboxgl.accessToken}`
        );
        const data = await response.json();

        const placeName = data.features?.[0]?.properties.full_address || "Unknown location";
        
        // Remove old marker
        if (markerRef.current) {
          markerRef.current.remove();
        }
        
        if (mapRef.current) {
          markerRef.current = new mapboxgl.Marker({ color: "blue" })
            .setLngLat(coords)
            .setPopup(
              new mapboxgl.Popup().setHTML(
                `<p class="text-blue-700">${placeName}</p>`
              )
            )
            .addTo(mapRef.current);

          markerRef.current.togglePopup(); // auto-open popup
        }
      } catch (err) {
        console.error("Reverse geocoding failed:", err);
      }
    });
  }, []);

  // Handle search selection
  const handleSearch = (location: string, coords?: [number, number]) => {
    if (!mapRef.current || !coords) return;

    const [lng, lat] = coords;

    // Move map to new location
    mapRef.current.flyTo({
      center: [lng, lat],
      zoom: 13,
      essential: true,
    });

    // Remove old marker if exists
    if (markerRef.current) {
      markerRef.current.remove();
    }

    // Add new marker
    markerRef.current = new mapboxgl.Marker({ color: "red" })
      .setLngLat([lng, lat])
      .setPopup(new mapboxgl.Popup().setHTML(`<h4 class="text-blue-700">${location}</h4>`)) // popup with name
      .addTo(mapRef.current);

      markerRef.current.togglePopup();
  };

  return (
    <div className="relative w-full h-screen">
      {/* Search bar */}
      <div>
        <SearchForm onSearch={handleSearch} />
      </div>

      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full mt-18" >
        {/* Map will render here */}
      </div>
    </div>
  );
}
