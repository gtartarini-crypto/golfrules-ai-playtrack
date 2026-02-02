import { useState } from "react";
import { auth, signInWithEmailAndPassword } from "../../services/firebase";

export const LoginScreenMobile = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const login = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (e) {
      alert("Credenziali non valide");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-sm bg-white p-8 rounded-2xl shadow">
        <h1 className="text-2xl font-black text-slate-800 mb-6 text-center">
          Staff Login
        </h1>

        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-xl border border-slate-300"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-xl border border-slate-300"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl"
        >
          {loading ? "Caricamento..." : "Accedi"}
        </button>
      </div>
    </div>
  );
};
