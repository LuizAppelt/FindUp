import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext';
import { getPoints, postPoint } from '../services/mapService';

const containerStyle = { width: '100%', height: '100vh' };
const defaultCenter = { lat: -28.2612, lng: -52.4083 };

const darkMinimalistStyle = [
  { elementType: "geometry", stylers: [{ color: "#121212" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
];

export default function MapScreen() {
  const { token } = useAuth();

  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(true);
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ id: null, title: '', description: '', type: 'lost' });
  const [hoveredItem, setHoveredItem] = useState(null);

  // Geolocalização
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setIsLocating(false);
      return;
    }

    const onSuccess = (position) => {
      setMapCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
      setIsLocating(false);
    };

    const onError = () => {
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        () => setIsLocating(false),
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    });
  }, []);

  // Carregar pontos da API
  useEffect(() => {
    async function loadMarkers() {
      if (!token) return;
      try {
        const apiPoints = await getPoints(token);
        // getPoints já mapeia: { id, title, position: { lat, lng } }
        // Precisamos também de tipo para o ícone — adicionamos 'lost' como padrão se não vier
        const mapped = apiPoints.map(p => ({
          ...p,
          type: p.tipo || 'lost',
          description: p.detalhes || ''
        }));
        setItems(mapped);
      } catch (err) {
        console.error("Erro ao carregar pontos:", err.message);
      }
    }
    loadMarkers();
  }, [token]);

  // Clique no mapa para criar novo ponto
  const handleMapClick = useCallback((event) => {
    setSelectedLocation({ lat: event.latLng.lat(), lng: event.latLng.lng() });
    setFormData({ id: null, title: '', description: '', type: 'lost' });
    setIsModalOpen(true);
  }, []);

  // Clique no marcador para ver/editar
  const handleMarkerClick = (item) => {
    const lat = item.position?.lat || item.lat;
    const lng = item.position?.lng || item.lng;
    setSelectedLocation({ lat, lng });
    setFormData({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'lost'
    });
    setIsModalOpen(true);
  };

  // Salvar ponto
  const handleSave = async (e) => {
    e.preventDefault();
    setLoadingSave(true);

    // Payload exato que o PointDTO do back espera
    const pointPayload = {
      descricao: formData.title,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng,
      tipo: formData.type,
      detalhes: formData.description
    };

    try {
      if (formData.id) {
        // Edição local (PUT ainda não implementado no back)
        setItems(prev => prev.map(item =>
          item.id === formData.id
            ? { ...item, title: formData.title, description: formData.description, type: formData.type }
            : item
        ));
      } else {
        // Criação via API
        const saved = await postPoint(token, pointPayload);

        const newItem = {
          id: saved?.id || Date.now(),
          title: formData.title,
          description: formData.description,
          type: formData.type,
          position: selectedLocation
        };

        setItems(prev => [...prev, newItem]);
      }

      setIsModalOpen(false);
    } catch (err) {
      alert("Falha ao salvar: " + err.message);
    } finally {
      setLoadingSave(false);
    }
  };

  // Deletar ponto localmente
  const handleDelete = () => {
    if (formData.id) {
      setItems(prev => prev.filter(item => item.id !== formData.id));
    }
    setIsModalOpen(false);
  };

  const getMarkerIcon = (type) => type === 'found'
    ? 'https://cdn-icons-png.flaticon.com/128/149/149060.png'
    : 'https://cdn-icons-png.flaticon.com/128/2776/2776067.png';

  return (
    <div className="relative w-full h-screen bg-[#121212] overflow-hidden font-sans text-white">

      {/* Header */}
        <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight drop-shadow-lg">FindUP</h1>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-lg pointer-events-auto cursor-pointer" />
      </div>

      {/* Mapa */}
      <div className="absolute inset-0">
        {isLoaded && !isLocating ? (
          <GoogleMap
            language="pt-BR"
            mapContainerStyle={containerStyle}
            center={mapCenter}
            zoom={15}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: darkMinimalistStyle,
              gestureHandling: 'greedy'
            }}
          >
            {items.map(item => {
              if (!item?.id) return null;
              const lat = item.position?.lat || item.lat;
              const lng = item.position?.lng || item.lng;
              if (!lat || !lng) return null;

              return (
                <MarkerF
                  key={item.id}
                  position={{ lat, lng }}
                  onClick={() => handleMarkerClick(item)}
                  onMouseOver={() => setHoveredItem(item)}
                  onMouseOut={() => setHoveredItem(null)}
                  icon={{
                    url: getMarkerIcon(item.type),
                    scaledSize: new window.google.maps.Size(35, 35)
                  }}
                />
              );
            })}

            {hoveredItem && (() => {
              const lat = hoveredItem.position?.lat || hoveredItem.lat;
              const lng = hoveredItem.position?.lng || hoveredItem.lng;
              return (
                <InfoWindowF
                  position={{ lat, lng }}
                  options={{ pixelOffset: new window.google.maps.Size(0, -35), disableAutoPan: true }}
                >
                  <div className="p-1 max-w-[180px] text-gray-800 font-sans">
                    <h3 className="font-bold text-sm truncate">{hoveredItem.title}</h3>
                    {hoveredItem.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{hoveredItem.description}</p>
                    )}
                    <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${hoveredItem.type === 'found' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                      {hoveredItem.type === 'found' ? 'Encontrado' : 'Perdido'}
                    </span>
                  </div>
                </InfoWindowF>
              );
            })()}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white" />
            <p className="text-gray-400 text-sm animate-pulse">Carregando mapa e localização...</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
            <h2 className="text-xl font-bold mb-4">
              {formData.id ? 'Detalhes do Objeto' : 'Registrar Objeto'}
            </h2>

            <form onSubmit={handleSave} className="flex flex-col gap-4">

              {/* Toggle tipo */}
              <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'lost' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'lost' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Perdi algo
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'found' })}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'found' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Achei algo
                </button>
              </div>

              {/* Nome */}
              <input
                type="text"
                placeholder="O que é? (ex: Chave, Carteira)"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors text-sm"
              />

              {/* Detalhes */}
              <textarea
                placeholder="Detalhes (cor, marca, onde perdeu/achou)..."
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors text-sm resize-none"
              />

              {/* Botões */}
              <div className="flex gap-3 mt-2">
                <button
                  type="button"
                  disabled={loadingSave}
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-3 text-sm font-medium transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loadingSave}
                  className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors text-white shadow-lg disabled:opacity-50 ${formData.type === 'lost' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  {loadingSave ? 'Salvando...' : 'Salvar'}
                </button>
              </div>

              {formData.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="w-full mt-2 text-red-400 hover:text-red-300 text-sm font-medium py-2 transition-colors underline"
                >
                  Remover do Mapa
                </button>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Bottom Nav */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-10">
        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-full flex justify-around items-center py-4 px-6 shadow-2xl text-xs font-medium">
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <span className="text-xl">⊞</span>
            <span>FEED</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white transition-colors relative">
            <div className="absolute -top-3 w-1 h-1 bg-blue-500 rounded-full" />
            <span className="text-xl">📍</span>
            <span>MAPA</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <span className="text-xl">💬</span>
            <span>CHAT</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <span className="text-xl">👤</span>
            <span>PERFIL</span>
          </button>
        </div>
      </div>

    </div>
  );
}