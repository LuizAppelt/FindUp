import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signIn } from "../services/authService";
import { useAuth } from "../contexts/AuthContext";

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
  setLoading(true);

  try {
    const token = await signIn(email, password);

    console.log("Token recebido:", token);

    login(token);

    navigate("/map");
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-[#0b1120] text-white flex flex-col justify-center px-8 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">
          FindUP
        </h1>

        <h2 className="text-2xl font-light mb-10 opacity-80">
          Faça seu login
        </h2>

        <form
          onSubmit={handleSubmit}
          className="w-full flex flex-col gap-4"
        >
          <div className="relative">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />

            <span className="absolute right-4 top-3.5 opacity-50">
              ✉️
            </span>
          </div>

          <div className="relative">
            <input
              type="password"
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />

            <span className="absolute right-4 top-3.5 opacity-50">
              🔒
            </span>
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

          <div className="flex items-center my-4 opacity-50">
            <div className="flex-grow border-t border-gray-400"></div>

            <span className="px-3 text-xs font-bold uppercase">
              ou
            </span>

            <div className="flex-grow border-t border-gray-400"></div>
          </div>

          <button
            type="button"
            className="w-full bg-white text-gray-800 rounded-lg py-3 flex items-center justify-center gap-3 font-medium hover:bg-gray-100 transition-colors"
          >
            <img
              src="https://www.svgrepo.com/show/475656/google-color.svg"
              alt="Google"
              className="w-5 h-5"
            />

            Fazer Login com o Google
          </button>
        </form>
      </div>
    </div>
  );
}