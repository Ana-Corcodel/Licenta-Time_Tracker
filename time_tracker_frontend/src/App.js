import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import BaraDeSus from './components/BaraDeSus/BaraDeSus';
import Meniu from './components/Meniu/Meniu';
import Acasa from './Pagini/Acasa';
import AdministrareaAngajatilor from './Pagini/AdministrareaAngajatilor/AdministrareaAngajatilor';
import Pontaje from './Pagini/Pontaj/Pontaj';
import TipuriDeZile from './Pagini/TipZi/TipZi';

function Aplicatie() {
  const [meniulEsteDeschis, seteazaMeniulEsteDeschis] = useState(true);

  const comutaMeniul = () => {
    seteazaMeniulEsteDeschis(!meniulEsteDeschis);
  };

  return (
    <Router>
      <div className="App">
        <div className="app-container">
        {/* Bara de sus */}
        <BaraDeSus comutaMeniu={comutaMeniul} />

        <div style={{ display: 'flex' }}>
          {/* Meniu lateral */}
          <Meniu
            esteDeschis={meniulEsteDeschis}
            seteazaDeschis={seteazaMeniulEsteDeschis}
          />

          {/* Zona paginilor */}
          <div className="page-wrapper" style={{ flex: 1, marginTop: '60px' }}>
            {/* DOAR UN SINGUR <Routes> */}
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