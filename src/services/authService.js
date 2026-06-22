import axios from 'axios';

// URL da API no Render
const API_URL = 'https://two025-01-apisample.onrender.com/auth';

// 1. FUNÇÃO DE LOGIN
export async function signIn(email, password) {
  try {
    
    const response = await axios.post(
      `${API_URL}/signin`, 
      { email, password },
      { timeout: 10000 } 
    );
    return response.data;
  } catch (error) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      throw new Error('O servidor está demorando para responder. Ele pode estar inicializando (Cold Start). Tente novamente em instantes.');
    }

    if (error.response) {
      if (error.response.status === 400) {
        throw new Error('Requisição inválida.');
      }
      if (error.response.status === 401) {
        throw new Error('Usuário ou senha incorretos.');
      }
    }
    throw new Error('Erro ao autenticar ou servidor indisponível.');
  }
}

// FUNÇÃO DE CADASTRO
export async function signUp(name, email, password) {
  try {
    const response = await axios.post(
      `${API_URL}/signup`,
      {
        name,
        email,
        password,
      },
      { timeout: 10000 }
    );

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