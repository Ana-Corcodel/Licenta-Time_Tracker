import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import './Meniu.css'; // Asigură-te că importi Menu.css, nu Meniu.css
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People';
import TrackChangesSharpIcon from '@mui/icons-material/TrackChangesSharp';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';

// Grupări în meniu conform structurii noi
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
    icon: <PeopleIcon className="icon section-icon" />,
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
    icon: <PeopleIcon className="icon section-icon" />,
    items: [
      { 
        name: 'Tipuri de zile', 
        url: '/tipuri-zile', 
        icon: <TrackChangesSharpIcon className="icon" /> 
      }
    ]
  }
];

const Meniu = ({ esteDeschis, seteazaDeschis }) => {
  const [openMenus, setOpenMenus] = useState({});
  const navigate = useNavigate();

  // Funcție de logout
  const delogare = () => {
    localStorage.clear();
    navigate('/');
  };

  // Funcție de gestionare a submeniurilor (pentru viitoare extensii)
  const toggleSubmenu = (menuName) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Închide meniul pe ferestre mici
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
                  <span>{item.nume || item.name}</span>
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