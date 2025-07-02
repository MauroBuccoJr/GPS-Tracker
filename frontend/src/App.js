import { useEffect, useState } from 'react';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const customIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png',
  iconSize: [32, 32]
});

function App() {
  const [coords, setCoords] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await axios.get('/api/ultimas-coordenadas');
      setCoords(res.data);
    };
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div>
      <h1>Localização do Objeto</h1>
      <MapContainer center={[-25.4284, -49.2733]} zoom={13} style={{ height: '90vh' }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        {coords.map((c, idx) => (
          <Marker key={idx} position={[c.latitude, c.longitude]} icon={customIcon}>
            <Popup>
              <strong>{c.objeto_id}</strong><br />
              {new Date(c.timestamp).toLocaleString()}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

export default App;

