import { useState, useCallback, useEffect } from 'react'; // 1. Adicionado o useEffect aqui
import { GoogleMap, useJsApiLoader, MarkerF } from '@react-google-maps/api';

const containerStyle = { width: '100%', height: '100vh' };
// Esse passa a ser o centro padrão caso o usuário negue o GPS ou dê erro
const defaultCenter = { lat: -28.2612, lng: -52.4083 };

// Estilo minimalista escuro (Dark/Black Mode)
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
  { featureType: "road", elementType: "labelsvc re.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] }
];

export default function MapScreen() {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY
  });

  // 2. Estado para controlar o centro dinâmico do mapa
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  
  // NOVO: Estado para saber se ainda estamos buscando a localização do usuário
  const [isLocating, setIsLocating] = useState(true);

  // Estado para armazenar os itens no mapa
  const [items, setItems] = useState([]);

  // Estados de controle do Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [formData, setFormData] = useState({ id: null, title: '', description: '', type: 'lost', photo: '' });
  
  // Estado para a foto
  const [foto, setFoto] = useState(null);

  // 3. SEU CÓDIGO ADAPTADO: Captura a geolocalização e atualiza o estado do mapa
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setMapCenter({ lat: latitude, lng: longitude });
          setIsLocating(false); // Achou a localização, pode liberar o mapa
        },
        (error) => {
          console.warn("Permissão de localização negada ou erro. Usando centro padrão.", error);
          setIsLocating(false); // Deu erro, libera o mapa no centro padrão
        },
        // Adicionando opções para forçar alta precisão e não ficar travado para sempre
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      console.warn("Geolocalização não suportada pelo navegador.");
      setIsLocating(false);
    }
  }, []);

  // Clique no Mapa: Prepara para criar novo ponto
  const handleMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setSelectedLocation({ lat, lng });
    setFormData({ id: null, title: '', description: '', type: 'lost', photo: '' }); // Limpa o form
    setIsModalOpen(true);
  }, []);

  // Clique no Marcador: Prepara para editar/ver ponto existente
  const handleMarkerClick = (item) => {
    setSelectedLocation({ lat: item.lat, lng: item.lng });
    setFormData(item);
    setIsModalOpen(true);
  };

  // Salvar ou Atualizar ponto
  const handleSave = (e) => {
    e.preventDefault();
    
    // Converte a foto para uma URL visualizável, se existir
    const photoUrl = foto ? URL.createObjectURL(foto) : formData.photo;

    if (formData.id) {
      // Editar existente
      setItems(items.map(item => item.id === formData.id ? { ...formData, ...selectedLocation, photo: photoUrl } : item));
    } else {
      // Criar novo
      const newItem = {
        ...formData,
        ...selectedLocation,
        photo: photoUrl,
        id: Date.now() // Gera um ID único temporário
      };
      setItems([...items, newItem]);
    }
    setIsModalOpen(false);
    setFoto(null); // Limpa a foto do estado para o próximo cadastro
  };

  // Deletar ponto
  const handleDelete = () => {
    if (formData.id) {
      setItems(items.filter(item => item.id !== formData.id));
    }
    setIsModalOpen(false);
  };

  // Ícones dinâmicos: Vermelho para perdido, Azul para achado
  const getMarkerIcon = (type) => {
    return type === 'lost' 
      ? 'https://cdn-icons-png.flaticon.com/128/2776/2776067.png' // Ícone perdido
      : 'https://cdn-icons-png.flaticon.com/128/149/149060.png'; // Ícone encontrado
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
        {/* NOVO: Agora só renderiza o mapa se a API carregou E já tentou buscar a localização */}
        {isLoaded && !isLocating ? (
          <GoogleMap
            language="pt-BR"
            mapContainerStyle={containerStyle}
            center={mapCenter} // 4. Alterado aqui de 'center' estático para 'mapCenter' dinâmico
            zoom={15}
            onClick={handleMapClick}
            options={{
              disableDefaultUI: true,
              zoomControl: false,
              styles: darkMinimalistStyle,
              gestureHandling: 'greedy'
            }}
          >
            {/* Renderiza todos os pontos salvos */}
            {items.map(item => (
              item.id ? ( 
                <MarkerF 
                  key={item.id}
                  position={{ lat: item.lat, lng: item.lng }}
                  onClick={() => handleMarkerClick(item)}
                  onMouseOver={() => setHoveredItem(item)} 
                  onMouseOut={() => setHoveredItem(null)}  
                  icon={{
                    url: getMarkerIcon(item.type),
                    scaledSize: new window.google.maps.Size(35, 35)
                  }}
                  // MUDANÇA AQUI: Ativa quando o mouse entra no marcador
                  onMouseOver={() => setItemFocado(item)}
                  // MUDANÇA AQUI: Desativa quando o mouse sai do marcador
                  onMouseOut={() => setItemFocado(null)}
                >
                  {/* BALÃO MÁGICO: Só renderiza se o mouse estiver em cima deste item */}
                  {itemFocado && itemFocado.id === item.id && (
                    <InfoWindow 
                      position={{ lat: item.lat, lng: item.lng }}
                      options={{ disableAutoPan: true }}
                    >
                      <div
                    style={{
                      background: '#1a1a1a',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '12px',
                      maxWidth: '180px',
                      textAlign: 'center',
                      boxShadow: '0 8px 20px rgba(0,0,0,0.35)',
                      border: '1px solid rgba(255,255,255,0.1)'
                    }}
>
                        <b style={{ display: 'block', marginBottom: '6px', fontSize: '13px' }}>
                          {item.title}
                        </b>
                        {item.photo ? (
                          <img 
                            src={item.photo} 
                            alt={item.title} 
                           style={{
                            width: '160px',
                            height: '110px',
                            borderRadius: '10px',
                            objectFit: 'cover',
                            margin: '0 auto',
                            display: 'block'
                          }} 
                          />
                        ) : (
                          <p style={{ fontSize: '11px', color: '#666', margin: '0' }}>Sem foto informada</p>
                        )}
                      </div>
                    </InfoWindow>
                  )}
                </MarkerF>
              ) : null
            ))}

            {/* Renderiza o Pop-up (InfoWindow) se houver um item em hover */}
            {hoveredItem && (
              <InfoWindowF
                position={{ lat: hoveredItem.lat, lng: hoveredItem.lng }}
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
                  <span className={`inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${hoveredItem.type === 'lost' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                    {hoveredItem.type === 'lost' ? 'Perdido' : 'Encontrado'}
                  </span>
                </div>
              </InfoWindowF>
            )}
          </GoogleMap>
        ) : (
          <div className="w-full h-full flex items-center justify-center flex-col gap-3">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-white"></div>
            <p className="text-gray-400 text-sm animate-pulse">Buscando sua localização...</p>
          </div>
        )}
      </div>

      {/* Modal de Cadastro/Edição de Ponto */}
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

              {/* URL da Foto (Simulado para frontend) */}
              <input 
                type="text" 
                placeholder="URL da Foto (Opcional)" 
                value={formData.photo}
                onChange={(e) => setFormData({...formData, photo: e.target.value})}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 outline-none focus:border-white/40 transition-colors text-sm"
              />
              
              {/* upar foto */}
              <input 
                type="file" 
                accept="image/*" 
                capture="environment" /* Abre a câmera no celular */
                onChange={(e) => setFoto(e.target.files[0])} 
              />


              {/* Botões de Ação */}
              <div className="flex gap-3 mt-2">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-white rounded-lg py-3 text-sm font-medium transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className={`flex-1 rounded-lg py-3 text-sm font-medium transition-colors text-white shadow-lg ${formData.type === 'lost' ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                >
                  Salvar
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
