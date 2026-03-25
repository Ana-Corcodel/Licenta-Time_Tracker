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
import { Search, Edit, Add, Fingerprint } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import AddAngajati from './AddAngajati';
import EditAngajati from './EditAngajati';
import './AdministrareaAngajatilor.css';

const PAGINA_DEFAULT = 10;
const DEBOUNCE_MS = 300;

const STATUS_MAP = {
  active: { label: 'Activ', color: '#4caf50', bgColor: '#e8f5e8' },
  activ: { label: 'Activ', color: '#4caf50', bgColor: '#e8f5e8' },

  inactive: { label: 'Inactiv', color: '#f44336', bgColor: '#ffebee' },
  inactiv: { label: 'Inactiv', color: '#f44336', bgColor: '#ffebee' },

  suspended: { label: 'Suspendat', color: '#ff9800', bgColor: '#fff3e0' },
  suspendat: { label: 'Suspendat', color: '#ff9800', bgColor: '#fff3e0' },
};

const STATUS_BY_ID = {
  1: 'activ',
  2: 'inactiv',
  3: 'suspendat',
};

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

const normalizeStatusKey = (status) => {
  if (status == null) return null;

  if (typeof status === 'object') {
    const possible =
      status.code ??
      status.key ??
      status.slug ??
      status.value ??
      status.name ??
      status.denumire ??
      status.label;

    if (status.id != null && STATUS_BY_ID[Number(status.id)]) {
      return STATUS_BY_ID[Number(status.id)];
    }

    if (possible != null) {
      const s = String(possible).trim().toLowerCase();
      if (STATUS_MAP[s]) return s;
    }

    return null;
  }

  const asNumber = Number(status);
  if (!Number.isNaN(asNumber) && STATUS_BY_ID[asNumber]) {
    return STATUS_BY_ID[asNumber];
  }

  const s = String(status).trim().toLowerCase();
  if (STATUS_MAP[s]) return s;

  return null;
};

const getStatusLabelFallback = (status) => {
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
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [enrollLoadingId, setEnrollLoadingId] = useState(null);
  const [enrollStatus, setEnrollStatus] = useState('');

  const searchDebounced = useDebounce(search, DEBOUNCE_MS);

  const fetchAngajati = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/angajati/');
      const data = Array.isArray(res.data) ? res.data : res.data?.results;
      setAngajati(data || []);
    } catch (err) {
      console.error('Eroare la încărcarea angajaților:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAngajati();
  }, [fetchAngajati]);

  const handleEditEmployee = useCallback((employee) => {
    setSelectedEmployee(employee);
    setOpenEditModal(true);
  }, []);

  const handleEnrollFingerprint = useCallback(async (employee) => {
    let interval = null;

    try {
      setEnrollLoadingId(employee.id);
      setEnrollStatus(`Pornesc înrolarea pentru ${employee.nume} ${employee.prenume}...`);

      const response = await axiosInstance.post('/api/start-enroll/', {
        angajat_id: employee.id,
      });

      const { cerere_id } = response.data;

      setToastMessage(`Cerere de înrolare pornită pentru ${employee.nume} ${employee.prenume}`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);

      interval = setInterval(async () => {
        try {
          const statusResponse = await axiosInstance.get(`/api/enroll-status/${cerere_id}/`);
          const data = statusResponse.data;

          setEnrollStatus(
            `${data.angajat.nume} ${data.angajat.prenume}: ${data.mesaj || data.status}`
          );

          if (data.status === 'success') {
            clearInterval(interval);
            setEnrollLoadingId(null);

            setToastMessage(
              `Amprenta a fost înregistrată pentru ${data.angajat.nume} ${data.angajat.prenume}`
            );
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
            fetchAngajati();
          }

          if (data.status === 'failed') {
            clearInterval(interval);
            setEnrollLoadingId(null);

            setToastMessage(data.mesaj || 'Înrolarea a eșuat');
            setShowToast(true);
            setTimeout(() => setShowToast(false), 4000);
          }
        } catch (err) {
          clearInterval(interval);
          setEnrollLoadingId(null);
          console.error('Eroare la verificarea statusului de enroll:', err);

          setToastMessage('Eroare la verificarea statusului de înrolare');
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4000);
        }
      }, 1500);
    } catch (err) {
      console.error('Eroare la pornirea enroll-ului:', err);
      setEnrollLoadingId(null);

      const mesaj =
        err?.response?.data?.error ||
        'Nu s-a putut porni cererea de înrolare';

      setToastMessage(mesaj);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [fetchAngajati]);

  const randuriFiltrate = useMemo(() => {
    let lista = [...angajati];

    if (searchDebounced) {
      const s = searchDebounced.toLowerCase();
      lista = lista.filter((a) =>
        a.nume?.toLowerCase().includes(s) ||
        a.prenume?.toLowerCase().includes(s) ||
        `${a.nume} ${a.prenume}`.toLowerCase().includes(s) ||
        a.functie?.toLowerCase().includes(s)
      );
    }

    return lista.map((a, index) => ({
      id: a.id ?? index,
      ...a,
    }));
  }, [angajati, searchDebounced]);

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
        renderCell: (params) => params.value || '30',
      },
      {
        field: 'status',
        headerName: 'Status',
        flex: 1,
        minWidth: 150,
        align: 'center',
        headerAlign: 'center',
        renderCell: (params) => {
          const rawStatus = params.row.status;
          const statusKey = normalizeStatusKey(rawStatus);
          const cfg = statusKey ? STATUS_MAP[statusKey] : null;

          if (!cfg) {
            return (
              <Box
                sx={{
                  width: '120px',
                  display: 'flex',
                  justifyContent: 'center',
                }}
              >
                <span style={{ textAlign: 'center', width: '100%' }}>
                  {getStatusLabelFallback(rawStatus) || '–'}
                </span>
              </Box>
            );
          }

          return (
            <Chip
              label={cfg.label}
              size="small"
              sx={{
                width: '120px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                backgroundColor: cfg.bgColor,
                color: cfg.color,
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
        width: 130,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <div style={{ display: 'flex', gap: 8 }}>
            <IconButton
              sx={{ color: '#1976d2' }}
              onClick={() => handleEditEmployee(params.row)}
              title="Editează"
            >
              <Edit />
            </IconButton>

            <IconButton
              sx={{
                color: params.row.are_amprenta ? '#7b1fa2' : '#ff9800'
              }}
              onClick={() => handleEnrollFingerprint(params.row)}
              disabled={enrollLoadingId === params.row.id}
              title={
                params.row.are_amprenta
                  ? 'Angajatul are deja amprentă'
                  : 'Înregistrează amprentă'
              }
            >
              <Fingerprint />
            </IconButton>
          </div>
        ),
      },
    ],
    [handleEditEmployee, handleEnrollFingerprint, enrollLoadingId]
  );

  return (
    <div className="admin-angajati">
      {showToast && <div className="employees-toast">{toastMessage}</div>}

      <div className="admin-angajati-container">
        <Box className="admin-toolbar">
          <h2 className="admin-title">
            ADMINISTRAREA ANGAJAȚILOR
            <span className="admin-count">({randuriFiltrate.length})</span>
          </h2>

          <Box className="admin-toolbar-right">
            <TextField
              size="small"
              placeholder="Caută angajat..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-input"
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
              className="btn-new"
              onClick={() => setOpenAddModal(true)}
            >
              Adaugă
            </Button>
          </Box>
        </Box>

        {enrollStatus && (
          <div
            style={{
              marginBottom: '12px',
              padding: '10px 14px',
              background: '#f3e5f5',
              color: '#6a1b9a',
              borderRadius: '8px',
              fontWeight: 500,
            }}
          >
            {enrollStatus}
          </div>
        )}

        <div className="tabel-container">
          <DataGrid
            rows={randuriFiltrate}
            columns={coloane}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 15, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: { pageSize: PAGINA_DEFAULT, page: 0 },
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
            }}
          />
        </div>
      </div>

      <AddAngajati
        open={openAddModal}
        onClose={(shouldReload, message) => {
          setOpenAddModal(false);
          if (shouldReload) {
            fetchAngajati();
            if (message) {
              setToastMessage(message);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);
            }
          }
        }}
      />

      <EditAngajati
        open={openEditModal}
        employeeData={selectedEmployee}
        onClose={(shouldReload, message) => {
          setOpenEditModal(false);
          setSelectedEmployee(null);
          if (shouldReload) {
            fetchAngajati();
            if (message) {
              setToastMessage(message);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);
            }
          }
        }}
      />
    </div>
  );
};

export default AdministrareaAngajatilor;