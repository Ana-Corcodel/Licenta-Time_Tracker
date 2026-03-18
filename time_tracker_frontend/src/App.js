import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState, useEffect } from 'react';
import BaraDeSus from './components/BaraDeSus/BaraDeSus';
import Meniu from './components/Meniu/Meniu';
import Acasa from './Pagini/Acasa';
import AdministrareaAngajatilor from './Pagini/AdministrareaAngajatilor/AdministrareaAngajatilor';
import Pontaje from './Pagini/Pontaj/Pontaj';
import TipuriDeZile from './Pagini/TipZi/TipZi';
import Logare from './Pagini/Logare/Logare';
import axiosInstance from './Config/axiosInstance';

function Aplicatie() {
  const [meniulEsteDeschis, seteazaMeniulEsteDeschis] = useState(true);
  const [esteAutentificat, seteazaEsteAutentificat] = useState(false);
  const [seIncarca, seteazaSeIncarca] = useState(true);

  const comutaMeniul = () => {
    seteazaMeniulEsteDeschis(!meniulEsteDeschis);
  };

  useEffect(() => {
    const verificaLogin = async () => {
      try {
        const raspuns = await axiosInstance.get('/api/utilizator-curent/');
        if (raspuns.data.autentificat === true) {
          seteazaEsteAutentificat(true);
        } else {
          seteazaEsteAutentificat(false);
        }
      } catch (error) {
        seteazaEsteAutentificat(false);
      } finally {
        seteazaSeIncarca(false);
      }
    };

    verificaLogin();
  }, []);

  if (seIncarca) {
    return <div>Se încarcă...</div>;
  }

  if (!esteAutentificat) {
    return (
      <Router>
        <Routes>
          <Route
            path="*"
            element={<Logare seteazaEsteAutentificat={seteazaEsteAutentificat} />}
          />
        </Routes>
      </Router>
    );
  }

  return (
    <Router>
      <div className="App">
        <div className="app-container">
          <BaraDeSus comutaMeniu={comutaMeniul} />

          <div style={{ display: 'flex' }}>
            <Meniu
              esteDeschis={meniulEsteDeschis}
              seteazaDeschis={seteazaMeniulEsteDeschis}
            />

            <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
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
    </Router>
  );
}

export default Aplicatie;