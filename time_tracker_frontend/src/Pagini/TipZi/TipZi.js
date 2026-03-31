import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Box, Button, TextField, InputAdornment, IconButton
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { Search, Add, Edit } from '@mui/icons-material';
import axiosInstance from '../../Config/axiosInstance';
import AddTipZi from './AddTipZi';
import EditTipZi from './EditTipZi';
import './TipZi.css';

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

const useTipZi = () => {
  const [tipuriZi, setTipuriZi] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTipuriZi = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axiosInstance.get('/tipuri-zile/');
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
  const [openAddModal, setOpenAddModal] = useState(false);
  const [openEditModal, setOpenEditModal] = useState(false);
  const [selectedTip, setSelectedTip] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const debouncedSearch = useDebounce(searchTerm, SEARCH_DEBOUNCE_MS);
  const { tipuriZi, loading, fetchTipuriZi } = useTipZi();

  useEffect(() => {
    fetchTipuriZi();
  }, [fetchTipuriZi]);

  const handleEditTip = useCallback((tip) => {
    setSelectedTip(tip);
    setOpenEditModal(true);
  }, []);

  const filteredRows = useMemo(() => {
    let list = [...tipuriZi];

    if (debouncedSearch) {
      const s = debouncedSearch.toLowerCase();
      list = list.filter((t) =>
        t.prescurtare?.toLowerCase().includes(s) ||
        t.tip_zi?.toLowerCase().includes(s)
      );
    }

    return list.map((t, idx) => ({
      id: t.id ?? idx,
      ...t,
    }));
  }, [tipuriZi, debouncedSearch]);

  const columns = useMemo(
    () => [
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
        headerName: 'Acțiuni',
        width: 100,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <IconButton
            sx={{ color: '#1976d2' }}
            onClick={() => handleEditTip(params.row)}
          >
            <Edit />
          </IconButton>
        ),
      },
    ],
    [handleEditTip]
  );

  return (
    <div className="tipzipage">
      {showToast && <div className="global-toast">{toastMessage}</div>}

      <div className="tipzi-page">
        <Box className="tipzi-toolbar">
          <h2 className="title">
            TIP ZI
          </h2>

          <Box className="tipzi-toolbar-right">
            <TextField
              size="small"
              placeholder="Caută tip zi..."
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
            autoHeight={false}
            sx={{
              height: '100%',
              borderRadius: '8px',
              '& .MuiDataGrid-cell': {
                display: 'flex',
                alignItems: 'center',
              },
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

      <AddTipZi
        open={openAddModal}
        onClose={(shouldReload, message) => {
          setOpenAddModal(false);
          if (shouldReload) {
            fetchTipuriZi();
            if (message) {
              setToastMessage(message);
              setShowToast(true);
              setTimeout(() => setShowToast(false), 4000);
            }
          }
        }}
      />

      <EditTipZi
        open={openEditModal}
        tipData={selectedTip}
        onClose={(shouldReload, message) => {
          setOpenEditModal(false);
          setSelectedTip(null);
          if (shouldReload) {
            fetchTipuriZi();
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

export default TipZi;