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
  const [esteDeschisaListaNotificari, setEsteDeschisaListaNotificari] = useState(false);

  useEffect(() => {
    const preiaUtilizator = async () => {
      try {
        const raspuns = await axiosInstance.get('/api/utilizator-curent/');

        if (raspuns.data?.autentificat && raspuns.data?.user) {
          const utilizator = raspuns.data.user;

          if (utilizator.nume && utilizator.prenume) {
            setNumeUtilizator(`${utilizator.nume} ${utilizator.prenume}`);
          } else if (utilizator.username) {
            setNumeUtilizator(utilizator.username);
          } else {
            setNumeUtilizator(utilizator.email);
          }
        }
      } catch (eroare) {
        console.error('Eroare la preluarea utilizatorului:', eroare);
      }
    };

    const preiaNotificari = async () => {
      try {
        const raspuns = await axiosInstance.get('/get_notifications/');
        setNotificari(raspuns.data);
      } catch (eroare) {
        console.error('Eroare la preluarea notificărilor:', eroare);
      }
    };

    preiaUtilizator();
    preiaNotificari();
  }, []);

  const comutaAfisareNotificari = () => {
    setEsteDeschisaListaNotificari(!esteDeschisaListaNotificari);
  };

  const stergeNotificare = async (id) => {
    try {
      await axiosInstance.delete(`/delete_notification/${id}/`);
      const notificariActualizate = notificari.filter((notificare) => notificare.id !== id);
      setNotificari(notificariActualizate);
    } catch (eroare) {
      console.error('Eroare la ștergerea notificării:', eroare);
    }
  };

  return (
    <div className="bara-sus">
      <div className="sectiune-logo">
        <div className="container-logo">
          <img src={logo} alt="Logo" className="imagine-logo" />
        </div>

        <div className="nume-aplicatie">
          <h1>Sistem Pontaj</h1>
        </div>
      </div>

      <div className="sectiune-utilizator">
        <button className="buton-meniu" onClick={comutaMeniu}>
          <MenuIcon fontSize="medium" style={{ marginRight: '6px' }} />
        </button>

        <div className="container-notificari">
          <button className="buton-notificari" onClick={comutaAfisareNotificari}>
            <NotificationsIcon fontSize="medium" style={{ marginRight: '4px' }} />
            {notificari.length > 0 && (
              <span className="insigna-notificari">{notificari.length}</span>
            )}
          </button>

          {esteDeschisaListaNotificari && (
            <div className="lista-notificari">
              {notificari.length > 0 ? (
                notificari.map((notificare) => (
                  <div key={notificare.id} className="element-notificare">
                    <p className="text-notificare">
                      {notificare.description} {new Date(notificare.date).toLocaleDateString()}
                    </p>

                    <CloseIcon
                      className="icon-inchidere"
                      onClick={() => stergeNotificare(notificare.id)}
                    />
                  </div>
                ))
              ) : (
                <p className="fara-notificari">Nu ai notificări!</p>
              )}
            </div>
          )}
        </div>

        <div className="utilizator">
          <p>{numeUtilizator}</p>
          <UserIcon
            className="icon-utilizator"
            fontSize="medium"
            style={{ marginRight: '6px', marginLeft: '6px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default BaraDeSus;