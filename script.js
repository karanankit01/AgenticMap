const map = L.map('map').setView([20.5937, 78.9629], 5); // India center

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
}).addTo(map);

let routeLayer;

document.getElementById('searchBox').addEventListener('keypress', function (e) {
  if (e.key === 'Enter') {
    const query = e.target.value;
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      .then(res => res.json())
      .then(data => {
        if (data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          map.setView([lat, lon], 13);
          L.marker([lat, lon]).addTo(map)
            .bindPopup(query)
            .openPopup();
        } else {
          alert("Location not found");
        }
      });
  }
});

document.getElementById('routeBtn').addEventListener('click', function () {
  const from = document.getElementById('fromBox').value;
  const to = document.getElementById('toBox').value;
  if (!from || !to) {
    alert("Please enter both 'From' and 'To' addresses.");
    return;
  }

  Promise.all([
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${from}`).then(r => r.json()),
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${to}`).then(r => r.json())
  ]).then(([fromData, toData]) => {
    if (fromData.length === 0 || toData.length === 0) {
      alert("One of the locations could not be found.");
      return;
    }

    const fromCoords = [fromData[0].lon, fromData[0].lat];
    const toCoords = [toData[0].lon, toData[0].lat];

    getRoute(fromCoords, toCoords);
  });
});

const ORS_API_KEY = 'eyJvcmciOiI1YjNjZTM1OTc4NTExMTAwMDFjZjYyNDgiLCJpZCI6IjYxOGQ2MGQ4MDU0NTRiNWJiMWFhODU3ZTYyNWY4NDBkIiwiaCI6Im11cm11cjY0In0='; // Replace with your real API key

function getRoute(from, to) {
  const url = `https://api.openrouteservice.org/v2/directions/driving-car?api_key=${ORS_API_KEY}`;
  fetch(url, {
    method: 'POST',
    headers: {
      'Accept': 'application/json, application/geo+json, application/gpx+xml, img/png; charset=utf-8',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      coordinates: [from, to]
    })
  })
    .then(res => res.json())
    .then(data => {
      if (routeLayer) {
        map.removeLayer(routeLayer);
      }

      routeLayer = L.geoJSON(data, {
        style: {
          color: 'blue',
          weight: 4
        }
      }).addTo(map);

      map.fitBounds(routeLayer.getBounds());
    })
    .catch(err => {
      console.error(err);
      alert("Failed to get route.");
    });
}
