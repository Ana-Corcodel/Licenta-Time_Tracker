import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { Search, Add, Edit, Delete } from "@mui/icons-material";
import axiosInstance from "../../Config/axiosInstance";
import AddPontaj from "./AddPontaj";
import EditPontaj from "./EditPontaj";
import "./Pontaj.css";

const INTERVAL_DEBOUNCE_CAUTARE = 300;
const DIMENSIUNE_IMPLICITA_PAGINA = 10;

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

const obtineStilTipZi = (tipZi, esteConcediu) => {
  const tip = String(tipZi || "").toLowerCase();

  if (esteConcediu) {
    return {
      background: "linear-gradient(135deg, #22c55e, #16a34a)",
      color: "#ffffff",
      label: "Concediu",
    };
  }

  if (
    tip.includes("nelucr") ||
    tip.includes("liber") ||
    tip.includes("weekend") ||
    tip.includes("sarbatoare") ||
    tip.includes("sărbătoare")
  ) {
    return {
      background: "linear-gradient(135deg, #64748b, #475569)",
      color: "#ffffff",
      label: "Zi nelucrătoare",
    };
  }

  return {
    background: "linear-gradient(135deg, #3b82f6, #2563eb)",
    color: "#ffffff",
    label: "Zi lucrătoare",
  };
};

const usePontaje = () => {
  const [listaPontaje, seteazaListaPontaje] = useState([]);
  const [seIncarca, seteazaSeIncarca] = useState(true);

  const preiaPontaje = useCallback(async () => {
    try {
      seteazaSeIncarca(true);

      const [raspunsPontaje, raspunsAngajati, raspunsTipuriZi] =
        await Promise.all([
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
        mapaTipuriZi[tipZi.id] = {
          label: tipZi.prescurtare || tipZi.tip_zi || "-",
          tip_zi_complet: tipZi.tip_zi || "",
          este_concediu: Boolean(tipZi.este_concediu),
        };
      });

      const pontajeMapate = datePontaje.map((pontaj, index) => {
        const tipZiGasit = mapaTipuriZi[pontaj.tip];

        return {
          id: pontaj.id ?? index,
          ...pontaj,
          angajat_nume: mapaAngajati[pontaj.angajat] || "-",
          tip_zi: tipZiGasit?.label || "-",
          tip_zi_complet: tipZiGasit?.tip_zi_complet || "",
          este_concediu: tipZiGasit?.este_concediu || false,
          data_display: pontaj.data
            ? new Date(pontaj.data).toLocaleDateString("ro-RO")
            : "-",
          an_display: pontaj.an ? new Date(pontaj.an).getFullYear() : "-",
          ora_start_display: normalizeazaOra(pontaj.ora_start),
          ora_sfarsit_display: normalizeazaOra(pontaj.ora_sfarsit),
          ore_lucrate_display: formateazaOreInHHMM(pontaj.ore_lucrate),
          ore_suplimentare_display: formateazaOreInHHMM(
            pontaj.ore_lucru_suplimentare
          ),
        };
      });

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
  const [esteDeschisModalAdaugare, seteazaEsteDeschisModalAdaugare] =
    useState(false);
  const [esteDeschisModalEditare, seteazaEsteDeschisModalEditare] =
    useState(false);
  const [pontajSelectat, seteazaPontajSelectat] = useState(null);
  const [afiseazaToast, seteazaAfiseazaToast] = useState(false);
  const [mesajToast, seteazaMesajToast] = useState("");
  const [idStergereInCurs, seteazaIdStergereInCurs] = useState(null);
  const [esteDeschisPopupStergere, seteazaEsteDeschisPopupStergere] =
    useState(false);
  const [pontajPentruStergere, seteazaPontajPentruStergere] = useState(null);

  const termenCautareTemporizat = useDebounce(
    termenCautare,
    INTERVAL_DEBOUNCE_CAUTARE
  );

  const { listaPontaje, seIncarca, preiaPontaje } = usePontaje();

  const afiseazaMesajToast = useCallback((mesaj) => {
    seteazaMesajToast(mesaj);
    seteazaAfiseazaToast(true);
    setTimeout(() => seteazaAfiseazaToast(false), 4000);
  }, []);

  useEffect(() => {
    preiaPontaje();
  }, [preiaPontaje]);

  const gestioneazaEditarePontaj = useCallback((pontaj) => {
    seteazaPontajSelectat(pontaj);
    seteazaEsteDeschisModalEditare(true);
  }, []);

  const deschidePopupStergere = useCallback((pontaj) => {
    seteazaPontajPentruStergere(pontaj);
    seteazaEsteDeschisPopupStergere(true);
  }, []);

  const inchidePopupStergere = useCallback(() => {
    seteazaEsteDeschisPopupStergere(false);
    seteazaPontajPentruStergere(null);
  }, []);

  const gestioneazaStergerePontaj = useCallback(
    async (pontaj) => {
      try {
        seteazaIdStergereInCurs(pontaj.id);

        await axiosInstance.delete(`/pontaje/${pontaj.id}/`);

        afiseazaMesajToast("Pontajul a fost șters cu succes");
        preiaPontaje();
      } catch (eroare) {
        console.error("Eroare la ștergerea pontajului:", eroare);
        afiseazaMesajToast(
          eroare?.response?.data?.detail ||
            eroare?.response?.data?.error ||
            "Nu s-a putut șterge pontajul"
        );
      } finally {
        seteazaIdStergereInCurs(null);
      }
    },
    [afiseazaMesajToast, preiaPontaje]
  );

  const confirmaStergerePontaj = useCallback(() => {
    if (pontajPentruStergere) {
      gestioneazaStergerePontaj(pontajPentruStergere);
    }

    inchidePopupStergere();
  }, [pontajPentruStergere, gestioneazaStergerePontaj, inchidePopupStergere]);

  const randuriFiltrate = useMemo(() => {
    let lista = [...listaPontaje];

    if (termenCautareTemporizat) {
      const termenMic = termenCautareTemporizat.toLowerCase();

      lista = lista.filter(
        (pontaj) =>
          pontaj.angajat_nume?.toLowerCase().includes(termenMic) ||
          pontaj.luna?.toLowerCase().includes(termenMic) ||
          pontaj.tip_zi?.toLowerCase().includes(termenMic) ||
          pontaj.tip_zi_complet?.toLowerCase().includes(termenMic) ||
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
        flex: 1,
        minWidth: 140,
        renderCell: (parametri) => {
          const stil = obtineStilTipZi(
            parametri.row.tip_zi_complet || parametri.value,
            parametri.row.este_concediu
          );

          return (
            <Tooltip title={stil.label}>
              <Chip
                label={parametri.value || "-"}
                size="small"
                sx={{
                  maxWidth: "100%",
                  color: stil.color,
                  background: stil.background,
                  fontWeight: 700,
                  borderRadius: "8px",
                  boxShadow: "0 2px 6px rgba(0, 0, 0, 0.15)",
                  "& .MuiChip-label": {
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    padding: "0 10px",
                  },
                }}
              />
            </Tooltip>
          );
        },
      },
      {
        field: "action",
        headerName: "Acțiuni",
        width: 130,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (parametri) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip title="Editează pontaj">
              <IconButton
                sx={{ color: "#1976d2" }}
                onClick={() => gestioneazaEditarePontaj(parametri.row)}
              >
                <Edit />
              </IconButton>
            </Tooltip>

            <Tooltip title="Șterge pontaj">
              <span>
                <IconButton
                  sx={{
                    color: "#d32f2f",
                    "&.Mui-disabled": {
                      color: "#d32f2f",
                      opacity: 0.6,
                    },
                  }}
                  onClick={() => deschidePopupStergere(parametri.row)}
                  disabled={idStergereInCurs === parametri.row.id}
                >
                  <Delete />
                </IconButton>
              </span>
            </Tooltip>
          </div>
        ),
      },
    ],
    [gestioneazaEditarePontaj, deschidePopupStergere, idStergereInCurs]
  );

  return (
    <div className="pagina-pontaj">
      {afiseazaToast && <div className="toast-global">{mesajToast}</div>}

      <div className="continut-pagina-pontaj">
        <Box className="bara-unelte-pontaj">
          <h2 className="titlu-pagina">PONTAJ</h2>

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

      <AddPontaj
        open={esteDeschisModalAdaugare}
        onClose={(trebuieReincarcat, mesaj) => {
          seteazaEsteDeschisModalAdaugare(false);

          if (trebuieReincarcat) {
            preiaPontaje();

            if (mesaj) {
              afiseazaMesajToast(mesaj);
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
              afiseazaMesajToast(mesaj);
            }
          }
        }}
      />

      <Dialog
        open={esteDeschisPopupStergere}
        onClose={inchidePopupStergere}
        className="popup-confirmare-stergere-pontaj"
      >
        <DialogTitle className="titlu-popup-stergere-pontaj">
          Confirmare ștergere
        </DialogTitle>

        <DialogContent className="continut-popup-stergere-pontaj">
          <Typography className="text-popup-stergere-pontaj">
            Sigur vrei să ștergi pontajul pentru{" "}
            <strong>{pontajPentruStergere?.angajat_nume}</strong>?
          </Typography>

          <Typography className="subtext-popup-stergere-pontaj">
            Această acțiune va elimina definitiv pontajul din data de{" "}
            <strong>{pontajPentruStergere?.data_display}</strong>.
          </Typography>
        </DialogContent>

        <DialogActions className="actiuni-popup-stergere-pontaj">
          <Button
            className="buton-anuleaza-stergere-pontaj"
            onClick={inchidePopupStergere}
          >
            Anulează
          </Button>

          <Button
            className="buton-confirma-stergere-pontaj"
            onClick={confirmaStergerePontaj}
          >
            Șterge
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default Pontaj;