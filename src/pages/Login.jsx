import { Link } from 'react-router-dom';

export default function Login() {
  return (
    <div className="min-h-screen bg-[#0b1120] text-white flex flex-col justify-center px-8 relative overflow-hidden">
      {/* Background pattern simulado */}
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay border-none"></div>
      
      <div className="relative z-10 flex flex-col items-center w-full max-w-sm mx-auto">
        <h1 className="text-5xl font-bold mb-2 tracking-tight">FindUP</h1>
        <h2 className="text-2xl font-light mb-10 opacity-80">Faça seu login</h2>

        <form className="w-full flex flex-col gap-4">
          <div className="relative">
            <input 
              type="email" 
              placeholder="email" 
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />
            <span className="absolute right-4 top-3.5 opacity-50">✉️</span>
          </div>

          <div className="relative">
            <input 
              type="password" 
              placeholder="senha" 
              className="w-full bg-white/5 border border-white/20 rounded-full px-6 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md"
            />
            <span className="absolute right-4 top-3.5 opacity-50">🔒</span>
          </div>

          <div className="flex justify-end w-full">
            <a href="#" className="text-xs text-gray-400 hover:text-white transition-colors underline decoration-gray-500">
              ESQUECEU A SENHA?
            </a>
          </div>

          <Link to="/map" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 rounded-full py-3 mt-2 text-center font-semibold text-lg transition-all shadow-lg">
            Entrar
          </Link>

          <div className="text-center mt-2">
            <Link to="/register" className="text-sm text-gray-300 underline decoration-gray-500 hover:text-white transition-colors">
              Cadastrar-se
            </Link>
          </div>

          <div className="flex items-center my-4 opacity-50">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="px-3 text-xs font-bold uppercase">ou</span>
            <div className="flex-grow border-t border-gray-400"></div>
          </div>

          <button type="button" className="w-full bg-white text-gray-800 rounded-lg py-3 flex items-center justify-center gap-3 font-medium hover:bg-gray-100 transition-colors">
            <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
            Fazer Login com o Google
          </button>
        </form>
      </div>
    </div>
  );
}