import { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, MarkerF, InfoWindowF } from '@react-google-maps/api';
import { useAuth } from '../contexts/AuthContext'; // Importação do contexto de autenticação
import { getPoints, postPoint } from '../services/mapService'; // Importação do serviço da API

const containerStyle = { width: '100%', height: '100vh' };
// Centro padrão caso o utilizador negue o GPS ou ocorra um erro
const defaultCenter = { lat: -28.2612, lng: -52.4083 };

// Estilo minimalista escuro do mapa
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
  const { token } = useAuth(); // Obtém o token de autenticação ativo
  
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  // Estados do mapa e localização
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [isLocating, setIsLocating] = useState(true);
  
  // CORRIGIDO: Inicialização com array vazio para evitar marcadores fantasmas
  const [items, setItems] = useState([]); 

  // Estados de controlo do Modal e formulários
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingSave, setLoadingSave] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ id: null, title: '', description: '', type: 'lost', photo: '' });
  const [foto, setFoto] = useState(null);

  // Estado para controlar o Pop-up (InfoWindow)
  const [hoveredItem, setHoveredItem] = useState(null);

  // 1. Efeito resiliente para capturar a geolocalização do utilizador
  useEffect(() => {
    if (!("geolocation" in navigator)) {
      console.warn("Geolocalização não suportada.");
      setIsLocating(false);
      return;
    }

    const onSuccess = (position) => {
      const { latitude, longitude } = position.coords;
      setMapCenter({ lat: latitude, lng: longitude });
      setIsLocating(false);
    };

    const onError = (error) => {
      console.warn(`Erro no GPS (${error.code}): ${error.message}. Tentando por rede...`);
      
      // Segunda tentativa: sem alta precisão (mais rápido em ambientes fechados/desktops)
      navigator.geolocation.getCurrentPosition(
        onSuccess,
        (err) => {
          console.error("Ambas as tentativas de localização falharam. Usando centro padrão.", err);
          setIsLocating(false);
        },
        { enableHighAccuracy: false, timeout: 15000, maximumAge: 60000 }
      );
    };

    // Primeira tentativa com alta precisão
    navigator.geolocation.getCurrentPosition(onSuccess, onError, {
      enableHighAccuracy: true,
      timeout: 8000,
      maximumAge: 0
    });
  }, []);

  // 2. NOVO: Carregar marcadores diretamente da API quando o token estiver disponível
  useEffect(() => {
    async function loadMarkers() {
      if (!token) return;
      try {
        const apiPoints = await getPoints(token);
        setItems(apiPoints);
      } catch (err) {
        console.error("Erro ao carregar pontos do servidor:", err.message);
      }
    }
    loadMarkers();
  }, [token]);

  // Clique no Mapa: Prepara para criar novo ponto
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng });
    setFormData({ id: null, title: '', description: '', type: 'lost', photo: '' });
    setIsModalOpen(true);
  }, []);

  // Clique no Marcador: Adaptado para ler tanto propriedades diretas como nós aninhados
  const handleMarkerClick = (item) => {
    const lat = item.position?.lat || item.lat;
    const lng = item.position?.lng || item.lng;
    setSelectedLocation({ lat, lng });
    setFormData({
      id: item.id,
      title: item.title || '',
      description: item.description || '',
      type: item.type || 'lost',
      photo: item.photo || ''
    });
    setIsModalOpen(true);
  };

  // Salvar ou Atualizar ponto na API e localmente
  const handleSave = async (e) => {
    e.preventDefault();
    setLoadingSave(true);
    
    const photoUrl = foto ? URL.createObjectURL(foto) : formData.photo;

    // Payload estruturado exatamente como o seu backend espera receber
    const pointPayload = {
      descricao: formData.title,
      latitude: selectedLocation.lat,
      longitude: selectedLocation.lng
      // Nota: Insira aqui campos extras (ex: tipo, descricao_detalhada) se a API aceitar
    };

    try {
      if (formData.id) {
        // Atualização Local (Mock) - Ajustar se o outro grupo criar a rota PUT/PATCH
        setItems(items.map(item => item.id === formData.id ? { ...formData, position: selectedLocation, photo: photoUrl } : item));
        setIsModalOpen(false);
      } else {
        // Integração com a API - Envia para o banco de dados via Axios
        let savedPoint = null;
        if (token) {
          savedPoint = await postPoint(token, pointPayload);
        }

        const newItem = {
          id: savedPoint?.id || Date.now(), // Fallback seguro caso a API não devolva o ID
          title: formData.title,
          description: formData.description,
          type: formData.type,
          photo: photoUrl,
          position: selectedLocation // Mantém a estrutura padronizada
        };

        setItems([...items, newItem]);
        setIsModalOpen(false);
      }
      setFoto(null);
    } catch (err) {
      alert("Falha ao salvar no servidor: " + err.message);
    } finally {
      setLoadingSave(false);
    }
  };

  // Deletar ponto
  const handleDelete = () => {
    if (formData.id) {
      setItems(items.filter(item => item.id !== formData.id));
    }
    setIsModalOpen(false);
  };

  // Ícones dinâmicos
  const getMarkerIcon = (type) => {
    return type === 'found' 
      ? 'https://cdn-icons-png.flaticon.com/128/149/149060.png'  // Ícone encontrado (Azul)
      : 'https://cdn-icons-png.flaticon.com/128/2776/2776067.png'; // Ícone perdido (Vermelho)
  };

  return (
    <div className="relative w-full h-screen bg-[#121212] overflow-hidden font-sans text-white">
      
      {/* Header */}
      <div className="absolute top-0 left-0 w-full p-6 z-10 flex justify-between items-center bg-gradient-to-b from-black/90 to-transparent pointer-events-none">
        <h1 className="text-2xl font-bold tracking-tight drop-shadow-lg">FindUP</h1>
        <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 shadow-lg pointer-events-auto cursor-pointer">
        </div>
      </div>

      {/* Mapa do Google */}
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
            {/* Renderiza marcadores com proteção de estrutura de dados (lat/lng ou position) */}
            {items.map(item => {
              if (!item || !item.id) return null;
              const markerLat = item.position?.lat || item.lat;
              const markerLng = item.position?.lng || item.lng;

              if (!markerLat || !markerLng) return null;

              return (
                <MarkerF 
                  key={item.id}
                  position={{ lat: markerLat, lng: markerLng }}
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

            {/* Renderiza o Pop-up (InfoWindow) */}
            {hoveredItem && (
              <InfoWindowF
                position={{ 
                  lat: hoveredItem.position?.lat || hoveredItem.lat, 
                  lng: hoveredItem.position?.lng || hoveredItem.lng 
                }}
                options={{ 
                  pixelOffset: new window.google.maps.Size(0, -35), 
                  disableAutoPan: true 
                }}
              >
                <div className="p-1 max-w-[180px] text-gray-800 font-sans">
                  {hoveredItem.photo && (
                    <img 
                      src={hoveredItem.photo} 
                      alt={hoveredItem.title} 
                      className="w-full h-24 object-cover rounded-md mb-2 shadow-sm"
                    />
                  )}
                  <h3 className="font-bold text-sm truncate">{hoveredItem.title}</h3>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{hoveredItem.description}</p>
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${hoveredItem.type === 'found' ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                    {hoveredItem.type === 'found' ? 'Encontrado' : 'Perdido'}
                  </span>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            <p className="text-gray-400 text-sm animate-pulse">A carregar mapa e localização...</p>
          </div>
        )}
      </div>

      {/* Modal de Criação / Edição de Ponto */}
      {isModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <h2 className="text-xl font-bold mb-4">{formData.id ? 'Detalhes do Objeto' : 'Registrar Objeto'}</h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              
              {/* Tipo do Objeto (Toggle) */}
              <div className="flex bg-black/50 p-1 rounded-lg border border-white/5">
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'lost'})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'lost' ? 'bg-red-500/20 text-red-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Perdi algo
                </button>
                <button 
                  type="button"
                  onClick={() => setFormData({...formData, type: 'found'})}
                  className={`flex-1 py-2 text-sm font-medium rounded-md transition-colors ${formData.type === 'found' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                  Achei algo
                </button>
              </div>

              {/* Nome / Título */}
              <input 
                type="text" 
                placeholder="O que é? (ex: Chave, Carteira)" 
                required
                value={formData.title}
                onChange={(e) => setFormData({...formData, title: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors text-sm"
              />

              {/* Descrição */}
              <textarea 
                placeholder="Detalhes (cor, marca, onde perdeu/achou)..." 
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors text-sm resize-none"
              ></textarea>

              {/* Input de Fotografia */}
              <div className="upload-container">
                <label 
                  htmlFor="foto-upload" 
                  className="block w-full p-3.5 bg-[#242424] text-[#9e9e9e] border border-[#333] rounded-lg cursor-pointer text-center hover:bg-[#2a2a2a] transition-colors text-sm"
                >
                  {foto ? foto.name : " Escolher arquivo..."}
                </label>

                <input
                  id="foto-upload"
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  onChange={(e) => setFoto(e.target.files[0])} 
                  style={{ display: 'none' }} 
                />
              </div>

              {/* Botões de Ação */}
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
                  {loadingSave ? 'A guardar...' : 'Salvar'}
                </button>
              </div>

              {/* Botão de Excluir */}
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

      {/* Bottom Navigation */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-sm z-10">
        <div className="bg-[#1a1a1a]/90 backdrop-blur-xl border border-white/10 rounded-full flex justify-around items-center py-4 px-6 shadow-2xl text-xs font-medium">
          <button className="flex flex-col items-center gap-1 text-gray-400 hover:text-white transition-colors">
            <span className="text-xl">⊞</span>
            <span>FEED</span>
          </button>
          <button className="flex flex-col items-center gap-1 text-white transition-colors relative">
            <div className="absolute -top-3 w-1 h-1 bg-blue-500 rounded-full"></div>
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