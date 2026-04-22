import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import { useDropzone } from "react-dropzone";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import "./AddConcediu.css";

registerLocale("ro", ro);

const AddConcediu = ({ open, onClose }) => {
  const [listaAngajati, seteazaListaAngajati] = useState([]);
  const [listaTipuriConcediu, seteazaListaTipuriConcediu] = useState([]);
  const [seIncarcaOptiunile, seteazaSeIncarcaOptiunile] = useState(false);

  const [dateFormular, seteazaDateFormular] = useState({
    angajat: null,
    data_start: new Date(),
    data_sfarsit: new Date(),
    durata: 1,
    an_concediu: new Date().getFullYear(),
    tip_concediu: null,
  });

  const [files, setFiles] = useState([]);
  const [dropzoneKey, setDropzoneKey] = useState(Date.now());
  const [errorNotification, setErrorNotification] = useState("");

  const [seIncarca, seteazaSeIncarca] = useState(false);
  const [mesajEroare, seteazaMesajEroare] = useState("");
  const [mesajSucces, seteazaMesajSucces] = useState("");
  const [afiseazaToast, seteazaAfiseazaToast] = useState(false);
  const [eroriCampuri, seteazaEroriCampuri] = useState({});

  const obtineDateInitialeFormular = useCallback(() => {
    const azi = new Date();

    return {
      angajat: null,
      data_start: azi,
      data_sfarsit: azi,
      durata: 1,
      an_concediu: azi.getFullYear(),
      tip_concediu: null,
    };
  }, []);

  const seteazaFilesReset = useCallback(() => {
    setFiles([]);
    setDropzoneKey(Date.now());
  }, []);

  const showError = useCallback((message, timeout = 5000) => {
    setErrorNotification(message);
    setTimeout(() => setErrorNotification(""), timeout);
  }, []);

  const calculeazaDurata = useCallback((dataStart, dataSfarsit) => {
    if (!dataStart || !dataSfarsit) return 0;

    const start = new Date(dataStart);
    const sfarsit = new Date(dataSfarsit);

    start.setHours(0, 0, 0, 0);
    sfarsit.setHours(0, 0, 0, 0);

    const diferenta = sfarsit.getTime() - start.getTime();
    const zile = Math.floor(diferenta / (1000 * 60 * 60 * 24)) + 1;

    return zile > 0 ? zile : 0;
  }, []);

  const incarcaOptiuni = useCallback(async () => {
    seteazaSeIncarcaOptiunile(true);

    try {
      const [raspunsAngajati, raspunsTipuri] = await Promise.all([
        axiosInstance.get("/angajati/"),
        axiosInstance.get("/tipuri-zile/?doar_concedii=true")
      ]);

      const dateAngajati = Array.isArray(raspunsAngajati.data)
        ? raspunsAngajati.data
        : raspunsAngajati.data?.results || [];

      const dateTipuri = Array.isArray(raspunsTipuri.data)
        ? raspunsTipuri.data
        : raspunsTipuri.data?.results || [];

      const angajatiFormatati = dateAngajati.map((angajat) => ({
        value: angajat.id,
        label: `${angajat.nume} ${angajat.prenume}`,
        ...angajat,
      }));

      const tipuriFormatate = dateTipuri.map((tip) => ({
        value: tip.id,
        label: tip.tip_zi || tip.denumire || tip.name,
        ...tip,
      }));

      seteazaListaAngajati(angajatiFormatati);
      seteazaListaTipuriConcediu(tipuriFormatate);
    } catch (eroare) {
      console.error("Eroare la încărcarea opțiunilor:", eroare);
      seteazaMesajEroare("Nu s-au putut încărca opțiunile necesare");
    } finally {
      seteazaSeIncarcaOptiunile(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      incarcaOptiuni();
    }
  }, [open, incarcaOptiuni]);

  useEffect(() => {
    if (open) {
      seteazaDateFormular(obtineDateInitialeFormular());
      seteazaFilesReset();
      seteazaMesajEroare("");
      seteazaMesajSucces("");
      seteazaEroriCampuri({});
      setErrorNotification("");
    }
  }, [open, obtineDateInitialeFormular, seteazaFilesReset]);

  const gestioneazaSchimbareAngajat = useCallback((optiuneSelectata) => {
    seteazaDateFormular((anterior) => ({
      ...anterior,
      angajat: optiuneSelectata,
    }));

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      angajat: "",
    }));
  }, []);

  const gestioneazaSchimbareTipConcediu = useCallback((optiuneSelectata) => {
    seteazaDateFormular((anterior) => ({
      ...anterior,
      tip_concediu: optiuneSelectata,
    }));

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      tip_concediu: "",
    }));
  }, []);

  const gestioneazaSchimbareDataStart = useCallback(
    (dataSelectata) => {
      seteazaDateFormular((anterior) => {
        const dataSfarsitNoua =
          anterior.data_sfarsit && dataSelectata > anterior.data_sfarsit
            ? dataSelectata
            : anterior.data_sfarsit;

        const durataCalculata = calculeazaDurata(dataSelectata, dataSfarsitNoua);

        return {
          ...anterior,
          data_start: dataSelectata,
          data_sfarsit: dataSfarsitNoua,
          durata: durataCalculata > 0 ? durataCalculata : anterior.durata,
          an_concediu: dataSelectata
            ? new Date(dataSelectata).getFullYear()
            : anterior.an_concediu,
        };
      });

      seteazaEroriCampuri((anterior) => ({
        ...anterior,
        data_start: "",
        data_sfarsit: "",
      }));
    },
    [calculeazaDurata]
  );

  const gestioneazaSchimbareDataSfarsit = useCallback(
    (dataSelectata) => {
      seteazaDateFormular((anterior) => {
        const durataCalculata = calculeazaDurata(
          anterior.data_start,
          dataSelectata
        );

        return {
          ...anterior,
          data_sfarsit: dataSelectata,
          durata: durataCalculata > 0 ? durataCalculata : anterior.durata,
        };
      });

      seteazaEroriCampuri((anterior) => ({
        ...anterior,
        data_sfarsit: "",
      }));
    },
    [calculeazaDurata]
  );

  const gestioneazaSchimbareDurata = useCallback((e) => {
    let valoare = e.target.value;

    if (valoare === "") {
      seteazaDateFormular((anterior) => ({
        ...anterior,
        durata: "",
      }));
    } else {
      const numar = parseInt(valoare, 10);
      seteazaDateFormular((anterior) => ({
        ...anterior,
        durata: Number.isNaN(numar) ? "" : numar,
      }));
    }

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      durata: "",
    }));
  }, []);

  const gestioneazaSchimbareAnConcediu = useCallback((e) => {
    let valoare = e.target.value;

    if (valoare === "") {
      seteazaDateFormular((anterior) => ({
        ...anterior,
        an_concediu: "",
      }));
    } else {
      const numar = parseInt(valoare, 10);
      seteazaDateFormular((anterior) => ({
        ...anterior,
        an_concediu: Number.isNaN(numar) ? "" : numar,
      }));
    }

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      an_concediu: "",
    }));
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "image/jpeg": [],
      "image/png": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "text/plain": [],
    },
    multiple: true,
    maxSize: 1024 * 1024 * 100,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const tooLarge = rejectedFiles.filter(
          (f) => f.errors[0]?.code === "file-too-large"
        );
        if (tooLarge.length > 0) {
          showError(`Fișierul ${tooLarge[0].file.name} depășește 100MB`, 3000);
        }
      }

      if (acceptedFiles.length > 0) {
        setFiles((prevFiles) => [...prevFiles, ...acceptedFiles]);
        seteazaEroriCampuri((anterior) => ({
          ...anterior,
          attach: "",
        }));
      }
    },
  });

  const handleRemoveFile = (indexToRemove) => {
    setFiles((prevFiles) => {
      const updatedFiles = prevFiles.filter(
        (_, index) => index !== indexToRemove
      );
      if (updatedFiles.length === 0) {
        setDropzoneKey(Date.now());
      }
      return updatedFiles;
    });
  };

  const handleFileClick = (file) => {
    const url = URL.createObjectURL(file);

    if (file.type === "application/pdf") {
      const newWindow = window.open();
      if (!newWindow) {
        showError("Browserul a blocat fereastra de preview pentru PDF.");
        return;
      }

      newWindow.document.write(`
        <html>
          <head>
            <title>${file.name}</title>
            <style>
              body { margin: 0; height: 100vh; }
              embed { width: 100%; height: 100%; }
            </style>
          </head>
          <body>
            <embed src="${url}" type="application/pdf" />
          </body>
        </html>
      `);
      newWindow.document.close();
    } else {
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 100);
    }
  };

  const getFileIcon = (file) => {
    const fileType = file.type;

    if (fileType === "application/pdf") {
      return <PictureAsPdfIcon style={{ fontSize: 24, color: "#d32f2f" }} />;
    } else if (
      fileType === "application/msword" ||
      fileType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return <DescriptionIcon style={{ fontSize: 24, color: "#1976d2" }} />;
    } else if (
      fileType === "application/vnd.ms-excel" ||
      fileType ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      return <DescriptionIcon style={{ fontSize: 24, color: "#2e7d32" }} />;
    } else if (fileType.startsWith("image/")) {
      return <InsertDriveFileIcon style={{ fontSize: 24, color: "#9c27b0" }} />;
    } else {
      return <InsertDriveFileIcon style={{ fontSize: 24, color: "#757575" }} />;
    }
  };

  const validateFiles = () => {
    if (files.length === 0) return true;

    const MAX_FILE_SIZE = 100 * 1024 * 1024;
    const oversizedFiles = files.filter((file) => file.size > MAX_FILE_SIZE);

    if (oversizedFiles.length > 0) {
      showError(
        `Următoarele fișiere depășesc limita de 100MB:\n${oversizedFiles
          .map((f) => f.name)
          .join("\n")}`,
        5000
      );
      return false;
    }

    return true;
  };

  const valideazaFormular = useCallback(() => {
    const erori = {};

    if (!dateFormular.angajat) erori.angajat = "Angajatul este obligatoriu";
    if (!dateFormular.data_start)
      erori.data_start = "Data de început este obligatorie";
    if (!dateFormular.data_sfarsit)
      erori.data_sfarsit = "Data de sfârșit este obligatorie";
    if (!dateFormular.tip_concediu)
      erori.tip_concediu = "Tipul concediului este obligatoriu";

    if (dateFormular.durata === "" || Number(dateFormular.durata) <= 0) {
      erori.durata = "Durata concediului trebuie să fie de cel puțin 1 zi";
    }

    if (
      dateFormular.an_concediu === "" ||
      Number.isNaN(Number(dateFormular.an_concediu)) ||
      String(dateFormular.an_concediu).length !== 4
    ) {
      erori.an_concediu = "Anul concediului trebuie să fie valid";
    }

    if (
      dateFormular.data_start &&
      dateFormular.data_sfarsit &&
      new Date(dateFormular.data_sfarsit) < new Date(dateFormular.data_start)
    ) {
      erori.data_sfarsit =
        "Data de sfârșit nu poate fi mai mică decât data de început";
    }

    seteazaEroriCampuri(erori);
    return Object.keys(erori).length === 0;
  }, [dateFormular]);

  const gestioneazaAnulare = useCallback(() => {
    seteazaDateFormular(obtineDateInitialeFormular());
    seteazaFilesReset();
    seteazaMesajEroare("");
    seteazaMesajSucces("");
    seteazaEroriCampuri({});
    setErrorNotification("");
    onClose(false);
  }, [obtineDateInitialeFormular, onClose, seteazaFilesReset]);

  const gestioneazaSalvare = useCallback(async () => {
    seteazaMesajEroare("");
    seteazaMesajSucces("");
    seteazaEroriCampuri({});

    if (!validateFiles()) return;

    const esteValid = valideazaFormular();
    if (!esteValid) return;

    seteazaSeIncarca(true);

    try {
      const formData = new FormData();

      formData.append("angajat", dateFormular.angajat.value);
      formData.append(
        "data_start",
        dateFormular.data_start.toISOString().split("T")[0]
      );
      formData.append(
        "data_sfarsit",
        dateFormular.data_sfarsit.toISOString().split("T")[0]
      );
      formData.append("durata", String(dateFormular.durata));
      formData.append("an_concediu", String(dateFormular.an_concediu));
      formData.append("tip_concediu", dateFormular.tip_concediu.value);

      files.forEach((fisier) => {
        formData.append("attach", fisier);
      });

      const raspuns = await axiosInstance.post("/api/concedii/", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (raspuns.status === 201 || raspuns.status === 200) {
        seteazaAfiseazaToast(true);
        setTimeout(() => seteazaAfiseazaToast(false), 4000);
        onClose(true, "Concediu adăugat cu succes!");
      } else {
        seteazaMesajEroare("Răspuns neașteptat de la server");
      }
    } catch (eroare) {
      let mesaj = "Eroare la crearea concediului";

      if (eroare.response?.data?.detail) {
        mesaj = eroare.response.data.detail;
      } else if (eroare.response?.data?.message) {
        mesaj = eroare.response.data.message;
      } else if (eroare.response?.data?.attach) {
        mesaj =
          "Eroare la încărcarea fișierelor. Verifică tipul și dimensiunea acestora.";
      } else if (eroare.response?.data) {
        const eroriValidare = eroare.response.data;
        if (typeof eroriValidare === "object") {
          const primaCheie = Object.keys(eroriValidare)[0];
          if (primaCheie && Array.isArray(eroriValidare[primaCheie])) {
            mesaj = eroriValidare[primaCheie][0];
          }
        }
      }

      seteazaMesajEroare(mesaj);
      console.error("Eroare la submit:", eroare);
    } finally {
      seteazaSeIncarca(false);
    }
  }, [dateFormular, files, valideazaFormular, onClose]);

  const obtineStiluriPersonalizateSelect = (numeCamp) => ({
    control: (baza, stare) => ({
      ...baza,
      border: eroriCampuri[numeCamp]
        ? "1px solid #d32f2f"
        : stare.isFocused
          ? "1px solid #007BFF"
          : "1px solid #ccc",
      "&:hover": {
        border: eroriCampuri[numeCamp]
          ? "1px solid #d32f2f"
          : stare.isFocused
            ? "1px solid #007BFF"
            : "1px solid #888",
      },
      fontSize: "14px",
      fontFamily: "Arial, sans-serif",
      minHeight: "38px",
      backgroundColor: "#fff",
      boxShadow: "none",
      borderRadius: "4px",
    }),
    valueContainer: (baza) => ({
      ...baza,
      padding: "0 8px",
      height: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
      textAlign: "left",
    }),
    input: (baza) => ({
      ...baza,
      color: "#1a1a1a",
      margin: "0",
      padding: "0",
      "& input": {
        boxShadow: "none !important",
        border: "none !important",
        outline: "none !important",
        padding: "0",
        margin: "0",
        textAlign: "left",
      },
    }),
    placeholder: (baza) => ({
      ...baza,
      color: "#999",
      fontSize: "14px",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
    }),
    singleValue: (baza) => ({
      ...baza,
      color: "#1a1a1a",
      fontSize: "14px",
      textAlign: "left",
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-start",
    }),
    menu: (baza) => ({
      ...baza,
      zIndex: 9999,
      fontSize: "14px",
      textAlign: "left",
    }),
    menuList: (baza) => ({
      ...baza,
      maxHeight: "200px",
      overflowY: "auto",
    }),
    option: (baza, stare) => ({
      ...baza,
      backgroundColor: stare.isSelected
        ? "#e6f2ff"
        : stare.isFocused
          ? "#f0f0f0"
          : "#fff",
      color: stare.isSelected ? "#006ce4" : "#1a1a1a",
      fontSize: "14px",
      textAlign: "left",
      "&:active": {
        backgroundColor: "#e6f2ff",
      },
    }),
  });

  if (!open) return null;

  return (
    <>
      {errorNotification && (
        <div className="error-notification">{errorNotification}</div>
      )}

      {afiseazaToast && (
        <div className="toast-global">✅ Concediu adăugat cu succes!</div>
      )}

      <div className="pagina-adauga-concediu">
        <div className="continut-pagina-adauga-concediu">
          <div className="overlay-modal">
            <div className="fereastra-modal">
              <div className="antet-modal">
                <h2>Adaugă Concediu</h2>
                <button className="buton-inchidere" onClick={gestioneazaAnulare}>
                  ×
                </button>
              </div>

              <hr className="separator-antet" />

              {(seIncarca || seIncarcaOptiunile) && (
                <div className="overlay-incarcare">
                  <div className="loader"></div>
                  <span>
                    {seIncarcaOptiunile
                      ? "Se încarcă opțiunile..."
                      : "Se salvează concediul..."}
                  </span>
                </div>
              )}

              {mesajEroare && <div className="alerta eroare">{mesajEroare}</div>}
              {mesajSucces && <div className="alerta succes">{mesajSucces}</div>}

              <div className="formular">
                <div className="camp-formular">
                  <label className="eticheta-stanga">
                    Angajat <span className="obligatoriu">*</span>
                  </label>
                  {seIncarcaOptiunile ? (
                    <div className="skeleton"></div>
                  ) : (
                    <>
                      <Select
                        name="angajat"
                        value={dateFormular.angajat}
                        onChange={gestioneazaSchimbareAngajat}
                        options={listaAngajati}
                        placeholder="Selectează angajat"
                        className={`camp-multiselect ${eroriCampuri.angajat ? "select-cu-eroare" : ""
                          }`}
                        classNamePrefix="select"
                        isSearchable={true}
                        isClearable={true}
                        styles={obtineStiluriPersonalizateSelect("angajat")}
                      />
                      {eroriCampuri.angajat && (
                        <span className="eroare-camp eroare-stanga">
                          {eroriCampuri.angajat}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="rand-formular">
                  <div className="camp-formular">
                    <label className="eticheta-stanga">
                      Data început <span className="obligatoriu">*</span>
                    </label>
                    <DatePicker
                      selected={dateFormular.data_start}
                      onChange={gestioneazaSchimbareDataStart}
                      dateFormat="dd/MM/yyyy"
                      locale="ro"
                      placeholderText="Selectează data de început"
                      className={`input-stanga ${eroriCampuri.data_start ? "chenar-eroare-camp" : ""
                        }`}
                      wrapperClassName="wrapper-datepicker"
                    />
                    {eroriCampuri.data_start && (
                      <span className="eroare-camp eroare-stanga">
                        {eroriCampuri.data_start}
                      </span>
                    )}
                  </div>

                  <div className="camp-formular">
                    <label className="eticheta-stanga">
                      Data sfârșit <span className="obligatoriu">*</span>
                    </label>
                    <DatePicker
                      selected={dateFormular.data_sfarsit}
                      onChange={gestioneazaSchimbareDataSfarsit}
                      dateFormat="dd/MM/yyyy"
                      locale="ro"
                      minDate={dateFormular.data_start}
                      placeholderText="Selectează data de sfârșit"
                      className={`input-stanga ${eroriCampuri.data_sfarsit ? "chenar-eroare-camp" : ""
                        }`}
                      wrapperClassName="wrapper-datepicker"
                    />
                    {eroriCampuri.data_sfarsit && (
                      <span className="eroare-camp eroare-stanga">
                        {eroriCampuri.data_sfarsit}
                      </span>
                    )}
                  </div>
                </div>

                <div className="rand-formular">
                  <div className="camp-formular">
                    <label className="eticheta-stanga">
                      Durată (zile) <span className="obligatoriu">*</span>
                    </label>
                    <input
                      type="number"
                      value={dateFormular.durata}
                      readOnly
                      className={`input-stanga camp-readonly ${eroriCampuri.durata ? "chenar-eroare-camp" : ""
                        }`}
                      min="1"
                    />
                    {eroriCampuri.durata && (
                      <span className="eroare-camp eroare-stanga">
                        {eroriCampuri.durata}
                      </span>
                    )}
                  </div>

                  <div className="camp-formular">
                    <label className="eticheta-stanga">
                      An concediu <span className="obligatoriu">*</span>
                    </label>
                    <input
                      type="number"
                      value={dateFormular.an_concediu}
                      onChange={gestioneazaSchimbareAnConcediu}
                      className={`input-stanga ${eroriCampuri.an_concediu ? "chenar-eroare-camp" : ""
                        }`}
                      min="2000"
                      max="2100"
                    />
                    {eroriCampuri.an_concediu && (
                      <span className="eroare-camp eroare-stanga">
                        {eroriCampuri.an_concediu}
                      </span>
                    )}
                  </div>
                </div>

                <div className="camp-formular">
                  <label className="eticheta-stanga">
                    Tip concediu <span className="obligatoriu">*</span>
                  </label>
                  {seIncarcaOptiunile ? (
                    <div className="skeleton"></div>
                  ) : (
                    <>
                      <Select
                        name="tip_concediu"
                        value={dateFormular.tip_concediu}
                        onChange={gestioneazaSchimbareTipConcediu}
                        options={listaTipuriConcediu}
                        placeholder="Selectează tipul concediului"
                        className={`camp-multiselect ${eroriCampuri.tip_concediu ? "select-cu-eroare" : ""
                          }`}
                        classNamePrefix="select"
                        isSearchable={true}
                        isClearable={true}
                        styles={obtineStiluriPersonalizateSelect("tip_concediu")}
                      />
                      {eroriCampuri.tip_concediu && (
                        <span className="eroare-camp eroare-stanga">
                          {eroriCampuri.tip_concediu}
                        </span>
                      )}
                    </>
                  )}
                </div>

                <div className="camp-formular">
                  <label className="eticheta-stanga">Atașamente</label>

                  <div key={dropzoneKey} className="dropzone-wrapper">
                    <div {...getRootProps({ className: "dropzone" })}>
                      <input {...getInputProps()} />
                      <div className="dropzone-content">
                        {isDragActive ? (
                          <p>Lasă fișierele aici...</p>
                        ) : (
                          <p>Trage fișierele aici sau apasă pentru selectare</p>
                        )}
                        <CloudUploadIcon
                          style={{ fontSize: 40, color: "#888" }}
                        />
                      </div>
                    </div>

                    {files.length > 0 && (
                      <div className="files-preview-container">
                        <h4>Fișiere selectate ({files.length})</h4>
                        <div className="files-list">
                          {files.map((file, index) => (
                            <div key={index} className="file-preview-item">
                              <div className="file-info">
                                {getFileIcon(file)}
                                <span
                                  className="file-name clickable"
                                  title={
                                    file.type === "application/pdf"
                                      ? "Click pentru preview PDF"
                                      : "Click pentru download fișier"
                                  }
                                  onClick={() => handleFileClick(file)}
                                >
                                  {file.name.length > 40
                                    ? `${file.name.substring(0, 40)}...`
                                    : file.name}
                                </span>
                                <span className="file-size">
                                  {(file.size / 1024).toFixed(1)} KB
                                </span>
                              </div>
                              <button
                                type="button"
                                className="remove-file-button"
                                onClick={() => handleRemoveFile(index)}
                                title="Șterge fișier"
                              >
                                <DeleteIcon fontSize="small" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <p className="file-hint">
                    * Tipuri acceptate: PDF, Word, Excel, Imagini, Text. Sunt
                    permise mai multe fișiere (maxim 100MB per fișier). Apasă pe
                    numele fișierului pentru preview PDF sau download pentru
                    celelalte.
                  </p>
                </div>

                <div className="butoane-formular">
                  <button className="buton-anulare" onClick={gestioneazaAnulare}>
                    Anulează
                  </button>

                  <button
                    className={`buton-salvare ${seIncarca ? "dezactivat" : ""}`}
                    onClick={!seIncarca ? gestioneazaSalvare : undefined}
                    disabled={seIncarca}
                  >
                    {seIncarca ? "Se salvează..." : "Salvează"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddConcediu;