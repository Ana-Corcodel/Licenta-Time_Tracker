import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Meniu.css';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import TrackChangesSharpIcon from '@mui/icons-material/TrackChangesSharp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import axiosInstance from '../../Config/axiosInstance';

const grupuriMeniu = [
  {
    sectiune: 'General',
    icon: <HomeIcon className="icon pictograma-sectiune" />,
    elemente: [
      {
        nume: 'Acasă',
        url: '/',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    sectiune: 'Administrare',
    icon: <PeopleIcon className="icon pictograma-sectiune" />,
    elemente: [
      {
        nume: 'Angajați',
        url: '/administrare-angajati',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    sectiune: 'Pontaje',
    icon: <AccessTimeIcon className="icon pictograma-sectiune" />,
    elemente: [
      {
        nume: 'Pontaje',
        url: '/pontaje',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    sectiune: 'Tipuri de zile',
    icon: <CalendarMonthIcon className="icon pictograma-sectiune" />,
    elemente: [
      {
        nume: 'Tipuri de zile',
        url: '/tipuri-zile',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  }
];

const Meniu = ({ esteDeschis, seteazaDeschis, seteazaEsteAutentificat }) => {
  const navigheaza = useNavigate();

  const delogare = async () => {
    try {
      await axiosInstance.post('/api/logout/');
      localStorage.clear();
      seteazaEsteAutentificat(false);
      navigheaza('/logare', { replace: true });
    } catch (eroare) {
      console.error('Eroare la delogare:', eroare);
      alert(`Logout-ul a eșuat. Status: ${eroare.response?.status || 'necunoscut'}`);
    }
  };

  const gestioneazaClick = () => {
    if (window.innerWidth <= 768) {
      seteazaDeschis(false);
    }
  };

  return (
    <div className="meniu-lateral-container">
      <div className={`bara-laterala ${esteDeschis ? 'deschis' : ''}`}>
        <ul className="lista-meniu">
          {grupuriMeniu.map((grup) => (
            <div key={grup.sectiune}>
              <div className="titlu-sectiune">
                {grup.icon}
                <span>{grup.sectiune}</span>
              </div>

              {grup.elemente.map((element, index) => (
                <li key={index} className="element-meniu">
                  <NavLink
                    to={element.url}
                    onClick={gestioneazaClick}
                    className={({ isActive }) =>
                      isActive ? 'link-meniu activ' : 'link-meniu'
                    }
                  >
                    {element.icon}
                    <span>{element.nume}</span>
                  </NavLink>
                </li>
              ))}
            </div>
          ))}
        </ul>

        <button className="buton-delogare" onClick={delogare}>
          <LogoutIcon className="icon" />
          Delogare
        </button>
      </div>
    </div>
  );
};

export default Meniu;