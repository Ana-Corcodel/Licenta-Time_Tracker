import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useState } from 'react';
import BaraDeSus from './components/BaraDeSus/BaraDeSus';
import Meniu from './components/Meniu/Meniu';
import Acasa from './Pagini/Acasa';

function Aplicatie() {
  const [meniulEsteDeschis, seteazaMeniulEsteDeschis] = useState(true);

  const comutaMeniul = () => {
    seteazaMeniulEsteDeschis(!meniulEsteDeschis);
  };

  return (
    <Router>
      <div className="Aplicatie">

        {/* 🔹 Bara de sus */}
        <BaraDeSus comutaMeniu={comutaMeniul} />

        <div style={{ display: 'flex' }}>
          
          {/* 🔹 Meniul lateral */}
          <Meniu esteDeschis={meniulEsteDeschis} seteazaDeschis={seteazaMeniulEsteDeschis} />

          {/* 🔹 Zona paginilor */}
          <div className="zona-pagini" style={{ flex: 1, marginTop: '70px' }}>
            <Routes>
              <Route path="/" element={<Acasa />} />
            </Routes>
          </div>

        </div>

      </div>
    </Router>
  );
}

export default Aplicatie;
