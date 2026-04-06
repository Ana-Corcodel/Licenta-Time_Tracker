import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Tooltip } from '@mui/material';
import { Search, Edit, Add, Fingerprint, Delete } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import AddAngajati from './AddAngajati';
import EditAngajati from './EditAngajati';
import './AdministrareaAngajatilor.css';

const PAGINA_IMPLICITA = 10;
const TIMP_DEBOUNCE_MS = 300;

const MAPARE_STATUS = {
  active: { eticheta: 'Activ', culoare: '#4caf50', culoareFundal: '#e8f5e8' },
  activ: { eticheta: 'Activ', culoare: '#4caf50', culoareFundal: '#e8f5e8' },

  inactive: { eticheta: 'Inactiv', culoare: '#f44336', culoareFundal: '#ffebee' },
  inactiv: { eticheta: 'Inactiv', culoare: '#f44336', culoareFundal: '#ffebee' },

  suspended: { eticheta: 'Suspendat', culoare: '#ff9800', culoareFundal: '#fff3e0' },
  suspendat: { eticheta: 'Suspendat', culoare: '#ff9800', culoareFundal: '#fff3e0' },
};

const STATUS_DUPA_ID = {
  1: 'activ',
  2: 'inactiv',
  3: 'suspendat',
};

const useDebounce   = (valoare, intarziere) => {
  const [valoareIntarziata, setValoareIntarziata] = useState(valoare);

  useEffect(() => {
    const temporizator = setTimeout(() => setValoareIntarziata(valoare), intarziere);
    return () => clearTimeout(temporizator);
  }, [valoare, intarziere]);

  return valoareIntarziata;
};

const normalizeazaCheiaStatusului = (status) => {
  if (status == null) return null;

  if (typeof status === 'object') {
    const valoarePosibila =
      status.code ??
      status.key ??
      status.slug ??
      status.value ??
      status.name ??
      status.denumire ??
      status.label;

    if (status.id != null && STATUS_DUPA_ID[Number(status.id)]) {
      return STATUS_DUPA_ID[Number(status.id)];
    }

    if (valoarePosibila != null) {
      const statusText = String(valoarePosibila).trim().toLowerCase();
      if (MAPARE_STATUS[statusText]) return statusText;
    }

    return null;
  }

  const valoareNumerica = Number(status);
  if (!Number.isNaN(valoareNumerica) && STATUS_DUPA_ID[valoareNumerica]) {
    return STATUS_DUPA_ID[valoareNumerica];
  }

  const statusText = String(status).trim().toLowerCase();
  if (MAPARE_STATUS[statusText]) return statusText;

  return null;
};

const obtineEtichetaStatusFallback = (status) => {
  if (status == null) return '–';

  if (typeof status === 'object') {
    return (
      status.denumire ??
      status.label ??
      status.name ??
      status.code ??
      (status.id != null ? String(status.id) : '–')
    );
  }

  return String(status);
};

const AdministrareaAngajatilor = () => {
  const [angajati, setAngajati] = useState([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [textCautare, setTextCautare] = useState('');
  const [esteDeschisModalAdaugare, setEsteDeschisModalAdaugare] = useState(false);
  const [esteDeschisModalEditare, setEsteDeschisModalEditare] = useState(false);
  const [angajatSelectat, setAngajatSelectat] = useState(null);
  const [afiseazaToast, setAfiseazaToast] = useState(false);
  const [mesajToast, setMesajToast] = useState('');
  const [idInrolareInCurs, setIdInrolareInCurs] = useState(null);
  const [idStergereInCurs, setIdStergereInCurs] = useState(null);

  const cautareIntarziata = useDebounce (textCautare, TIMP_DEBOUNCE_MS);

  const preiaAngajati = useCallback(async () => {
    try {
      setSeIncarca(true);
      const raspuns = await axiosInstance.get('/api/angajati/');
      const date = Array.isArray(raspuns.data) ? raspuns.data : raspuns.data?.results;
      setAngajati(date || []);
    } catch (eroare) {
      console.error('Eroare la încărcarea angajaților:', eroare);
    } finally {
      setSeIncarca(false);
    }
  }, []);

  useEffect(() => {
    preiaAngajati();
  }, [preiaAngajati]);

  const afiseazaMesajToast = (mesaj) => {
    setMesajToast(mesaj);
    setAfiseazaToast(true);
    setTimeout(() => setAfiseazaToast(false), 4000);
  };

  const gestioneazaEditareAngajat = useCallback((angajat) => {
    setAngajatSelectat(angajat);
    setEsteDeschisModalEditare(true);
  }, []);

  const gestioneazaInrolareAmprenta = useCallback(async (angajat) => {
    let interval = null;

    try {
      setIdInrolareInCurs(angajat.id);

      const raspuns = await axiosInstance.post('/api/start-enroll/', {
        angajat_id: angajat.id,
      });

      const { cerere_id } = raspuns.data;

      afiseazaMesajToast(`Cerere de înrolare pornită pentru ${angajat.nume} ${angajat.prenume}`);

      interval = setInterval(async () => {
        try {
          const raspunsStatus = await axiosInstance.get(`/api/enroll-status/${cerere_id}/`);
          const date = raspunsStatus.data;

          if (date.status === 'success') {
            clearInterval(interval);
            setIdInrolareInCurs(null);

            afiseazaMesajToast(
              `Amprenta a fost înregistrată pentru ${date.angajat.nume} ${date.angajat.prenume}`
            );
            preiaAngajati();
          }

          if (date.status === 'failed') {
            clearInterval(interval);
            setIdInrolareInCurs(null);

            afiseazaMesajToast(date.mesaj || 'Înrolarea a eșuat');
          }
        } catch (eroare) {
          clearInterval(interval);
          setIdInrolareInCurs(null);
          console.error('Eroare la verificarea statusului de înrolare:', eroare);
          afiseazaMesajToast('Eroare la verificarea statusului de înrolare');
        }
      }, 1500);
    } catch (eroare) {
      console.error('Eroare la pornirea înrolării:', eroare);
      setIdInrolareInCurs(null);

      const mesaj =
        eroare?.response?.data?.error ||
        'Nu s-a putut porni cererea de înrolare';

      afiseazaMesajToast(mesaj);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [preiaAngajati]);

  const gestioneazaStergereAmprenta = useCallback(async (angajat) => {
    let interval = null;

    try {
      setIdStergereInCurs(angajat.id);

      const raspuns = await axiosInstance.post('/api/start-delete-fingerprint/', {
        angajat_id: angajat.id,
      });

      const { cerere_id } = raspuns.data;

      afiseazaMesajToast(`Cerere de ștergere pornită pentru ${angajat.nume} ${angajat.prenume}`);

      interval = setInterval(async () => {
        try {
          const raspunsStatus = await axiosInstance.get(`/api/delete-status/${cerere_id}/`);
          const date = raspunsStatus.data;

          if (date.status === 'success') {
            clearInterval(interval);
            setIdStergereInCurs(null);

            afiseazaMesajToast(
              `Amprenta a fost ștearsă pentru ${date.angajat.nume} ${date.angajat.prenume}`
            );
            preiaAngajati();
          }

          if (date.status === 'failed') {
            clearInterval(interval);
            setIdStergereInCurs(null);

            afiseazaMesajToast(date.mesaj || 'Ștergerea amprentei a eșuat');
          }
        } catch (eroare) {
          clearInterval(interval);
          setIdStergereInCurs(null);
          console.error('Eroare la verificarea statusului de ștergere:', eroare);
          afiseazaMesajToast('Eroare la verificarea statusului de ștergere');
        }
      }, 1500);
    } catch (eroare) {
      console.error('Eroare la pornirea ștergerii:', eroare);
      setIdStergereInCurs(null);

      const mesaj =
        eroare?.response?.data?.error ||
        'Nu s-a putut porni cererea de ștergere';

      afiseazaMesajToast(mesaj);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [preiaAngajati]);

  const randuriFiltrate = useMemo(() => {
    let lista = [...angajati];

    if (cautareIntarziata) {
      const text = cautareIntarziata.toLowerCase();
      lista = lista.filter((angajat) =>
        angajat.nume?.toLowerCase().includes(text) ||
        angajat.prenume?.toLowerCase().includes(text) ||
        `${angajat.nume} ${angajat.prenume}`.toLowerCase().includes(text) ||
        angajat.functie?.toLowerCase().includes(text)
      );
    }

    return lista.map((angajat, index) => ({
      id: angajat.id ?? index,
      ...angajat,
    }));
  }, [angajati, cautareIntarziata]);

  const coloane = useMemo(
    () => [
      {
        field: 'nume_complet',
        headerName: 'Nume complet',
        flex: 1.4,
        minWidth: 180,
        renderCell: (params) =>
          `${params.row.nume || ''} ${params.row.prenume || ''}`,
      },
      {
        field: 'functie',
        headerName: 'Funcție',
        flex: 1.2,
        minWidth: 160,
      },
      {
        field: 'telefon',
        headerName: 'Telefon',
        flex: 1,
        minWidth: 140,
        renderCell: (params) => params.value || '–',
      },
      {
        field: 'email',
        headerName: 'Email',
        flex: 1.5,
        minWidth: 200,
        renderCell: (params) => params.value || '–',
      },
      {
        field: 'locatie',
        headerName: 'Locație',
        flex: 1.3,
        minWidth: 180,
        renderCell: (params) => params.value || '–',
      },
      {
        field: 'program',
        headerName: 'Program',
        flex: 1.1,
        minWidth: 160,
        renderCell: (params) =>
          `${params.row.ora_incepere || '09:00'} - ${params.row.ora_sfarsit || '17:00'}`,
      },
      {
        field: 'ora_pauza',
        headerName: 'Pauză (min)',
        flex: 0.8,
        minWidth: 120,
        renderCell: (params) => params.value ?? '30',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        minWidth: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const statusBrut = params.row.status;
          const cheieStatus = normalizeazaCheiaStatusului(statusBrut);
          const configuratie = cheieStatus ? MAPARE_STATUS[cheieStatus] : null;

          if (!configuratie) {
            return (
              <Box
                sx={{
                  width: '120px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <span style={{ textAlign: 'center', width: '100%' }}>
                  {obtineEtichetaStatusFallback(statusBrut) || '–'}
                </span>
              </Box>
            );
          }

          return (
            <Chip
              label={configuratie.eticheta}
              size="small"
              sx={{
                width: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: configuratie.culoareFundal,
                color: configuratie.culoare,
                fontWeight: 600,
                fontSize: '0.75rem',
                height: '28px',
                borderRadius: '8px',
                '& .MuiChip-label': {
                  width: '100%',
                  textAlign: 'center',
                  padding: 0,
                },
              }}
            />
          );
        },
      },
      {
        field: 'actiuni',
        headerName: 'Acțiuni',
        width: 170,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton
              sx={{ color: '#1976d2' }}
              onClick={() => gestioneazaEditareAngajat(params.row)}
              title="Editează"
            >
              <Edit />
            </IconButton>

            <Tooltip
              title={
                params.row.are_amprenta
                  ? 'Amprentă existentă'
                  : 'Înregistrează amprentă'
              }
            >
              <span>
                <IconButton
                  sx={{
                    color: params.row.are_amprenta ? '#2e7d32' : '#ff9800',
                    '&.Mui-disabled': {
                      color: params.row.are_amprenta ? '#2e7d32' : '#ff9800',
                      opacity: 0.7
                    }
                  }}
                  onClick={() => gestioneazaInrolareAmprenta(params.row)}
                  disabled={idInrolareInCurs === params.row.id || params.row.are_amprenta}
                >
                  <Fingerprint />
                </IconButton>
              </span>
            </Tooltip>

            <Tooltip
              title={
                params.row.are_amprenta
                  ? 'Șterge amprenta'
                  : 'Angajatul nu are amprentă'
              }
            >
              <span>
                <IconButton
                  sx={{
                    color: params.row.are_amprenta ? '#f44336' : '#9e9e9e',
                    '&.Mui-disabled': {
                      color: params.row.are_amprenta ? '#f44336' : '#9e9e9e',
                      opacity: 0.7
                    }
                  }}
                  onClick={() => gestioneazaStergereAmprenta(params.row)}
                  disabled={idStergereInCurs === params.row.id || !params.row.are_amprenta}
                >
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        ),
      },
    ],
    [gestioneazaEditareAngajat, gestioneazaInrolareAmprenta, gestioneazaStergereAmprenta, idInrolareInCurs, idStergereInCurs]
  );

  return (
    <div className="pagina-administrare-angajati">
      {afiseazaToast && <div className="toast-angajati">{mesajToast}</div>}

      <div className="container-administrare-angajati">
        <Box className="bara-unelte-angajati">
          <h2 className="titlu-administrare-angajati">
            ADMINISTRAREA ANGAJAȚILOR
            <span className="numar-angajati">({randuriFiltrate.length})</span>
          </h2>

          <Box className="dreapta-bara-unelte-angajati">
            <TextField
              size="small"
              placeholder="Caută angajat..."
              value={textCautare}
              onChange={(e) => setTextCautare(e.target.value)}
              className="input-cautare-angajati"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              startIcon={<Add />}
              className="buton-adauga-angajat"
              onClick={() => setEsteDeschisModalAdaugare(true)}
            >
              ADAUGĂ
            </Button>
          </Box>
        </Box>

        <div className="container-tabel-angajati">
          <DataGrid
            rows={randuriFiltrate}
            columns={coloane}
            loading={seIncarca}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 15, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: PAGINA_IMPLICITA, page: 0 },
              },
            }}
            rowHeight={50}
            autoHeight={false}
            sx={{
              borderRadius: '8px',
              height: '100%',
              '& .MuiDataGrid-cell': {
                alignItems: 'center',
                display: 'flex',
              },
              '& .MuiDataGrid-cell:focus': {
                outline: 'none',
              },
              '& .MuiDataGrid-columnHeaderTitle': {
                fontWeight: '700',
                fontSize: '0.95rem'
              }
            }}
          />
        </div>
      </div>

      <AddAngajati
        open={esteDeschisModalAdaugare}
        onClose={(trebuieReincarcat, mesaj) => {
          setEsteDeschisModalAdaugare(false);
          if (trebuieReincarcat) {
            preiaAngajati();
            if (mesaj) afiseazaMesajToast(mesaj);
          }
        }}
      />

      <EditAngajati
        open={esteDeschisModalEditare}
        employeeData={angajatSelectat}
        onClose={(trebuieReincarcat, mesaj) => {
          setEsteDeschisModalEditare(false);
          setAngajatSelectat(null);
          if (trebuieReincarcat) {
            preiaAngajati();
            if (mesaj) afiseazaMesajToast(mesaj);
          }
        }}
      />
    </div>
  );
};

export default AdministrareaAngajatilor;