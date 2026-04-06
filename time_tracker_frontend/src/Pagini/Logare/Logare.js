import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Config/axiosInstance";
import logo from "../../Imagini/logo_.png";
import "./Logare.css";

function Logare({ seteazaEsteAutentificat }) {
  const [email, seteazaEmail] = useState("");
  const [parola, seteazaParola] = useState("");
  const [eroare, seteazaEroare] = useState("");
  const [seTrimite, seteazaSeTrimite] = useState(false);

  const navigare = useNavigate();

  const handleAutentificare = async (e) => {
    e.preventDefault();
    seteazaEroare("");
    seteazaSeTrimite(true);

    try {
      await axiosInstance.post("/api/logare/", {
        email: email,
        password: parola,
      });

      seteazaEsteAutentificat(true);
      navigare("/");
    } catch (err) {
      seteazaEroare("Email sau parolă greșite.");
    } finally {
      seteazaSeTrimite(false);
    }
  };

  return (
    <div className="pagina-logare">
      <div className="overlay-logare"></div>

      <div className="card-logare">
        <div className="header-logare">
          <img src={logo} alt="Logo Time Tracker" className="logo-logare" />
        </div>

        <form className="formular-logare" onSubmit={handleAutentificare}>
          <div className="grup-form">
            <label className="eticheta-form">Email</label>
            <input
              className="input-form"
              type="email"
              placeholder="Introdu adresa de email"
              value={email}
              onChange={(e) => seteazaEmail(e.target.value)}
              autoComplete="email"
            />
          </div>

          <div className="grup-form">
            <label className="eticheta-form">Parolă</label>
            <input
              className="input-form"
              type="password"
              placeholder="Introdu parola"
              value={parola}
              onChange={(e) => seteazaParola(e.target.value)}
              autoComplete="current-password"
            />
          </div>

          <button className="buton-logare" type="submit" disabled={seTrimite}>
            {seTrimite ? "Se conectează..." : "Conectare"}
          </button>

          {eroare && <div className="eroare-logare">{eroare}</div>}
        </form>
      </div>
    </div>
  );
}

export default Logare;