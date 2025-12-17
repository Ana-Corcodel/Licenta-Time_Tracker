import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, TextField, InputAdornment, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Add, Edit } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import './Pontaj.css';

const SEARCH_DEBOUNCE_MS = 300;
const DEFAULT_PAGE_SIZE = 10;

/* debounce hook */
const useDebounce = (value, delay) => {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
};

/* hook pontaje */
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
        angMap[a.id] = `${a.first_name} ${a.last_name}`;
      });

      const tipMap = {};
      tipRes.data.forEach(t => {
        tipMap[t.id] = t.prescurtare || t.name;
      });

      const mapped = pontajRes.data.map((p, idx) => ({
        id: p.id ?? idx,
        ...p,
        angajat_nume: angMap[p.angajat] || '-',
        tip_zi: tipMap[p.tip] || '-',
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
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  const { pontaje, loading, fetchPontaje } = usePontaje();

  useEffect(() => {
    fetchPontaje();
  }, [fetchPontaje]);

  /* filtrare */
  const filteredRows = useMemo(() => {
    let list = [...pontaje];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter(p =>
        p.angajat_nume.toLowerCase().includes(s) ||
        p.luna?.toLowerCase().includes(s) ||
        p.tip_zi?.toLowerCase().includes(s)
      );
    }

    return list;
  }, [pontaje, debouncedSearch]);

  /* coloane */
  const columns = useMemo(() => [
    {
      field: 'angajat_nume',
      headerName: 'Angajat',
      flex: 1.4,
      minWidth: 180,
    },
    {
      field: 'data',
      headerName: 'Data',
      flex: 1,
      minWidth: 130,
      renderCell: (params) =>
        new Date(params.value).toLocaleDateString('ro-RO'),
    },
    {
      field: 'luna',
      headerName: 'Luna',
      flex: 0.9,
      minWidth: 120,
    },
    {
      field: 'an',
      headerName: 'An',
      flex: 0.9,
      minWidth: 120,
      renderCell: (params) =>
        new Date(params.value).getFullYear(),
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
      headerName: 'Action',
      width: 100,
      sortable: false,
      renderCell: () => (
        <IconButton sx={{ color: '#1976d2' }}>
          <Edit />
        </IconButton>
      ),
    },
  ], []);

  return (
    <div className="pontajpage">
      <div className="pontaj-page">

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
            >
              New
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
    </div>
  );
};

export default Pontaj;
