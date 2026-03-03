import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Visibility, Edit, Add } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import './AdministrareaAngajatilor.css';

const PAGINA_DEFAULT = 10;
const DEBOUNCE_MS = 300;

const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
};

const AdministrareaAngajatilor = () => {
  const [angajati, setAngajati] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const searchDebounced = useDebounce(search, DEBOUNCE_MS);

  const fetchAngajati = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/angajati/');

      const data = Array.isArray(res.data)
        ? res.data
        : res.data.results;

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

  const randuriFiltrate = useMemo(() => {
    let lista = [...angajati];

    if (searchDebounced) {
      const s = searchDebounced.toLowerCase();
      lista = lista.filter(a =>
        a.nume?.toLowerCase().includes(s) ||
        a.prenume?.toLowerCase().includes(s) ||
        `${a.nume} ${a.prenume}`.toLowerCase().includes(s) ||
        a.functie?.toLowerCase().includes(s)
      );
    }

    return lista.map((a, index) => ({
      id: a.id ?? index,
      ...a
    }));
  }, [angajati, searchDebounced]);

  const coloane = useMemo(() => [
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
        `${params.row.ora_incepere} - ${params.row.ora_sfarsit}`,
    },
    {
      field: 'ora_pauza',
      headerName: 'Pauză (min)',
      flex: 0.8,
      minWidth: 120,
    },
    {
      field: 'status',
      headerName: 'Status',
      flex: 1,
      minWidth: 140,
      renderCell: (params) =>
        params.row.status?.denumire || params.row.status || '–',
    },
    {
      field: 'actiuni',
      headerName: 'Acțiuni',
      width: 120,
      sortable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <div style={{ display: 'flex', gap: 8 }}>
          <IconButton sx={{ color: '#093d71' }}>
            <Visibility />
          </IconButton>
          <IconButton sx={{ color: '#1976d2' }}>
            <Edit />
          </IconButton>
        </div>
      ),
    },
  ], []);

  return (
    <div className="admin-angajati">
      <div className="admin-angajati-container">

        <Box className="admin-toolbar">
          <h2 className="admin-title">
            ADMINISTRAREA ANGAJAȚILOR
            <span className="admin-count">
              ({randuriFiltrate.length})
            </span>
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
            >
              Adaugă
            </Button>
          </Box>
        </Box>

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
            rowHeight={40}
            sx={{
              borderRadius: '8px',
              '& .MuiDataGrid-cell': { alignItems: 'center' },
              '& .MuiDataGrid-cell:focus': { outline: 'none' },
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AdministrareaAngajatilor;
