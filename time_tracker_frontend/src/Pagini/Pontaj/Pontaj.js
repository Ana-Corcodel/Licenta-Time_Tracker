import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box, Button, TextField, InputAdornment, IconButton, Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Add, Edit } from "@mui/icons-material";
import axiosInstance from "../../Config/axiosInstance";
import AddPontaj from "./AddPontaj";
import EditPontaj from "./EditPontaj";
import "./Pontaj.css";

const INTERVAL_DEBOUNCE_CAUTARE = 300;
const DIMENSIUNE_IMPLICITA_PAGINA = 10;

const useDebounce = (valoare, intarziere) => {
  const [valoareTemporizata, seteazaValoareTemporizata] = useState(valoare);

  useEffect(() => {
    const temporizator = setTimeout(() => seteazaValoareTemporizata(valoare), intarziere);
    return () => clearTimeout(temporizator);
  }, [valoare, intarziere]);

  return valoareTemporizata;
};

const normalizeazaOra = (valoareOra) => {
  if (!valoareOra) return "-";
  return String(valoareOra).slice(0, 5);
};

const formateazaOreInHHMM = (valoare) => {
  const valoareNumerica = Number(valoare) || 0;
  const totalMinute = Math.round(valoareNumerica * 60);
  const ore = Math.floor(totalMinute / 60);
  const minute = totalMinute % 60;

  return `${ore}:${String(minute).padStart(2, "0")}`;
};

const usePontaje = () => {
  const [listaPontaje, seteazaListaPontaje] = useState([]);
  const [seIncarca, seteazaSeIncarca] = useState(true);

  const preiaPontaje = useCallback(async () => {
    try {
      seteazaSeIncarca(true);

      const [raspunsPontaje, raspunsAngajati, raspunsTipuriZi] = await Promise.all([
        axiosInstance.get("/pontaje/"),
        axiosInstance.get("/angajati/"),
        axiosInstance.get("/tipuri-zile/"),
      ]);

      const datePontaje = Array.isArray(raspunsPontaje.data)
        ? raspunsPontaje.data
        : raspunsPontaje.data?.results || [];

      const dateAngajati = Array.isArray(raspunsAngajati.data)
        ? raspunsAngajati.data
        : raspunsAngajati.data?.results || [];

      const dateTipuriZi = Array.isArray(raspunsTipuriZi.data)
        ? raspunsTipuriZi.data
        : raspunsTipuriZi.data?.results || [];

      const mapaAngajati = {};
      dateAngajati.forEach((angajat) => {
        mapaAngajati[angajat.id] = `${angajat.nume} ${angajat.prenume}`;
      });

      const mapaTipuriZi = {};
      dateTipuriZi.forEach((tipZi) => {
        mapaTipuriZi[tipZi.id] = tipZi.prescurtare || tipZi.tip_zi;
      });

      const pontajeMapate = datePontaje.map((pontaj, index) => ({
        id: pontaj.id ?? index,
        ...pontaj,
        angajat_nume: mapaAngajati[pontaj.angajat] || "-",
        tip_zi: mapaTipuriZi[pontaj.tip] || "-",
        data_display: pontaj.data ? new Date(pontaj.data).toLocaleDateString("ro-RO") : "-",
        an_display: pontaj.an ? new Date(pontaj.an).getFullYear() : "-",
        ora_start_display: normalizeazaOra(pontaj.ora_start),
        ora_sfarsit_display: normalizeazaOra(pontaj.ora_sfarsit),
        ore_lucrate_display: formateazaOreInHHMM(pontaj.ore_lucrate),
        ore_suplimentare_display: formateazaOreInHHMM(pontaj.ore_lucru_suplimentare),
      }));

      seteazaListaPontaje(pontajeMapate);
    } catch (eroare) {
      console.error("Eroare la preluarea pontajelor:", eroare);
    } finally {
      seteazaSeIncarca(false);
    }
  }, []);

  return { listaPontaje, seIncarca, preiaPontaje };
};

const Pontaj = () => {
  const [termenCautare, seteazaTermenCautare] = useState("");
  const [esteDeschisModalAdaugare, seteazaEsteDeschisModalAdaugare] = useState(false);
  const [esteDeschisModalEditare, seteazaEsteDeschisModalEditare] = useState(false);
  const [pontajSelectat, seteazaPontajSelectat] = useState(null);
  const [afiseazaToast, seteazaAfiseazaToast] = useState(false);
  const [mesajToast, seteazaMesajToast] = useState("");

  const termenCautareTemporizat = useDebounce(termenCautare, INTERVAL_DEBOUNCE_CAUTARE);
  const { listaPontaje, seIncarca, preiaPontaje } = usePontaje();

  useEffect(() => {
    preiaPontaje();
  }, [preiaPontaje]);

  const gestioneazaEditarePontaj = useCallback((pontaj) => {
    seteazaPontajSelectat(pontaj);
    seteazaEsteDeschisModalEditare(true);
  }, []);

  const randuriFiltrate = useMemo(() => {
    let lista = [...listaPontaje];

    if (termenCautareTemporizat) {
      const termenMic = termenCautareTemporizat.toLowerCase();
      lista = lista.filter((pontaj) =>
        pontaj.angajat_nume?.toLowerCase().includes(termenMic) ||
        pontaj.luna?.toLowerCase().includes(termenMic) ||
        pontaj.tip_zi?.toLowerCase().includes(termenMic) ||
        pontaj.data_display?.toLowerCase().includes(termenMic) ||
        pontaj.ore_lucrate_display?.toLowerCase().includes(termenMic) ||
        pontaj.ore_suplimentare_display?.toLowerCase().includes(termenMic)
      );
    }

    return lista.sort((a, b) => Number(b.id) - Number(a.id));
  }, [listaPontaje, termenCautareTemporizat]);

  const coloane = useMemo(
    () => [
      {
        field: "angajat_nume",
        headerName: "Angajat",
        flex: 1.4,
        minWidth: 180,
      },
      {
        field: "data_display",
        headerName: "Data",
        flex: 1,
        minWidth: 130,
      },
      {
        field: "luna",
        headerName: "Luna",
        flex: 0.9,
        minWidth: 120,
      },
      {
        field: "an_display",
        headerName: "An",
        flex: 0.9,
        minWidth: 120,
      },
      {
        field: "ora_start_display",
        headerName: "Ora start",
        flex: 0.8,
        minWidth: 110,
      },
      {
        field: "ora_sfarsit_display",
        headerName: "Ora sfârșit",
        flex: 0.8,
        minWidth: 120,
      },
      {
        field: "pauza_masa",
        headerName: "Pauză (min)",
        flex: 0.9,
        minWidth: 120,
        renderCell: (parametri) => parametri.value ?? 0,
      },
      {
        field: "ore_lucrate_display",
        headerName: "Ore lucrate",
        flex: 0.9,
        minWidth: 120,
      },
      {
        field: "ore_suplimentare_display",
        headerName: "Ore supl.",
        flex: 0.9,
        minWidth: 110,
      },
      {
        field: "tip_zi",
        headerName: "Tip zi",
        flex: 0.9,
        minWidth: 110,
      },
      {
        field: "action",
        headerName: "Acțiuni",
        width: 100,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (parametri) => (
          <Tooltip title="Editează pontaj">
            <span>
              <IconButton
                sx={{ color: "#1976d2" }}
                onClick={() => gestioneazaEditarePontaj(parametri.row)}
              >
                <Edit />
              </IconButton>
            </span>
          </Tooltip>
        ),
      },
    ],
    [gestioneazaEditarePontaj]
  );

  return (
    <div className="pagina-pontaj">
      {afiseazaToast && <div className="toast-global">{mesajToast}</div>}

      <div className="continut-pagina-pontaj">
        <Box className="bara-unelte-pontaj">
          <h2 className="titlu-pagina">
            PONTAJ
          </h2>

          <Box className="bara-unelte-dreapta">
            <TextField
              size="small"
              placeholder="Caută pontaj..."
              value={termenCautare}
              onChange={(e) => seteazaTermenCautare(e.target.value)}
              className="input-cautare"
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
              className="buton-adaugare"
              onClick={() => seteazaEsteDeschisModalAdaugare(true)}
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
            pageSizeOptions={[10, 15, 20, 50]}
            initialState={{
              pagination: {
                paginationModel: { page: 0, pageSize: DIMENSIUNE_IMPLICITA_PAGINA },
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
                fontSize: "0.95rem"
              }
            }}
          />
        </div>
      </div>

      <AddPontaj
        open={esteDeschisModalAdaugare}
        onClose={(trebuieReincarcat, mesaj) => {
          seteazaEsteDeschisModalAdaugare(false);
          if (trebuieReincarcat) {
            preiaPontaje();
            if (mesaj) {
              seteazaMesajToast(mesaj);
              seteazaAfiseazaToast(true);
              setTimeout(() => seteazaAfiseazaToast(false), 4000);
            }
          }
        }}
      />

      <EditPontaj
        open={esteDeschisModalEditare}
        pontajData={pontajSelectat}
        onClose={(trebuieReincarcat, mesaj) => {
          seteazaEsteDeschisModalEditare(false);
          seteazaPontajSelectat(null);
          if (trebuieReincarcat) {
            preiaPontaje();
            if (mesaj) {
              seteazaMesajToast(mesaj);
              seteazaAfiseazaToast(true);
              setTimeout(() => seteazaAfiseazaToast(false), 4000);
            }
          }
        }}
      />
    </div>
  );
};

export default Pontaj;