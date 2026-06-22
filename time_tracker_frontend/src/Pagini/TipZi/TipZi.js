import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Box,
  Button,
  TextField,
  InputAdornment,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
} from "@mui/material";
import { Search, Add, Edit, Delete } from "@mui/icons-material";
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
    const temporizator = setTimeout(
      () => setValoareCuIntarziere(valoare),
      intarziere
    );

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

  const [idStergereInCurs, setIdStergereInCurs] = useState(null);
  const [popupStergereDeschis, setPopupStergereDeschis] = useState(false);
  const [tipPentruStergere, setTipPentruStergere] = useState(null);

  const [popupEroareStergereDeschis, setPopupEroareStergereDeschis] =
    useState(false);
  const [mesajEroareStergere, setMesajEroareStergere] = useState("");

  const cautareCuIntarziere = useDebounce(termenCautare, DEBOUNCE_CAUTARE_MS);
  const { tipuriZi, seIncarca, preiaTipuriZi } = useTipZi();

  const afiseazaMesajToast = useCallback((mesaj) => {
    setMesajToast(mesaj);
    setAfiseazaToast(true);
    setTimeout(() => setAfiseazaToast(false), 4000);
  }, []);

  useEffect(() => {
    preiaTipuriZi();
  }, [preiaTipuriZi]);

  const gestioneazaEditareaTipului = useCallback((tip) => {
    setTipSelectat(tip);
    setModalEditareDeschis(true);
  }, []);

  const deschidePopupStergere = useCallback((tip) => {
    setTipPentruStergere(tip);
    setPopupStergereDeschis(true);
  }, []);

  const inchidePopupStergere = useCallback(() => {
    setPopupStergereDeschis(false);
    setTipPentruStergere(null);
  }, []);

  const inchidePopupEroareStergere = useCallback(() => {
    setPopupEroareStergereDeschis(false);
    setMesajEroareStergere("");
  }, []);

  const gestioneazaStergereTipZi = useCallback(
    async (tip) => {
      try {
        setIdStergereInCurs(tip.id);

        await axiosInstance.delete(`/tipuri-zile/${tip.id}/`);

        afiseazaMesajToast("Tipul de zi a fost șters cu succes");
        preiaTipuriZi();
      } catch (eroare) {
        console.error("Eroare la ștergerea tipului de zi:", eroare);

        const mesajBackend =
          eroare?.response?.data?.message ||
          eroare?.response?.data?.detail ||
          eroare?.response?.data?.error;

        setMesajEroareStergere(
          mesajBackend ||
          "Acest tip de zi este folosit în alte înregistrări și nu poate fi șters."
        );

        setPopupEroareStergereDeschis(true);
      } finally {
        setIdStergereInCurs(null);
      }
    },
    [afiseazaMesajToast, preiaTipuriZi]
  );

  const confirmaStergereTipZi = useCallback(() => {
    if (tipPentruStergere) {
      gestioneazaStergereTipZi(tipPentruStergere);
    }

    inchidePopupStergere();
  }, [tipPentruStergere, gestioneazaStergereTipZi, inchidePopupStergere]);

  const randuriFiltrate = useMemo(() => {
    let lista = [...tipuriZi];

    if (cautareCuIntarziere) {
      const termen = cautareCuIntarziere.toLowerCase();

      lista = lista.filter(
        (tip) =>
          tip.prescurtare?.toLowerCase().includes(termen) ||
          tip.tip_zi?.toLowerCase().includes(termen)
      );
    }

    return lista
      .map((tip, index) => ({
        id: tip.id ?? index,
        ...tip,
      }))
      .sort((a, b) => Number(b.id) - Number(a.id));
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
        width: 130,
        sortable: false,
        disableColumnMenu: true,
        renderCell: (parametri) => (
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <Tooltip title="Editează tip zi">
              <IconButton
                sx={{ color: "#1976d2" }}
                onClick={() => gestioneazaEditareaTipului(parametri.row)}
              >
                <Edit />
              </IconButton>
            </Tooltip>

            <Tooltip title="Șterge tip zi">
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
    [gestioneazaEditareaTipului, deschidePopupStergere, idStergereInCurs]
  );

  return (
    <div className="pagina-tipzi">
      {afiseazaToast && <div className="toast-global">{mesajToast}</div>}

      <div className="continut-tipzi">
        <Box className="bara-unelte-tipzi">
          <h2 className="titlu">TIP ZI</h2>

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
            if (mesaj) afiseazaMesajToast(mesaj);
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
            if (mesaj) afiseazaMesajToast(mesaj);
          }
        }}
      />

      <Dialog
        open={popupStergereDeschis}
        onClose={inchidePopupStergere}
        className="popup-confirmare-stergere-tipzi"
        disablePortal
      >
        <DialogTitle className="titlu-popup-stergere-tipzi">
          Confirmare ștergere
        </DialogTitle>

        <DialogContent className="continut-popup-stergere-tipzi">
          <Typography className="text-popup-stergere-tipzi">
            Sigur vrei să ștergi tipul de zi{" "}
            <strong>{tipPentruStergere?.tip_zi}</strong>?
          </Typography>

          <Typography className="subtext-popup-stergere-tipzi">
            Această acțiune va elimina definitiv tipul de zi selectat.
          </Typography>
        </DialogContent>

        <DialogActions className="actiuni-popup-stergere-tipzi">
          <Button
            className="buton-anuleaza-stergere-tipzi"
            onClick={inchidePopupStergere}
          >
            Anulează
          </Button>

          <Button
            className="buton-confirma-stergere-tipzi"
            onClick={confirmaStergereTipZi}
          >
            Șterge
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={popupEroareStergereDeschis}
        onClose={inchidePopupEroareStergere}
        className="popup-eroare-stergere-tipzi"
        disablePortal
      >
        <DialogTitle className="titlu-popup-eroare-stergere-tipzi">
          Ștergere imposibilă
        </DialogTitle>

        <DialogContent className="continut-popup-eroare-stergere-tipzi">
          <Typography className="text-popup-eroare-stergere-tipzi">
            {mesajEroareStergere}
          </Typography>
        </DialogContent>

        <DialogActions className="actiuni-popup-eroare-stergere-tipzi">
          <Button
            className="buton-inchide-eroare-stergere-tipzi"
            onClick={inchidePopupEroareStergere}
          >
            Închide
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default TipZi;