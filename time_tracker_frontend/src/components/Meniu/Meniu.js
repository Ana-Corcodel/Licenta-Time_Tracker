import './Meniu.css';
import { NavLink } from 'react-router-dom';
import LogoutIcon from '@mui/icons-material/Logout';
import HomeIcon from '@mui/icons-material/Home';
import PeopleIcon from '@mui/icons-material/People'; // Icon pentru angajați

const grupuriMeniu = [
  {
    sectiune: 'General',
    icon: <HomeIcon className="icon" />,
    pagini: [
      {
        nume: 'Acasă',
        ruta: '/'
      }
    ]
  },
  {
    sectiune: 'Administrare',
    icon: <PeopleIcon className="icon" />, // Icon pentru secțiunea de administrare
    pagini: [
      {
        nume: 'Angajați',
        ruta: '/administrare-angajati'
      }
    ]
  },
  {
    sectiune: 'Pontaje',
    icon: <PeopleIcon className="icon" />, // Icon pentru secțiunea de administrare
    pagini: [
      {
        nume: 'Pontaje',
        ruta: '/pontaje'
      }
    ]
  },
  {
    sectiune: 'Tipuri de zile',
    icon: <PeopleIcon className="icon" />, // Icon pentru secțiunea de administrare
    pagini: [
      {
        nume: 'Tipuri de zile',
        ruta: '/tipuri-zile'
      }
    ]
  }
];

const Meniu = ({ esteDeschis, seteazaDeschis }) => {

  const delogare = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  const handleClick = () => {
    if (window.innerWidth <= 768) {
      seteazaDeschis(false);
    }
  };

  return (
    <div className={`bara-laterala ${esteDeschis ? 'deschis' : ''}`}>
      <ul className="lista-meniu">

        {grupuriMeniu.map((grup) => (
          <div key={grup.sectiune}>
            <div className="titlu-sectiune">
              {grup.icon}
              <span>{grup.sectiune}</span>
            </div>

            {grup.pagini.map((pagina) => (
              <li key={pagina.nume} className="element-meniu">
                <NavLink
                  to={pagina.ruta}
                  onClick={handleClick}
                  className={({ isActive }) =>
                    isActive ? 'link-meniu activ' : 'link-meniu'
                  }
                >
                  {pagina.nume}
                </NavLink>
              </li>
            ))}
          </div>
        ))}

      </ul>

      <button className="buton-logout" onClick={delogare}>
        <LogoutIcon className="icon" />
        Delogare
      </button>
    </div>
  );
};

export default Meniu;