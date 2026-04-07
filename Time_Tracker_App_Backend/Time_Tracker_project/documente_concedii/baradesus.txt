import React, { useState, useEffect } from 'react';
import './BaraDeSus.css';
import logo from '../../Imagini/logoTime.png';
import NotificationsIcon from '@mui/icons-material/NotificationsNone';
import UserIcon from '@mui/icons-material/AccountBoxRounded';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from '../../Config/ConexiuneAxios';

const BaraDeSus = ({ comutaMeniu }) => {
  const [departament, setDepartament] = useState('');
  const [numeUtilizator, setNumeUtilizator] = useState('');
  const [notificari, setNotificari] = useState([]);
  const [afiseazaNotificari, setAfiseazaNotificari] = useState(false);

  useEffect(() => {
    const preiaDepartament = async () => {
      try {
        const raspuns = await axiosInstance.get('user/department/');
        if (raspuns.data?.department) {
          setDepartament(`${raspuns.data.department} Departament`);
        }
      } catch (error) {
        console.error('Eroare la preluarea departamentului:', error);
      }
    };

    const preiaNumeUtilizator = async () => {
      try {
        const raspuns = await axiosInstance.get('user/name/');
        if (raspuns.data?.first_name && raspuns.data?.last_name) {
          setNumeUtilizator(`${raspuns.data.first_name} ${raspuns.data.last_name}`);
        }
      } catch (error) {
        console.error('Eroare la preluarea numelui utilizatorului:', error);
      }
    };

    const preiaNotificari = async () => {
      try {
        const raspuns = await axiosInstance.get('/get_notifications/');
        setNotificari(raspuns.data);
      } catch (error) {
        console.error('Eroare la preluarea notificărilor:', error);
      }
    };

    preiaDepartament();
    preiaNumeUtilizator();
    preiaNotificari();
  }, []);

  const comutaNotificari = () => {
    setAfiseazaNotificari(!afiseazaNotificari);
  };

  const stergeNotificare = async (id) => {
    try {
      await axiosInstance.delete(`/delete_notification/${id}/`);
      setNotificari(notificari.filter(n => n.id !== id));
    } catch (err) {
      console.error('Eroare la ștergerea notificării:', err);
    }
  };

  return (
    <div className="bara-sus">
      <div className="sectiune-logo">
        <img src={logo} alt="Logo" className="logo" />

        <div className="nume-aplicatie">
          <h1 className="titlu">
            <span className="titlu-time">Time</span>
            <span className="titlu-tracker">Tracker</span>
          </h1>

          <h2>{departament}</h2>
        </div>
      </div>

      <div className="sectiune-utilizator">

        {/* Buton meniu */}
        <button className="buton-meniu" onClick={comutaMeniu}>
          <MenuIcon fontSize="medium" />
        </button>

        {/* Notificări */}
        <div className="container-notificari">
          <button className="buton-notificare" onClick={comutaNotificari}>
            <NotificationsIcon fontSize="medium" />
            {notificari.length > 0 && (
              <span className="indicator-notificari">{notificari.length}</span>
            )}
          </button>

          {afiseazaNotificari && (
            <div className="lista-notificari">
              {notificari.length > 0 ? (
                notificari.map((n) => (
                  <div key={n.id} className="notificare-item">
                    <p className="text-notificare">
                      {n.description} — {new Date(n.date).toLocaleDateString()}
                    </p>

                    <CloseIcon
                      className="icon-sterge"
                      onClick={() => stergeNotificare(n.id)}
                    />
                  </div>
                ))
              ) : (
                <p className="fara-notificari">Nu ai notificări!</p>
              )}
            </div>
          )}
        </div>

        {/* User info */}
        <div className="utilizator">
          <p>{numeUtilizator}</p>
          <UserIcon className="icon-utilizator" fontSize="medium" />
        </div>
      </div>
    </div>
  );
};
  
export default BaraDeSus;
