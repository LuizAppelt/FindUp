import { Link } from 'react-router-dom';

export default function Register() {
  const inputs = [
    { name: 'Nome completo', icon: '👤', type: 'text' },
    { name: 'CPF', icon: '🆔', type: 'text', half: true },
    { name: 'Telefone', icon: '📞', type: 'tel', half: true },
    { name: 'Endereço', icon: '📍', type: 'text' },
    { name: 'Email', icon: '✉️', type: 'email' },
    { name: 'Senha', icon: '🔒', type: 'password' },
    { name: 'Confirme sua senha', icon: '✔️', type: 'password' },
  ];

  return (
    <div className="min-h-screen bg-[#0b1120] text-white flex flex-col items-center py-10 px-6 relative overflow-x-hidden">
      <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      
      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-1 tracking-tight">FindUP</h1>
        <h2 className="text-lg font-light mb-8 opacity-80">Cadastro de clientes</h2>

        <form className="w-full flex flex-wrap gap-4">
          {inputs.map((input, idx) => (
            <div key={idx} className={`relative ${input.half ? 'w-[calc(50%-0.5rem)]' : 'w-full'}`}>
              <input 
                type={input.type} 
                placeholder={input.name} 
                className="w-full bg-white/5 border border-white/20 rounded-full px-5 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md text-sm placeholder:text-gray-300"
              />
              <span className="absolute right-4 top-3 opacity-60 text-sm">{input.icon}</span>
            </div>
          ))}

          <Link to="/" className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 rounded-full py-3 mt-6 text-center font-medium transition-all shadow-lg">
            Finalizar cadastro
          </Link>
        </form>
      </div>
    </div>
  );
}