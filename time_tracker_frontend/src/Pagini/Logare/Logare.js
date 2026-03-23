import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Config/axiosInstance";
import logo from "../../Imagini/logo_.png"; // 🔥 LOGO COMPLET
import "./Logare.css";

function Logare({ seteazaEsteAutentificat }) {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState("");
  const [seTrimite, setSeTrimite] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setEroare("");
    setSeTrimite(true);

    try {
      await axiosInstance.post("/api/logare/", {
        email: email,
        password: parola,
      });

      seteazaEsteAutentificat(true);
      navigate("/");
    } catch (err) {
      setEroare("Email sau parolă greșite.");
    } finally {
      setSeTrimite(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay"></div>

      <div className="login-card">
        <div className="login-header">
          {/* 🔥 LOGO COMPLET */}
          <img src={logo} alt="Logo Time Tracker" className="login-logo-full" />
        </div>

        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              className="form-input"
              type="email"
              placeholder="Introdu adresa de email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Parolă</label>
            <input
              className="form-input"
              type="password"
              placeholder="Introdu parola"
              value={parola}
              onChange={(e) => setParola(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="login-button" type="submit" disabled={seTrimite}>
            {seTrimite ? "Se conectează..." : "Conectare"}
          </button>

          {eroare && <div className="login-error">{eroare}</div>}
        </form>
      </div>
    </div>
  );
}

export default Logare;