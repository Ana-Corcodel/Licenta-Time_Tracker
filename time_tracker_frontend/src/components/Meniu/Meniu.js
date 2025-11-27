import './Meniu.css';
import LogoutIcon from '@mui/icons-material/Logout';

const grupuriMeniuGoale = [];

const Meniu = ({ esteDeschis, seteazaDeschis }) => {

  const delogare = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return (
    <div className={`bara-laterala ${esteDeschis ? 'deschis' : ''}`}>
      <ul className="lista-meniu">

        {grupuriMeniuGoale.map((grup) => (
          <div key={grup.sectiune}>
            <div className="titlu-sectiune">
              {grup.icon}
              <span>{grup.sectiune}</span>
            </div>

            {/* Nu există pagini încă */}
            <p className="sectiune-goala">Momentan nu există pagini</p>
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
