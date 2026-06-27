import axios from 'axios';

const BASE_URL = 'https://findup-backend.onrender.com/ws/point';

export async function getPoints(token) {
  try {
    const response = await axios.get(BASE_URL, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const points = response.data.map(point => ({
      id: point.id,
      title: point.descricao,
      description: point.detalhes || '',
      type: point.tipo || 'lost',
      position: {
        lat: point.latitude,
        lng: point.longitude,
      },
    }));

    return points;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao buscar pontos');
  }
}

export async function postPoint(token, pointData) {
  try {
    const response = await axios.post(BASE_URL, pointData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 201) {
      return response.data;
    } else {
      throw new Error('Erro ao cadastrar ponto');
    }
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao cadastrar ponto');
  }
}

export async function updatePoint(token, id, pointData) {
  try {
    const response = await axios.put(`${BASE_URL}/${id}`, pointData, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || 'Erro ao atualizar ponto');
  }
}