import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Button, TextField, InputAdornment, IconButton
} from "@mui/material";
import { Search, Add, Edit } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import axiosInstance from "../../Config/axiosInstance";
import AddTipZi from "./AddTipZi";
import EditTipZi from "./EditTipZi";
import "./TipZi.css";

const DEBOUNCE_CAUTARE_MS = 300;
const DIMENSIUNE_PAGINA_IMPLICITA = 10;

const useDebounce = (valoare, intarziere) => {
  const [valoareCuIntarziere, setValoareCuIntarziere] = useState(valoare);

  useEffect(() => {
    const temporizator = setTimeout(() => setValoareCuIntarziere(valoare), intarziere);
    return () => clearTimeout(temporizator);
  }, [valoare, intarziere]);

  return valoareCuIntarziere;
};

const useTipZi = () => {
  const [tipuriZi, setTipuriZi] = useState([]);
  const [seIncarca, setSeIncarca] = useState(true);

  const preiaTipuriZi = useCallback(async () => {
    try {
      setSeIncarca(true);
      const raspuns = await axiosInstance.get("/tipuri-zile/");
      setTipuriZi(raspuns.data || []);
    } catch (eroare) {
      console.error("Eroare la preluarea tipurilor de zi:", eroare);
    } finally {
      setSeIncarca(false);
    }
  }, []);

  return { tipuriZi, seIncarca, preiaTipuriZi };
};

const TipZi = () => {
  const [termenCautare, setTermenCautare] = useState("");
  const [modalAdaugareDeschis, setModalAdaugareDeschis] = useState(false);
  const [modalEditareDeschis, setModalEditareDeschis] = useState(false);
  const [tipSelectat, setTipSelectat] = useState(null);
  const [afiseazaToast, setAfiseazaToast] = useState(false);
  const [mesajToast, setMesajToast] = useState("");

  const cautareCuIntarziere = useDebounce(termenCautare, DEBOUNCE_CAUTARE_MS);
  const { tipuriZi, seIncarca, preiaTipuriZi } = useTipZi();

  useEffect(() => {
    preiaTipuriZi();
  }, [preiaTipuriZi]);

  const gestioneazaEditareaTipului = useCallback((tip) => {
    setTipSelectat(tip);
    setModalEditareDeschis(true);
  }, []);

  const randuriFiltrate = useMemo(() => {
    let lista = [...tipuriZi];

    if (cautareCuIntarziere) {
      const termen = cautareCuIntarziere.toLowerCase();
      lista = lista.filter((tip) =>
        tip.prescurtare?.toLowerCase().includes(termen) ||
        tip.tip_zi?.toLowerCase().includes(termen)
      );
    }

    return lista.map((tip, index) => ({
      id: tip.id ?? index,
      ...tip,
    }));
  }, [tipuriZi, cautareCuIntarziere]);

  const coloane = useMemo(
    () => [
      {
        field: "prescurtare",
        headerName: "Prescurtare",
        flex: 0.8,
        minWidth: 140,
      },
      {
        field: "tip_zi",
        headerName: "Tip zi",
        flex: 1.4,
        minWidth: 200,
      },
      {
        field: "actiune",
        headerName: "Acțiuni",
        width: 100,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (parametri) => (
          <IconButton
            sx={{ color: "#1976d2" }}
            onClick={() => gestioneazaEditareaTipului(parametri.row)}
          >
            <Edit />
          </IconButton>
        ),
      },
    ],
    [gestioneazaEditareaTipului]
  );

  return (
    <div className="pagina-tipzi">
      {afiseazaToast && <div className="toast-global">{mesajToast}</div>}

      <div className="continut-tipzi">
        <Box className="bara-unelte-tipzi">
          <h2 className="titlu">
            TIP ZI
          </h2>

          <Box className="dreapta-bara-unelte-tipzi">
            <TextField
              size="small"
              placeholder="Caută tip zi..."
              value={termenCautare}
              onChange={(e) => setTermenCautare(e.target.value)}
              className="input-cautare"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search sx={{ color: "#424242" }} />
                  </InputAdornment>
                ),
              }}
            />

            <Button
              variant="contained"
              startIcon={<Add />}
              className="buton-nou"
              onClick={() => setModalAdaugareDeschis(true)}
            >
              ADAUGĂ
            </Button>
          </Box>
        </Box>

        <div className="container-tabel">
          <DataGrid
            rows={randuriFiltrate}
            columns={coloane}
            loading={seIncarca}
            disableRowSelectionOnClick
            pageSizeOptions={[10, 15, 20, 25, 50]}
            initialState={{
              pagination: {
                paginationModel: {
                  page: 0,
                  pageSize: DIMENSIUNE_PAGINA_IMPLICITA,
                },
              },
            }}
            rowHeight={50}
            autoHeight={false}
            sx={{
              borderRadius: "8px",
              height: "100%",
              "& .MuiDataGrid-cell": {
                alignItems: "center",
                display: "flex",
              },
              "& .MuiDataGrid-cell:focus": {
                outline: "none",
              },
              "& .MuiDataGrid-columnHeaderTitle": {
                fontWeight: "700",
                fontSize: "0.95rem",
              },
            }}
          />
        </div>
      </div>

      <AddTipZi
        open={modalAdaugareDeschis}
        onClose={(trebuieReincarcat, mesaj) => {
          setModalAdaugareDeschis(false);
          if (trebuieReincarcat) {
            preiaTipuriZi();
            if (mesaj) {
              setMesajToast(mesaj);
              setAfiseazaToast(true);
              setTimeout(() => setAfiseazaToast(false), 4000);
            }
          }
        }}
      />

      <EditTipZi
        open={modalEditareDeschis}
        tipData={tipSelectat}
        onClose={(trebuieReincarcat, mesaj) => {
          setModalEditareDeschis(false);
          setTipSelectat(null);
          if (trebuieReincarcat) {
            preiaTipuriZi();
            if (mesaj) {
              setMesajToast(mesaj);
              setAfiseazaToast(true);
              setTimeout(() => setAfiseazaToast(false), 4000);
            }
          }
        }}
      />
    </div>
  );
};

export default TipZi;