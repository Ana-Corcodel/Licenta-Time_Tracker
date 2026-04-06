import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddConcediu.css";

registerLocale("ro", ro);

const extrageListaAttach = (attach) => {
  if (!attach) return [];
  if (Array.isArray(attach)) return attach;
  if (Array.isArray(attach.results)) return attach.results;
  return [];
};

const EditConcediu = ({ open, concediuData, onClose }) => {
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
    attach: [],
  });

  const [attachExistente, seteazaAttachExistente] = useState([]);
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
      attach: [],
    };
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
        axiosInstance.get("/tipuri-zile/"),
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

      return {
        angajatiFormatati,
        tipuriFormatate,
      };
    } catch (eroare) {
      console.error("Eroare la încărcarea opțiunilor:", eroare);
      seteazaMesajEroare("Nu s-au putut încărca opțiunile necesare");

      return {
        angajatiFormatati: [],
        tipuriFormatate: [],
      };
    } finally {
      seteazaSeIncarcaOptiunile(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      incarcaOptiuni();
    }
  }, [open, incarcaOptiuni]);

  const initializeazaFormular = useCallback(async () => {
    if (!concediuData) return;

    seteazaMesajEroare("");
    seteazaMesajSucces("");
    seteazaEroriCampuri({});

    try {
      let angajatiCurenti = listaAngajati;
      let tipuriCurente = listaTipuriConcediu;

      if (listaAngajati.length === 0 || listaTipuriConcediu.length === 0) {
        const dateIncarcate = await incarcaOptiuni();
        angajatiCurenti = dateIncarcate.angajatiFormatati;
        tipuriCurente = dateIncarcate.tipuriFormatate;
      }

      const idAngajat =
        typeof concediuData.angajat === "object"
          ? concediuData.angajat?.id
          : concediuData.angajat;

      const idTipConcediu =
        typeof concediuData.tip_concediu === "object"
          ? concediuData.tip_concediu?.id
          : concediuData.tip_concediu;

      const angajatSelectat =
        angajatiCurenti.find((angajat) => angajat.value === idAngajat) || null;

      const tipConcediuSelectat =
        tipuriCurente.find((tip) => tip.value === idTipConcediu) || null;

      const dataStart = concediuData.data_start ? new Date(concediuData.data_start) : new Date();
      const dataSfarsit = concediuData.data_sfarsit ? new Date(concediuData.data_sfarsit) : new Date();

      seteazaDateFormular({
        angajat: angajatSelectat,
        data_start: dataStart,
        data_sfarsit: dataSfarsit,
        durata: Number(concediuData.durata) || calculeazaDurata(dataStart, dataSfarsit),
        an_concediu:
          Number(concediuData.an_concediu) || dataStart.getFullYear(),
        tip_concediu: tipConcediuSelectat,
        attach: [],
      });

      seteazaAttachExistente(extrageListaAttach(concediuData.attach));
    } catch (eroare) {
      console.error("Eroare la inițializarea formularului:", eroare);
      seteazaMesajEroare("Nu s-au putut încărca datele pentru editare");
    }
  }, [concediuData, listaAngajati, listaTipuriConcediu, incarcaOptiuni, calculeazaDurata]);

  useEffect(() => {
    if (open && concediuData) {
      initializeazaFormular();
    }
  }, [open, concediuData, initializeazaFormular]);

  useEffect(() => {
    const durataCalculata = calculeazaDurata(
      dateFormular.data_start,
      dateFormular.data_sfarsit
    );

    const anCalculat = dateFormular.data_start
      ? new Date(dateFormular.data_start).getFullYear()
      : new Date().getFullYear();

    seteazaDateFormular((anterior) => {
      if (
        anterior.durata === durataCalculata &&
        anterior.an_concediu === anCalculat
      ) {
        return anterior;
      }

      return {
        ...anterior,
        durata: durataCalculata,
        an_concediu: anCalculat,
      };
    });
  }, [dateFormular.data_start, dateFormular.data_sfarsit, calculeazaDurata]);

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

  const gestioneazaSchimbareDataStart = useCallback((dataSelectata) => {
    seteazaDateFormular((anterior) => {
      const dataSfarsitNoua =
        anterior.data_sfarsit && dataSelectata > anterior.data_sfarsit
          ? dataSelectata
          : anterior.data_sfarsit;

      return {
        ...anterior,
        data_start: dataSelectata,
        data_sfarsit: dataSfarsitNoua,
      };
    });

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      data_start: "",
      data_sfarsit: "",
    }));
  }, []);

  const gestioneazaSchimbareDataSfarsit = useCallback((dataSelectata) => {
    seteazaDateFormular((anterior) => ({
      ...anterior,
      data_sfarsit: dataSelectata,
    }));

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      data_sfarsit: "",
    }));
  }, []);

  const gestioneazaSchimbareAttach = useCallback((e) => {
    const fisiere = Array.from(e.target.files || []);

    seteazaDateFormular((anterior) => ({
      ...anterior,
      attach: fisiere,
    }));

    seteazaEroriCampuri((anterior) => ({
      ...anterior,
      attach: "",
    }));
  }, []);

  const valideazaFormular = useCallback(() => {
    const erori = {};

    if (!dateFormular.angajat) erori.angajat = "Angajatul este obligatoriu";
    if (!dateFormular.data_start) erori.data_start = "Data de început este obligatorie";
    if (!dateFormular.data_sfarsit) erori.data_sfarsit = "Data de sfârșit este obligatorie";
    if (!dateFormular.tip_concediu) erori.tip_concediu = "Tipul concediului este obligatoriu";

    if (
      dateFormular.data_start &&
      dateFormular.data_sfarsit &&
      new Date(dateFormular.data_sfarsit) < new Date(dateFormular.data_start)
    ) {
      erori.data_sfarsit = "Data de sfârșit nu poate fi mai mică decât data de început";
    }

    if (dateFormular.durata <= 0) {
      erori.data_sfarsit = "Durata concediului trebuie să fie de cel puțin 1 zi";
    }

    seteazaEroriCampuri(erori);
    return Object.keys(erori).length === 0;
  }, [dateFormular]);

  const gestioneazaAnulare = useCallback(() => {
    seteazaDateFormular(obtineDateInitialeFormular());
    seteazaAttachExistente([]);
    seteazaMesajEroare("");
    seteazaMesajSucces("");
    seteazaEroriCampuri({});
    onClose(false);
  }, [obtineDateInitialeFormular, onClose]);

  const gestioneazaActualizare = useCallback(async () => {
    seteazaMesajEroare("");
    seteazaMesajSucces("");
    seteazaEroriCampuri({});

    const esteValid = valideazaFormular();
    if (!esteValid) return;

    seteazaSeIncarca(true);

    try {
      const formData = new FormData();

      formData.append("angajat", dateFormular.angajat.value);
      formData.append("data_start", dateFormular.data_start.toISOString().split("T")[0]);
      formData.append("data_sfarsit", dateFormular.data_sfarsit.toISOString().split("T")[0]);
      formData.append("durata", String(dateFormular.durata));
      formData.append("an_concediu", String(dateFormular.an_concediu));
      formData.append("tip_concediu", dateFormular.tip_concediu.value);

      dateFormular.attach.forEach((fisier) => {
        formData.append("attach", fisier);
      });

      const raspuns = await axiosInstance.put(
        `/api/concedii/${concediuData.id}/`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (raspuns.status === 200) {
        seteazaAfiseazaToast(true);
        setTimeout(() => seteazaAfiseazaToast(false), 4000);
        onClose(true, "Concediu actualizat cu succes!");
      } else {
        seteazaMesajEroare("Răspuns neașteptat de la server");
      }
    } catch (eroare) {
      let mesaj = "Eroare la actualizarea concediului";

      if (eroare.response?.data?.detail) mesaj = eroare.response.data.detail;
      else if (eroare.response?.data?.message) mesaj = eroare.response.data.message;
      else if (eroare.response?.data) {
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
  }, [dateFormular, valideazaFormular, concediuData, onClose]);

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
      backgroundColor: stare.isSelected ? "#e6f2ff" : stare.isFocused ? "#f0f0f0" : "#fff",
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
      {afiseazaToast && <div className="toast-global">✅ Concediu actualizat cu succes!</div>}

      <div className="pagina-adauga-concediu">
        <div className="continut-pagina-adauga-concediu">
          <div className="overlay-modal">
            <div className="fereastra-modal">
              <div className="antet-modal">
                <h2>Editează Concediu</h2>
                <button className="buton-inchidere" onClick={gestioneazaAnulare}>×</button>
              </div>

              <hr className="separator-antet" />

              {(seIncarca || seIncarcaOptiunile) && (
                <div className="overlay-incarcare">
                  <div className="loader"></div>
                  <span>{seIncarcaOptiunile ? "Se încarcă opțiunile..." : "Se actualizează concediul..."}</span>
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
                        className={`camp-multiselect ${eroriCampuri.angajat ? "select-cu-eroare" : ""}`}
                        classNamePrefix="select"
                        isSearchable={true}
                        isClearable={true}
                        styles={obtineStiluriPersonalizateSelect("angajat")}
                      />
                      {eroriCampuri.angajat && (
                        <span className="eroare-camp eroare-stanga">{eroriCampuri.angajat}</span>
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
                      className={`input-stanga ${eroriCampuri.data_start ? "chenar-eroare-camp" : ""}`}
                      wrapperClassName="wrapper-datepicker"
                    />
                    {eroriCampuri.data_start && (
                      <span className="eroare-camp eroare-stanga">{eroriCampuri.data_start}</span>
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
                      className={`input-stanga ${eroriCampuri.data_sfarsit ? "chenar-eroare-camp" : ""}`}
                      wrapperClassName="wrapper-datepicker"
                    />
                    {eroriCampuri.data_sfarsit && (
                      <span className="eroare-camp eroare-stanga">{eroriCampuri.data_sfarsit}</span>
                    )}
                  </div>
                </div>

                <div className="rand-formular">
                  <div className="camp-formular">
                    <label className="eticheta-stanga">Durată (zile)</label>
                    <input
                      type="text"
                      value={dateFormular.durata}
                      readOnly
                      disabled
                      className="input-stanga camp-readonly"
                    />
                  </div>

                  <div className="camp-formular">
                    <label className="eticheta-stanga">An concediu</label>
                    <input
                      type="text"
                      value={dateFormular.an_concediu}
                      readOnly
                      disabled
                      className="input-stanga camp-readonly"
                    />
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
                        className={`camp-multiselect ${eroriCampuri.tip_concediu ? "select-cu-eroare" : ""}`}
                        classNamePrefix="select"
                        isSearchable={true}
                        isClearable={true}
                        styles={obtineStiluriPersonalizateSelect("tip_concediu")}
                      />
                      {eroriCampuri.tip_concediu && (
                        <span className="eroare-camp eroare-stanga">{eroriCampuri.tip_concediu}</span>
                      )}
                    </>
                  )}
                </div>

                <div className="camp-formular">
                  <label className="eticheta-stanga">Atașamente existente</label>
                  {attachExistente.length > 0 ? (
                    <div className="lista-fisiere">
                      {attachExistente.map((fisier, index) => (
                        <div key={fisier.id || index} className="fisier-atasat">
                          {fisier.filename || fisier.file || `Fișier ${index + 1}`}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value="Nu există atașamente"
                      readOnly
                      disabled
                      className="input-stanga camp-readonly"
                    />
                  )}
                </div>

                <div className="camp-formular">
                  <label className="eticheta-stanga">Adaugă atașamente noi</label>
                  <input
                    type="file"
                    multiple
                    onChange={gestioneazaSchimbareAttach}
                    className="input-stanga"
                  />
                  {dateFormular.attach.length > 0 && (
                    <div className="lista-fisiere">
                      {dateFormular.attach.map((fisier, index) => (
                        <div key={`${fisier.name}-${index}`} className="fisier-atasat">
                          {fisier.name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="butoane-formular">
                  <button className="buton-anulare" onClick={gestioneazaAnulare}>
                    Anulează
                  </button>

                  <button
                    className={`buton-salvare ${seIncarca ? "dezactivat" : ""}`}
                    onClick={!seIncarca ? gestioneazaActualizare : undefined}
                    disabled={seIncarca}
                  >
                    {seIncarca ? "Se actualizează..." : "Actualizează"}
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

export default EditConcediu;