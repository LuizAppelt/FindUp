import axios from 'axios';

const API_URL = 'https://two025-01-apisample.onrender.com/auth';

export async function signIn(email, password) {
  try {
    // Adicionado um timeout de 12 segundos (12000ms)
    const response = await axios.post(
      `${API_URL}/signin`, 
      { email, password },
      { timeout: 12000 } 
    );
    return response.data;
  } catch (error) {
    // Captura caso a requisição tenha caído por estouro de tempo (Timeout)
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('O servidor está demorando para responder. Pode estar inicializando, tente novamente em instantes.');
    }

    if (error.response) {
      if (error.response.status === 400) {
        throw new Error('Requisição inválida.');
      }
      if (error.response.status === 401) {
        throw new Error('Usuário ou senha incorretos.');
      }
    }

      throw new Error('Erro ao autenticar.');
  }
}

export async function signUp(name, email, password) {
  try {
    const response = await axios.post(`${API_URL}/signup`, {
      name,
      email,
      password,
    });

    return response.data;
  } catch (error) {
    console.log("ERRO COMPLETO:", error.response?.data);

    throw new Error(
      error.response?.data?.message ||
      JSON.stringify(error.response?.data) ||
      "Erro ao cadastrar usuário."
    );
  }
}