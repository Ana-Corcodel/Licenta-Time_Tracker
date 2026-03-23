import React, { useState, useEffect } from 'react';
import './BaraDeSus.css';
import logo from '../../Imagini/logoTime.png';
import NotificationsIcon from '@mui/icons-material/NotificationsNone';
import UserIcon from '@mui/icons-material/AccountBoxRounded';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import axiosInstance from "../../Config/axiosInstance";

const BaraDeSus = ({ comutaMeniu }) => {
  const [numeUtilizator, setNumeUtilizator] = useState('');
  const [notificari, setNotificari] = useState([]);
  const [afiseazaNotificari, setAfiseazaNotificari] = useState(false);

  useEffect(() => {
    const preiaUtilizator = async () => {
      try {
        const raspuns = await axiosInstance.get('/api/utilizator-curent/');

        if (raspuns.data?.autentificat && raspuns.data?.user) {
          const user = raspuns.data.user;

          if (user.nume && user.prenume) {
            setNumeUtilizator(`${user.nume} ${user.prenume}`);
          } else if (user.username) {
            setNumeUtilizator(user.username);
          } else {
            setNumeUtilizator(user.email);
          }
        }
      } catch (error) {
        console.error('Eroare la preluarea utilizatorului:', error);
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

    preiaUtilizator();
    preiaNotificari();
  }, []);

  const comutaNotificari = () => {
    setAfiseazaNotificari(!afiseazaNotificari);
  };

  const stergeNotificare = async (id) => {
    try {
      await axiosInstance.delete(`/delete_notification/${id}/`);
      const notificariActualizate = notificari.filter((n) => n.id !== id);
      setNotificari(notificariActualizate);
    } catch (err) {
      console.error('Eroare la ștergerea notificării:', err);
    }
  };

  return (
    <div className="topbar">
      <div className="logo_section">
        <div className="logo">
          <img src={logo} alt="Logo" className="logo" />
        </div>
        <div className="app-name">
          <h1>TimeTracker</h1>
        </div>
      </div>

      <div className="user-section">
        <button className="menu-button" onClick={comutaMeniu}>
          <MenuIcon fontSize="medium" style={{ marginRight: '6px' }} />
        </button>

        <div className="notification-container">
          <button className="notification" onClick={comutaNotificari}>
            <NotificationsIcon fontSize="medium" style={{ marginRight: '4px' }} />
            {notificari.length > 0 && (
              <span className="notification-badge">{notificari.length}</span>
            )}
          </button>

          {afiseazaNotificari && (
            <div className="notification-dropdown">
              {notificari.length > 0 ? (
                notificari.map((n) => (
                  <div key={n.id} className="notification-item">
                    <p className="notification-text">
                      {n.description} {new Date(n.date).toLocaleDateString()}
                    </p>
                    <CloseIcon
                      className="close-icon"
                      onClick={() => stergeNotificare(n.id)}
                    />
                  </div>
                ))
              ) : (
                <p className="no-notifications">Nu ai notificări!</p>
              )}
            </div>
          )}
        </div>

        <div className="user">
          <p>{numeUtilizator}</p>
          <UserIcon
            className="User_icon"
            fontSize="medium"
            style={{ marginRight: '6px', marginLeft: '6px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default BaraDeSus;