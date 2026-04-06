import "./App.css";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useState, useEffect } from "react";
import BaraDeSus from "./components/BaraDeSus/BaraDeSus";
import Meniu from "./components/Meniu/Meniu";
import Acasa from "./Pagini/Acasa";
import AdministrareaAngajatilor from "./Pagini/AdministrareaAngajatilor/AdministrareaAngajatilor";
import Pontaje from "./Pagini/Pontaj/Pontaj";
import TipuriDeZile from "./Pagini/TipZi/TipZi";
import Logare from "./Pagini/Logare/Logare";
import axiosInstance from "./Config/axiosInstance";

function Aplicatie() {
  const [meniulEsteDeschis, seteazaMeniulEsteDeschis] = useState(true);
  const [esteAutentificat, seteazaEsteAutentificat] = useState(false);
  const [seIncarca, seteazaSeIncarca] = useState(true);

  const comutaMeniul = () => {
    seteazaMeniulEsteDeschis(!meniulEsteDeschis);
  };

  useEffect(() => {
    const verificaLogarea = async () => {
      try {
        const raspuns = await axiosInstance.get("/api/utilizator-curent/");
        seteazaEsteAutentificat(raspuns.data.autentificat === true);
      } catch (eroare) {
        seteazaEsteAutentificat(false);
      } finally {
        seteazaSeIncarca(false);
      }
    };

    verificaLogarea();
  }, []);

  useEffect(() => {
    const gestioneazaRedimensionarea = () => {
      if (window.innerWidth <= 768) {
        seteazaMeniulEsteDeschis(false);
      } else {
        seteazaMeniulEsteDeschis(true);
      }
    };

    gestioneazaRedimensionarea();
    window.addEventListener("resize", gestioneazaRedimensionarea);

    return () => window.removeEventListener("resize", gestioneazaRedimensionarea);
  }, []);

  if (seIncarca) {
    return (
      <div className="ecran-incarcare">
        <div className="spinner-incarcare"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Ruta de logare */}
        <Route
          path="/logare"
          element={
            esteAutentificat ? (
              <Navigate to="/" replace />
            ) : (
              <Logare seteazaEsteAutentificat={seteazaEsteAutentificat} />
            )
          }
        />

        {/* Rute protejate */}
        <Route
          path="/*"
          element={
            esteAutentificat ? (
              <div className="aplicatie">
                <div className="container-aplicatie">
                  <BaraDeSus comutaMeniu={comutaMeniul} />

                  <div style={{ display: "flex" }}>
                    <Meniu
                      esteDeschis={meniulEsteDeschis}
                      seteazaDeschis={seteazaMeniulEsteDeschis}
                      seteazaEsteAutentificat={seteazaEsteAutentificat}
                    />

                    <div className="container-pagina" style={{ flex: 1, marginTop: "60px" }}>
                      <Routes>
                        <Route path="/" element={<Acasa />} />
                        <Route path="/administrare-angajati" element={<AdministrareaAngajatilor />} />
                        <Route path="/pontaje" element={<Pontaje />} />
                        <Route path="/tipuri-zile" element={<TipuriDeZile />} />
                      </Routes>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Navigate to="/logare" replace />
            )
          }
        />
      </Routes>
    </Router>
  );
}

export default Aplicatie;