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
    section: 'General',
    icon: <HomeIcon className="icon section-icon" />,
    items: [
      {
        name: 'Acasă',
        url: '/',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    section: 'Administrare',
    icon: <PeopleIcon className="icon section-icon" />,
    items: [
      {
        name: 'Angajați',
        url: '/administrare-angajati',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    section: 'Pontaje',
    icon: <AccessTimeIcon className="icon section-icon" />,
    items: [
      {
        name: 'Pontaje',
        url: '/pontaje',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  },
  {
    section: 'Tipuri de zile',
    icon: <CalendarMonthIcon className="icon section-icon" />,
    items: [
      {
        name: 'Tipuri de zile',
        url: '/tipuri-zile',
        icon: <TrackChangesSharpIcon className="icon" />
      }
    ]
  }
];

const Meniu = ({ esteDeschis, seteazaDeschis, seteazaEsteAutentificat }) => {
  const navigate = useNavigate();

  const delogare = async () => {
    try {
      await axiosInstance.post('/api/logout/');
      localStorage.clear();
      seteazaEsteAutentificat(false);
      navigate('/logare', { replace: true });
    } catch (error) {
      console.error('Eroare la delogare:', error);
      alert(`Logout-ul a eșuat. Status: ${error.response?.status || 'necunoscut'}`);
    }
  };

  const handleClick = () => {
    if (window.innerWidth <= 768) {
      seteazaDeschis(false);
    }
  };

  return (
    <div className={`sidebar ${esteDeschis ? 'open' : ''}`}>
      <ul className="meniu">
        {grupuriMeniu.map((grup) => (
          <div key={grup.section}>
            <div className="section-title">
              {grup.icon}
              <span>{grup.section}</span>
            </div>

            {grup.items.map((item, index) => (
              <li key={index} className="menu-item">
                <NavLink
                  to={item.url}
                  onClick={handleClick}
                  className={({ isActive }) =>
                    isActive ? 'menu-link active' : 'menu-link'
                  }
                >
                  {item.icon}
                  <span>{item.name}</span>
                </NavLink>
              </li>
            ))}
          </div>
        ))}
      </ul>

      <button className="settings-button" onClick={delogare}>
        <LogoutIcon className="icon" />
        Delogare
      </button>
    </div>
  );
};

export default Meniu;