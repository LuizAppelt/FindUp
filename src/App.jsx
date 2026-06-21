import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import MapScreen from './pages/MapScreen';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/registrar" element={<Register />} />
        <Route path="/mapa" element={<MapScreen />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;