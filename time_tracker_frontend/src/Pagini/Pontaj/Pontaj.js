import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, TextField, InputAdornment, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Add, Edit } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import AddPontaj from './AddPontaj';
import EditPontaj from './EditPontaj'; // Adaugă acest import
import './Pontaj.css';

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 10;

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

const usePontaje = () => {
  const [pontaje, setPontaje] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPontaje = useCallback(async () => {
    try {
      setLoading(true);

      const [pontajRes, angRes, tipRes] = await Promise.all([
        axiosInstance.get('/pontaje/'),
        axiosInstance.get('/angajati/'),
        axiosInstance.get('/tipuri-zile/'),
      ]);

      const angMap = {};
      angRes.data.forEach(a => {
        angMap[a.id] = `${a.nume} ${a.prenume}`;
      });

      const tipMap = {};
      tipRes.data.forEach(t => {
        // Afișăm prescurtarea dacă există, altfel tip_zi
        tipMap[t.id] = t.prescurtare || t.tip_zi;
      });

      const mapped = pontajRes.data.map((p, idx) => ({
        id: p.id ?? idx,
        ...p,
        angajat_nume: angMap[p.angajat] || '-',
        tip_zi: tipMap[p.tip] || '-',
        // Format data pentru afișare
        data_display: p.data ? new Date(p.data).toLocaleDateString('ro-RO') : '-',
        // Extragem anul din câmpul an (care e date)
        an_display: p.an ? new Date(p.an).getFullYear() : '-',
      }));

      setPontaje(mapped);
    } catch (e) {
      console.error('fetchPontaje error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  return { pontaje, loading, fetchPontaje };
};

const Pontaj = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedPontaj, setSelectedPontaj] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const { pontaje, loading, fetchPontaje } = usePontaje();

  useEffect(() => {
    fetchPontaje();
  }, [fetchPontaje]);

  const handleEditPontaj = useCallback((pontaj) => {
    setSelectedPontaj(pontaj);
    setOpenEditModal(true);
  }, []);

  // Filtrare
  const filteredRows = useMemo(() => {
    let list = [...pontaje];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter(p =>
        p.angajat_nume?.toLowerCase().includes(s) ||
        p.luna?.toLowerCase().includes(s) ||
        p.tip_zi?.toLowerCase().includes(s) ||
        p.data_display?.includes(s)
      );
    }

    return list;
  }, [pontaje, debouncedSearch]);

  // Coloane
  const columns = useMemo(() => [
    {
      field: 'angajat_nume',
      headerName: 'Angajat',
      flex: 1.4,
      minWidth: 180,
    },
    {
      field: 'data_display',
      headerName: 'Data',
      flex: 1,
      minWidth: 130,
    },
    {
      field: 'luna',
      headerName: 'Luna',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'an_display',
      headerName: 'An',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'ora_start',
      headerName: 'Ora start',
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: 'ora_sfarsit',
      headerName: 'Ora sfârșit',
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: 'pauza_masa',
      headerName: 'Pauză (min)',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'ore_lucrate',
      headerName: 'Ore lucrate',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'ore_lucru_suplimentare',
      headerName: 'Ore supl.',
      flex: 0.9,
      minWidth: 110,
    },
    {
      field: 'tip_zi',
      headerName: 'Tip zi',
      flex: 0.9,
      minWidth: 110,
    },
    {
      field: 'action',
      headerName: 'Acțiuni',
      width: 100,
      sortable: false,
      renderCell: (params) => (
        <IconButton
          sx={{ color: '#1976d2' }}
          onClick={() => handleEditPontaj(params.row)}
        >
          <Edit />
        </IconButton>
      ),
    },
  ], [handleEditPontaj]);

  return (
    <div className="pontajpage">
      <div className="pontaj-page">

        {/* Toast pentru notificări */}
        {showToast && <div className="global-toast">{toastMessage}</div>}

        <Box className="pontaj-toolbar">
          <h2 className="title">
            PONTAJ
            <span className="title-count"> ({filteredRows.length})</span>
          </h2>

          <Box className="pontaj-toolbar-right">
            <TextField
              size="small"
              placeholder="Caută pontaj..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              onClick={() => setOpenAddModal(true)}
            >
              ADAUGĂ
            </Button>
          </Box>
        </Box>

        <div className="table-container">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 15, 20, 50]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: DEFAULT_PAGE_SIZE },
              },
            }}
            rowHeight={40}
            sx={{
              borderRadius: '8px',
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
            }}
          />
        </div>

      </div>

      {/* Modal Adăugare Pontaj */}
      <AddPontaj
        open={openAddModal}
        onClose={(shouldReload, message) => {
          setOpenAddModal(false);
          if (shouldReload) {
            fetchPontaje();
            if (message) {
              setToastMessage(message);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);
            }
          }
        }}
      />

      {/* Modal Editare Pontaj */}
      <EditPontaj
        open={openEditModal}
        pontajData={selectedPontaj}
        onClose={(shouldReload, message) => {
          setOpenEditModal(false);
          setSelectedPontaj(null);
          if (shouldReload) {
            fetchPontaje();
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

export default Pontaj;