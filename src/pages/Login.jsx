import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signIn } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";
import background from "../assets/background.jpeg"

function isValidEmail(email) {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
}

function validateLogin(email, password) {
  if (!email.trim()) return "Email é obrigatório";
  if (!isValidEmail(email)) return "Insira um e-mail válido";
  if (!password.trim()) return "Senha é obrigatória";
  return null;
}

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const validationError = validateLogin(email, password);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    const apiTimeoutAlert = setTimeout(() => {
      setError(
        "O servidor está acordando... Isso pode levar até 1 minuto no primeiro acesso. Por favor, aguarde."
      );
    }, 10000);

    try {
      const token = await signIn(email, password);
      console.log("Token recebido:", token);

      clearTimeout(apiTimeoutAlert);
      login(token);
      navigate("/map");
    } catch (err) {
      clearTimeout(apiTimeoutAlert);

      const errorMessage =
        err.response?.data?.message ||
        err.message ||
        "Erro ao conectar com o servidor.";

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex flex-col justify-center px-8 relative overflow-hidden"
    style={{
       backgroundImage: `url(${background})`,
       backgroundSize: "cover",
       backgroundPosition: "center",
       backgroundRepeat: "no-repeat",
      }}>
      
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">
          FindUP
        </h1>

        <h2 className="text-2xl font-light mb-10 opacity-80">
          Faça seu login
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />
            <span className="absolute right-4 top-3.5 opacity-50">✉️</span>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />
            <span className="absolute right-4 top-3.5 opacity-50">🔒</span>
          </div>

          <div className="flex justify-end">
            <a
              href="#"
              className="text-xs text-gray-400 hover:text-white underline"
            >
              ESQUECEU A SENHA?
            </a>
          </div>

          {error && (
            <p className="text-red-400 text-center text-sm">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 rounded-full py-3 mt-2 text-center font-semibold text-lg transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-center mt-2">
            <Link
              to="/register"
              className="text-sm text-gray-300 underline hover:text-white"
            >
              Cadastrar-se
            </Link>
          </div>
        </form>
      </div>
    </div>
  );
}