// Replace with your actual keys
const MAPTILER_API_KEY = '420YJC5GYZBi5RBTIzNj';
const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYxOGQ2MGQ4MDU0NTRiNWJiMWFhODU3ZTYyNWY4NDBkIiwiaCI6Im11cm11cjY0In0=';

const map = new maplibregl.Map({
  container: 'map',
  style: `https://api.maptiler.com/maps/streets/style.json?key=${MAPTILER_API_KEY}`,
  center: [78.9629, 20.5937], // India
  zoom: 4
});

let routeLayer = null;
let searchMarker = null;

// -------------------------
// Location Search
// -------------------------
async function geocode(query) {
  const response = await fetch(`https://api.maptiler.com/geocoding/${encodeURIComponent(query)}.json?key=${MAPTILER_API_KEY}`);
  const data = await response.json();
  if (data.features.length > 0) {
    const [lon, lat] = data.features[0].geometry.coordinates;
    return { lat, lon };
  } else {
    throw new Error('Location not found');
  }
}

async function performSearch(query) {
  try {
    const coords = await geocode(query);
    if (searchMarker) searchMarker.remove();
    searchMarker = new maplibregl.Marker().setLngLat([coords.lon, coords.lat]).addTo(map);
    map.flyTo({ center: [coords.lon, coords.lat], zoom: 14 });
  } catch (err) {
    alert(err.message);
  }
}

document.getElementById('searchBox').addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    performSearch(e.target.value);
  }
});

document.getElementById('searchBtn').addEventListener('click', () => {
  const query = document.getElementById('searchBox').value;
  if (query) performSearch(query);
});

// -------------------------
// Route Planner
// -------------------------
document.getElementById('routeBtn').addEventListener('click', async () => {
  const fromText = document.getElementById('fromBox').value;
  const toText = document.getElementById('toBox').value;
  const routeInfo = document.getElementById('routeInfo');
  routeInfo.innerText = '';

  if (!fromText || !toText) return alert("Enter both 'From' and 'To' addresses.");

  try {
    const fromCoords = await geocode(fromText);
    const toCoords = await geocode(toText);

    const body = {
      coordinates: [
        [fromCoords.lon, fromCoords.lat],
        [toCoords.lon, toCoords.lat]
      ]
    };

    const response = await fetch(`https://api.openrouteservice.org/v2/directions/driving-car`, {
      method: 'POST',
      headers: {
        'Authorization': ORS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    // Clean previous
    if (routeLayer) map.removeLayer('route');
    if (map.getSource('route')) map.removeSource('route');

    map.addSource('route', {
      type: 'geojson',
      data: data
    });

    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': '#2c7be5',
        'line-width': 6
      }
    });

    const coords = data.features[0].geometry.coordinates;
    map.fitBounds([coords[0], coords[coords.length - 1]], { padding: 50 });

    // Show route info
    const summary = data.features[0].properties.summary;
    const distKm = (summary.distance / 1000).toFixed(2);
    const durationMin = (summary.duration / 60).toFixed(1);
    routeInfo.innerText = `Distance: ${distKm} km · Duration: ${durationMin} mins`;

  } catch (err) {
    console.error(err);
    alert("Could not retrieve route.");
  }
});
