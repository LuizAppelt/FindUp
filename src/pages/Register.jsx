import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { signUp } from "../services/authService";
import background from "../assets/background.jpeg";

export default function Register() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    nome: "",
    cpf: "",
    telefone: "",
    endereco: "",
    email: "",
    senha: "",
    confirmarSenha: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // poderiamos deixar apenas o nome, email e senha, mas deixei os outros campos para futuras implementações
  const inputs = [
    { key: "nome", name: "Nome completo", type: "text" },
    { key: "cpf", name: "CPF", type: "text", half: true },
    { key: "telefone", name: "Telefone", type: "tel", half: true },
    { key: "endereco", name: "Endereço", type: "text" },
    { key: "email", name: "Email", type: "email" },
    { key: "senha", name: "Senha", type: "password" },
    { key: "confirmarSenha", name: "Confirme sua senha", type: "password",},
  ];

  
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");

    if (formData.senha !== formData.confirmarSenha) {
      setError("As senhas não coincidem.");
      return;
    }

    try {
      setLoading(true);

      await signUp(formData.nome, formData.email, formData.senha);

      alert("Usuário cadastrado com sucesso!");

      navigate("/login");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen text-white flex justify-center items-center px-8 relative overflow-hidden"
      style={{
        backgroundImage: `url(${background})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="absolute inset-0 bg-black/50"></div>

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <h1 className="text-4xl font-bold mb-1 tracking-tight">FindUP</h1>

        <h2 className="text-lg font-light mb-8 opacity-80">
          Cadastro de clientes
        </h2>

        <form onSubmit={handleSubmit} className="w-full flex flex-wrap gap-4">
          {inputs.map((input, idx) => (
            <div
              key={idx}
              className={`relative ${
                input.half ? "w-[calc(50%-0.5rem)]" : "w-full"
              }`}
            >
              <input
                type={input.type}
                name={input.key}
                placeholder={input.name}
                value={formData[input.key]}
                onChange={handleChange}
                className="w-full bg-white/5 border border-white/20 rounded-full px-5 py-3 outline-none focus:border-white/50 transition-colors backdrop-blur-md text-sm placeholder:text-gray-300"
              />

              <span className="absolute right-4 top-3 opacity-60 text-sm">
                {input.icon}
              </span>
            </div>
          ))}

          {error && (
            <p className="w-full text-center text-red-400 text-sm">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white/20 hover:bg-white/30 backdrop-blur-md border border-white/10 rounded-full py-3 mt-6 text-center font-medium transition-all shadow-lg disabled:opacity-50"
          >
            {loading ? "Cadastrando..." : "Finalizar cadastro"}
          </button>

          <Link
            to="/login"
            className="w-full text-center text-sm text-gray-300 hover:text-white underline"
          >
            Já possui conta? Faça login
          </Link>
        </form>
      </div>
    </div>
  );
}
