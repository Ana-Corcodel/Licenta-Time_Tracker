import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, TextField, InputAdornment, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Add, Edit } from '@mui/icons-material';

import axiosInstance from '../../Config/axiosInstance';
import './TipZi.css';

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

/* hook TipZi */
const useTipZi = () => {
  const [tipuriZi, setTipuriZi] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTipuriZi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/tip-zi/');
      setTipuriZi(res.data || []);
    } catch (err) {
      console.error('fetchTipuriZi error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  return { tipuriZi, loading, fetchTipuriZi };
};

const TipZi = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);

  const { tipuriZi, loading, fetchTipuriZi } = useTipZi();

  useEffect(() => {
    fetchTipuriZi();
  }, [fetchTipuriZi]);

  /* filtrare */
  const filteredRows = useMemo(() => {
    let list = [...tipuriZi];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter(t =>
        t.prescurtare?.toLowerCase().includes(s) ||
        t.tip_zi?.toLowerCase().includes(s)
      );
    }

    return list.map((t, idx) => ({
      id: t.id ?? idx,
      ...t,
    }));
  }, [tipuriZi, debouncedSearch]);

  /* coloane */
  const columns = useMemo(() => [
    {
      field: 'prescurtare',
      headerName: 'Prescurtare',
      flex: 0.8,
      minWidth: 140,
    },
    {
      field: 'tip_zi',
      headerName: 'Tip zi',
      flex: 1.4,
      minWidth: 200,
    },
    {
      field: 'action',
      headerName: 'Action',
      width: 100,
      sortable: false,
      disableColumnMenu: true,
      renderCell: () => (
        <IconButton sx={{ color: '#1976d2' }}>
          <Edit />
        </IconButton>
      ),
    },
  ], []);

  return (
    <div className="tipzipage">
      <div className="tipzi-page">

        {/* TOOLBAR */}
        <Box className="tipzi-toolbar">
          <h2 className="title">
            TIP ZI
            <span className="title-count"> ({filteredRows.length})</span>
          </h2>

          <Box className="tipzi-toolbar-right">
            <TextField
              size="small"
              placeholder="Search tip zi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: '#424242' }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              startIcon={<Add />}
              className="new-btn"
            >
              New
            </Button>
          </Box>
        </Box>

        {/* TABLE */}
        <div className="table-container">
          <DataGrid
            rows={filteredRows}
            columns={columns}
            loading={loading}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 15, 20, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: DEFAULT_PAGE_SIZE,
                },
              },
            }}
            rowHeight={40}
            sx={{
              borderRadius: '8px',
              '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
              '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                outline: 'none',
              },
              '& .Mui-selected:hover': {
                backgroundColor: 'transparent !important',
              },
            }}
          />
        </div>

      </div>
    </div>
  );
};

export default TipZi;
