import './App.css';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import axios from 'axios';

import BaraDeSus from './components/BaraDeSus/BaraDeSus';
import Meniu from './components/Meniu/Meniu';
import Acasa from './Pagini/Acasa';
import AdministrareaAngajatilor from './Pagini/AdministrareaAngajatilor/AdministrareaAngajatilor';
import Pontaje from './Pagini/Pontaj/Pontaj';
import TipuriDeZile from './Pagini/TipZi/TipZi';
import Logare from './Pagini/Logare/Logare';

function AplicatieContinut() {
  const [meniulEsteDeschis, seteazaMeniulEsteDeschis] = useState(true);
  const [esteAutentificat, seteazaEsteAutentificat] = useState(false);
  const [seVerificaAutentificarea, seteazaSeVerificaAutentificarea] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const verificaAutentificarea = async () => {
      try {
        const raspuns = await axios.get('http://127.0.0.1:8000/api/check_auth/', {
          withCredentials: true,
        });

        if (raspuns.data.authenticated) {
          seteazaEsteAutentificat(true);

          if (window.location.pathname === '/' || window.location.pathname === '/logare') {
            navigate('/acasa');
          }
        } else {
          seteazaEsteAutentificat(false);

          if (window.location.pathname !== '/logare') {
            navigate('/logare');
          }
        }
      } catch (eroare) {
        seteazaEsteAutentificat(false);

        if (window.location.pathname !== '/logare') {
          navigate('/logare');
        }
      } finally {
        seteazaSeVerificaAutentificarea(false);
      }
    };

    verificaAutentificarea();
  }, [navigate]);

  const comutaMeniul = () => {
    seteazaMeniulEsteDeschis(!meniulEsteDeschis);
  };

  if (seVerificaAutentificarea) {
    return <div>Se verifică autentificarea...</div>;
  }

  return (
    <div className="App">
      <div className="app-container">
        <Routes>
          <Route
            path="/logare"
            element={
              esteAutentificat ? (
                <Navigate to="/acasa" replace />
              ) : (
                <Logare seteazaEsteAutentificat={seteazaEsteAutentificat} />
              )
            }
          />

          <Route
            path="/acasa"
            element={
              esteAutentificat ? (
                <>
                  <BaraDeSus comutaMeniu={comutaMeniul} />
                  <div style={{ display: 'flex' }}>
                    <Meniu
                      esteDeschis={meniulEsteDeschis}
                      seteazaDeschis={seteazaMeniulEsteDeschis}
                    />
                    <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
                      <Acasa />
                    </div>
                  </div>
                </>
              ) : (
                <Navigate to="/logare" replace />
              )
            }
          />

          <Route
            path="/administrare-angajati"
            element={
              esteAutentificat ? (
                <>
                  <BaraDeSus comutaMeniu={comutaMeniul} />
                  <div style={{ display: 'flex' }}>
                    <Meniu
                      esteDeschis={meniulEsteDeschis}
                      seteazaDeschis={seteazaMeniulEsteDeschis}
                    />
                    <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
                      <AdministrareaAngajatilor />
                    </div>
                  </div>
                </>
              ) : (
                <Navigate to="/logare" replace />
              )
            }
          />

          <Route
            path="/pontaje"
            element={
              esteAutentificat ? (
                <>
                  <BaraDeSus comutaMeniu={comutaMeniul} />
                  <div style={{ display: 'flex' }}>
                    <Meniu
                      esteDeschis={meniulEsteDeschis}
                      seteazaDeschis={seteazaMeniulEsteDeschis}
                    />
                    <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
                      <Pontaje />
                    </div>
                  </div>
                </>
              ) : (
                <Navigate to="/logare" replace />
              )
            }
          />

          <Route
            path="/tipuri-zile"
            element={
              esteAutentificat ? (
                <>
                  <BaraDeSus comutaMeniu={comutaMeniul} />
                  <div style={{ display: 'flex' }}>
                    <Meniu
                      esteDeschis={meniulEsteDeschis}
                      seteazaDeschis={seteazaMeniulEsteDeschis}
                    />
                    <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
                      <TipuriDeZile />
                    </div>
                  </div>
                </>
              ) : (
                <Navigate to="/logare" replace />
              )
            }
          />

          <Route
            path="/"
            element={<Navigate to={esteAutentificat ? "/acasa" : "/logare"} replace />}
          />
        </Routes>
      </div>
    </div>
  );
}

function Aplicatie() {
  return (
    <Router>
      <AplicatieContinut />
    </Router>
  );
}

export default Aplicatie;