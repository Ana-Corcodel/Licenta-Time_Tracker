import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import {
  Search,
  Edit,
  Add,
  Delete,
  Visibility,
} from "@mui/icons-material";
import axiosInstance from "../../Config/axiosInstance";
import AddConcediu from "./AddConcediu";
import EditConcediu from "./EditConcediu";
import VizualizareDocumenteConcediu from "./VizualizareDocumenteConcediu";
import "./Concedii.css";

const DIMENSIUNE_IMPLICITA_PAGINA = 10;
const INTERVAL_DEBOUNCE_CAUTARE = 300;

const useDebounce = (valoare, intarziere) => {
  const [valoareTemporizata, seteazaValoareTemporizata] = useState(valoare);

  useEffect(() => {
    const temporizator = setTimeout(
      () => seteazaValoareTemporizata(valoare),
      intarziere
    );
    return () => clearTimeout(temporizator);
  }, [valoare, intarziere]);

  return valoareTemporizata;
};

const formateazaData = (data) => {
  if (!data) return "-";

  const dataNoua = new Date(data);
  if (Number.isNaN(dataNoua.getTime())) return data;

  return dataNoua.toLocaleDateString("ro-RO");
};

const extrageNumeAngajat = (angajat) => {
  if (!angajat) return "-";

  if (typeof angajat === "object") {
    return (
      angajat.nume_complet ||
      `${angajat.nume || ""} ${angajat.prenume || ""}`.trim() ||
      angajat.email ||
      `Angajat #${angajat.id || ""}`
    );
  }

  return String(angajat);
};

const extrageTipConcediu = (tip) => {
  if (!tip) return "-";

  if (typeof tip === "object") {
    return (
      tip.denumire ||
      tip.label ||
      tip.name ||
      tip.tip ||
      `Tip #${tip.id || ""}`
    );
  }

  return String(tip);
};

const extrageListaAttach = (attach) => {
  if (!attach) return [];

  if (Array.isArray(attach)) return attach;
  if (Array.isArray(attach.results)) return attach.results;

  return [];
};

const Concedii = () => {
  const [concedii, setConcedii] = useState([]);
  const [seIncarca, setSeIncarca] = useState(true);
  const [termenCautare, seteazaTermenCautare] = useState("");
  const [esteDeschisModalAdaugare, setEsteDeschisModalAdaugare] = useState(false);
  const [esteDeschisModalEditare, setEsteDeschisModalEditare] = useState(false);
  const [esteDeschisModalDocumente, setEsteDeschisModalDocumente] = useState(false);
  const [concediuSelectat, setConcediuSelectat] = useState(null);
  const [concediuPentruDocumente, setConcediuPentruDocumente] = useState(null);
  const [afiseazaToast, setAfiseazaToast] = useState(false);
  const [mesajToast, setMesajToast] = useState("");
  const [idStergereInCurs, setIdStergereInCurs] = useState(null);

  const termenCautareTemporizat = useDebounce(
    termenCautare,
    INTERVAL_DEBOUNCE_CAUTARE
  );

  const afiseazaMesajToast = useCallback((mesaj) => {
    setMesajToast(mesaj);
    setAfiseazaToast(true);

    setTimeout(() => {
      setAfiseazaToast(false);
    }, 4000);
  }, []);

  const preiaConcedii = useCallback(async () => {
    try {
      setSeIncarca(true);

      const raspuns = await axiosInstance.get("/api/concedii/");
      const date = Array.isArray(raspuns.data)
        ? raspuns.data
        : raspuns.data?.results || [];

      const concediiMapate = date.map((concediu, index) => ({
        id: concediu.id ?? index,
        ...concediu,
        angajat_display:
          concediu.angajat_label || extrageNumeAngajat(concediu.angajat),
        data_start_display: formateazaData(concediu.data_start),
        data_sfarsit_display: formateazaData(concediu.data_sfarsit),
        tip_concediu_display:
          concediu.tip_concediu_label ||
          extrageTipConcediu(concediu.tip_concediu),
        attach_count: extrageListaAttach(concediu.attach_files).length,
      }));

      setConcedii(concediiMapate);
    } catch (eroare) {
      console.error("Eroare la încărcarea concediilor:", eroare);
      afiseazaMesajToast("Eroare la încărcarea concediilor");
    } finally {
      setSeIncarca(false);
    }
  }, [afiseazaMesajToast]);

  useEffect(() => {
    preiaConcedii();
  }, [preiaConcedii]);

  const gestioneazaEditareConcediu = useCallback((concediu) => {
    setConcediuSelectat(concediu);
    setEsteDeschisModalEditare(true);
  }, []);

  const gestioneazaPreviewDocumente = useCallback(
    (concediu) => {
      const fisiere = extrageListaAttach(concediu.attach_files);

      if (!fisiere.length) {
        afiseazaMesajToast("Nu există documente încărcate pentru acest concediu");
        return;
      }

      setConcediuPentruDocumente(concediu);
      setEsteDeschisModalDocumente(true);
    },
    [afiseazaMesajToast]
  );

  const gestioneazaStergereConcediu = useCallback(
    async (concediu) => {
      const confirmare = window.confirm(
        `Sigur vrei să ștergi concediul pentru ${extrageNumeAngajat(concediu.angajat)}?`
      );

      if (!confirmare) return;

      try {
        setIdStergereInCurs(concediu.id);

        await axiosInstance.delete(`/api/concedii/${concediu.id}/`);

        afiseazaMesajToast("Concediul a fost șters cu succes");
        preiaConcedii();
      } catch (eroare) {
        console.error("Eroare la ștergerea concediului:", eroare);
        afiseazaMesajToast(
          eroare?.response?.data?.detail ||
            eroare?.response?.data?.error ||
            "Nu s-a putut șterge concediul"
        );
      } finally {
        setIdStergereInCurs(null);
      }
    },
    [afiseazaMesajToast, preiaConcedii]
  );

  const randuriFiltrate = useMemo(() => {
    let lista = [...concedii];

    if (termenCautareTemporizat) {
      const termenMic = termenCautareTemporizat.toLowerCase();

      lista = lista.filter(
        (concediu) =>
          concediu.angajat_display?.toLowerCase().includes(termenMic) ||
          concediu.tip_concediu_display?.toLowerCase().includes(termenMic) ||
          String(concediu.an_concediu || "").toLowerCase().includes(termenMic) ||
          concediu.data_start_display?.toLowerCase().includes(termenMic) ||
          concediu.data_sfarsit_display?.toLowerCase().includes(termenMic)
      );
    }

    return lista.sort((a, b) => Number(b.id) - Number(a.id));
  }, [concedii, termenCautareTemporizat]);

  const coloane = useMemo(
    () => [
      {
        field: "angajat_display",
        headerName: "Angajat",
        flex: 1.4,
        minWidth: 180,
      },
      {
        field: "data_start_display",
        headerName: "Data început",
        flex: 1,
        minWidth: 130,
      },
      {
        field: "data_sfarsit_display",
        headerName: "Data sfârșit",
        flex: 1,
        minWidth: 130,
      },
      {
        field: "durata",
        headerName: "Durată (zile)",
        flex: 0.9,
        minWidth: 120,
        renderCell: (parametri) => parametri.value ?? "-",
      },
      {
        field: "an_concediu",
        headerName: "An",
        flex: 0.9,
        minWidth: 100,
        renderCell: (parametri) => parametri.value ?? "-",
      },
      {
        field: "tip_concediu_display",
        headerName: "Tip concediu",
        flex: 1.2,
        minWidth: 160,
        renderCell: (parametri) => (
          <Chip
            label={parametri.value || "-"}
            size="small"
            sx={{
              maxWidth: "100%",
              "& .MuiChip-label": {
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              },
            }}
          />
        ),
      },
      {
        field: "attach_count",
        headerName: "Ataș.",
        flex: 0.7,
        minWidth: 90,
        align: "center",
        headerAlign: "center",
        renderCell: (parametri) => parametri.value ?? 0,
      },
      {
        field: "action",
        headerName: "Acțiuni",
        width: 170,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (parametri) => {
          const areDocumente = (parametri.row.attach_count || 0) > 0;

          return (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Tooltip title="Vizualizează documente">
                <IconButton
                  sx={{
                    color: areDocumente ? "#2e7d32" : "#8e24aa",
                  }}
                  onClick={() => gestioneazaPreviewDocumente(parametri.row)}
                >
                  <Visibility />
                </IconButton>
              </Tooltip>

              <Tooltip title="Editează concediu">
                <IconButton
                  sx={{ color: "#1976d2" }}
                  onClick={() => gestioneazaEditareConcediu(parametri.row)}
                >
                  <Edit />
                </IconButton>
              </Tooltip>

              <Tooltip title="Șterge concediu">
                <span>
                  <IconButton
                    sx={{
                      color: "#d32f2f",
                      "&.Mui-disabled": {
                        color: "#d32f2f",
                        opacity: 0.6,
                      },
                    }}
                    onClick={() => gestioneazaStergereConcediu(parametri.row)}
                    disabled={idStergereInCurs === parametri.row.id}
                  >
                    <Delete />
                  </IconButton>
                </span>
              </Tooltip>
            </div>
          );
        },
      },
    ],
    [
      gestioneazaEditareConcediu,
      gestioneazaPreviewDocumente,
      gestioneazaStergereConcediu,
      idStergereInCurs,
    ]
  );

  return (
    <div className="pagina-concedii">
      {afiseazaToast && <div className="toast-global">{mesajToast}</div>}

      <div className="continut-pagina-concedii">
        <Box className="bara-unelte-concedii">
          <h2 className="titlu-pagina">CONCEDII</h2>

          <Box className="bara-unelte-dreapta">
            <TextField
              size="small"
              placeholder="Caută concediu..."
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
              onClick={() => setEsteDeschisModalAdaugare(true)}
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
                paginationModel: {
                  page: 0,
                  pageSize: DIMENSIUNE_IMPLICITA_PAGINA,
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

      <AddConcediu
        open={esteDeschisModalAdaugare}
        onClose={(trebuieReincarcat, mesaj) => {
          setEsteDeschisModalAdaugare(false);
          if (trebuieReincarcat) {
            preiaConcedii();
            if (mesaj) {
              setMesajToast(mesaj);
              setAfiseazaToast(true);
              setTimeout(() => setAfiseazaToast(false), 4000);
            }
          }
        }}
      />

      <EditConcediu
        open={esteDeschisModalEditare}
        concediuData={concediuSelectat}
        onClose={(trebuieReincarcat, mesaj) => {
          setEsteDeschisModalEditare(false);
          setConcediuSelectat(null);
          if (trebuieReincarcat) {
            preiaConcedii();
            if (mesaj) {
              setMesajToast(mesaj);
              setAfiseazaToast(true);
              setTimeout(() => setAfiseazaToast(false), 4000);
            }
          }
        }}
      />

      <VizualizareDocumenteConcediu
        open={esteDeschisModalDocumente}
        concediuData={concediuPentruDocumente}
        onClose={() => {
          setEsteDeschisModalDocumente(false);
          setConcediuPentruDocumente(null);
        }}
      />
    </div>
  );
};

export default Concedii;