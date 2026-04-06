import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddPontaj.css";

registerLocale("ro", ro);

const AddPontaj = ({ open, onClose }) => {
    const [listaAngajati, seteazaListaAngajati] = useState([]);
    const [listaTipuriZi, seteazaListaTipuriZi] = useState([]);
    const [seIncarcaOptiunile, seteazaSeIncarcaOptiunile] = useState(false);

    const [dateFormular, seteazaDateFormular] = useState({
        angajat: null,
        luna: "",
        an: new Date(),
        ora_start: "09:00",
        ora_sfarsit: "17:00",
        pauza_masa: 30,
        tip: null,
        data: new Date(),
        ore_lucrate: 8,
        ore_lucru_suplimentare: 0,
    });

    const [seIncarca, seteazaSeIncarca] = useState(false);
    const [mesajEroare, seteazaMesajEroare] = useState("");
    const [mesajSucces, seteazaMesajSucces] = useState("");
    const [afiseazaToast, seteazaAfiseazaToast] = useState(false);
    const [eroriCampuri, seteazaEroriCampuri] = useState({});

    const obtineDateInitialeFormular = useCallback(() => ({
        angajat: null,
        luna: "",
        an: new Date(),
        ora_start: "08:00",
        ora_sfarsit: "17:00",
        pauza_masa: 30,
        tip: null,
        data: new Date(),
        ore_lucrate: 8,
        ore_lucru_suplimentare: 0,
    }), []);

    const normalizeazaOra = (valoareOra) => {
        if (!valoareOra) return "";
        return String(valoareOra).slice(0, 5);
    };

    const transformaOraInMinute = (ora) => {
        if (!ora) return 0;
        const [ore, minute] = String(ora).split(":").map(Number);
        return ore * 60 + minute;
    };

    const formateazaOreInHHMM = (valoare) => {
        const valoareNumerica = Number(valoare) || 0;
        const totalMinute = Math.round(valoareNumerica * 60);
        const ore = Math.floor(totalMinute / 60);
        const minute = totalMinute % 60;

        return `${ore}:${String(minute).padStart(2, "0")}`;
    };

    useEffect(() => {
        if (open) {
            incarcaOptiuni();
        }
    }, [open]);

    useEffect(() => {
        if (open) {
            seteazaDateFormular(obtineDateInitialeFormular());
            seteazaMesajEroare("");
            seteazaMesajSucces("");
            seteazaEroriCampuri({});
        }
    }, [open, obtineDateInitialeFormular]);

    const incarcaOptiuni = async () => {
        seteazaSeIncarcaOptiunile(true);
        try {
            const [raspunsAngajati, raspunsTipuri] = await Promise.all([
                axiosInstance.get("/angajati/"),
                axiosInstance.get("/tipuri-zile/")
            ]);

            const dateAngajati = Array.isArray(raspunsAngajati.data)
                ? raspunsAngajati.data
                : raspunsAngajati.data?.results || [];

            const dateTipuri = Array.isArray(raspunsTipuri.data)
                ? raspunsTipuri.data
                : raspunsTipuri.data?.results || [];

            const angajatiFormatati = dateAngajati.map(angajat => ({
                value: angajat.id,
                label: `${angajat.nume} ${angajat.prenume}`,
                ...angajat
            }));
            seteazaListaAngajati(angajatiFormatati);

            const tipuriFormatate = dateTipuri.map(tipZi => ({
                value: tipZi.id,
                label: tipZi.tip_zi,
                prescurtare: tipZi.prescurtare,
                ...tipZi
            }));
            seteazaListaTipuriZi(tipuriFormatate);
        } catch (eroare) {
            console.error("Eroare la încărcarea opțiunilor:", eroare);
            seteazaMesajEroare("Nu s-au putut încărca opțiunile necesare");
        } finally {
            seteazaSeIncarcaOptiunile(false);
        }
    };

    const calculeazaOreLucrate = useCallback((oraInceput, oraSfarsit, pauza) => {
        if (!oraInceput || !oraSfarsit) return 0;

        const minuteInceput = transformaOraInMinute(oraInceput);
        const minuteSfarsit = transformaOraInMinute(oraSfarsit);

        let totalMinute = minuteSfarsit - minuteInceput;
        if (totalMinute < 0) totalMinute += 24 * 60;

        const minuteLucrate = Math.max(0, totalMinute - (Number(pauza) || 0));
        return Math.round((minuteLucrate / 60) * 100) / 100;
    }, []);

    const calculeazaOreSuplimentare = useCallback((oraSfarsitPontaj, oraSfarsitProgram) => {
        if (!oraSfarsitPontaj || !oraSfarsitProgram) return 0;

        const minuteSfarsitPontaj = transformaOraInMinute(oraSfarsitPontaj);
        const minuteSfarsitProgram = transformaOraInMinute(oraSfarsitProgram);

        let minuteSuplimentare = minuteSfarsitPontaj - minuteSfarsitProgram;
        if (minuteSuplimentare < 0) minuteSuplimentare = 0;

        return Math.round((minuteSuplimentare / 60) * 100) / 100;
    }, []);

    useEffect(() => {
        if (dateFormular.data) {
            const luni = [
                "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
            ];
            const lunaCurenta = luni[dateFormular.data.getMonth()];
            seteazaDateFormular((anterior) => {
                if (anterior.luna === lunaCurenta) return anterior;
                return { ...anterior, luna: lunaCurenta };
            });
        }
    }, [dateFormular.data]);

    useEffect(() => {
        const oreLucrate = calculeazaOreLucrate(
            dateFormular.ora_start,
            dateFormular.ora_sfarsit,
            dateFormular.pauza_masa
        );

        const oraFinalProgram = normalizeazaOra(dateFormular.angajat?.ora_sfarsit);

        const oreSuplimentare = calculeazaOreSuplimentare(
            dateFormular.ora_sfarsit,
            oraFinalProgram
        );

        seteazaDateFormular((anterior) => {
            if (
                anterior.ore_lucrate === oreLucrate &&
                anterior.ore_lucru_suplimentare === oreSuplimentare
            ) {
                return anterior;
            }

            return {
                ...anterior,
                ore_lucrate: oreLucrate,
                ore_lucru_suplimentare: oreSuplimentare,
            };
        });
    }, [
        dateFormular.ora_start,
        dateFormular.ora_sfarsit,
        dateFormular.pauza_masa,
        dateFormular.angajat,
        calculeazaOreLucrate,
        calculeazaOreSuplimentare
    ]);

    const gestioneazaSchimbareCamp = useCallback((camp) => (e) => {
        let valoare = e.target.value;

        if (camp === "pauza_masa") {
            valoare = parseInt(valoare, 10);
            if (Number.isNaN(valoare)) valoare = 0;
            if (valoare < 0) valoare = 0;
            if (valoare > 180) valoare = 180;
        }

        seteazaDateFormular((anterior) => ({ ...anterior, [camp]: valoare }));
        seteazaEroriCampuri((anterior) => ({ ...anterior, [camp]: "" }));
    }, []);

    const gestioneazaSchimbareOra = useCallback((camp) => (e) => {
        const valoare = e.target.value;
        seteazaDateFormular((anterior) => ({ ...anterior, [camp]: valoare }));
        seteazaEroriCampuri((anterior) => ({ ...anterior, [camp]: "" }));
    }, []);

    const gestioneazaSchimbareAngajat = useCallback((optiuneSelectata) => {
        seteazaDateFormular((anterior) => ({
            ...anterior,
            angajat: optiuneSelectata,
            pauza_masa: optiuneSelectata?.ora_pauza ?? 30,
            ora_start: normalizeazaOra(optiuneSelectata?.ora_incepere) || "09:00",
            ora_sfarsit: normalizeazaOra(optiuneSelectata?.ora_sfarsit) || "17:00",
        }));
        seteazaEroriCampuri((anterior) => ({
            ...anterior,
            angajat: "",
            pauza_masa: "",
            ora_start: "",
            ora_sfarsit: "",
        }));
    }, []);

    const gestioneazaSchimbareTip = useCallback((optiuneSelectata) => {
        seteazaDateFormular((anterior) => ({ ...anterior, tip: optiuneSelectata }));
        seteazaEroriCampuri((anterior) => ({ ...anterior, tip: "" }));
    }, []);

    const gestioneazaSchimbareData = useCallback((dataSelectata) => {
        seteazaDateFormular((anterior) => ({ ...anterior, data: dataSelectata, an: dataSelectata || new Date() }));
        seteazaEroriCampuri((anterior) => ({ ...anterior, data: "" }));
    }, []);

    const valideazaFormular = useCallback(() => {
        const erori = {};

        if (!dateFormular.angajat) erori.angajat = "Angajatul este obligatoriu";
        if (!dateFormular.data) erori.data = "Data este obligatorie";
        if (!dateFormular.ora_start) erori.ora_start = "Ora de început este obligatorie";
        if (!dateFormular.ora_sfarsit) erori.ora_sfarsit = "Ora de sfârșit este obligatorie";
        if (!dateFormular.tip) erori.tip = "Tipul de zi este obligatoriu";

        if (dateFormular.pauza_masa < 0) erori.pauza_masa = "Pauza nu poate fi negativă";

        if (dateFormular.ora_start && dateFormular.ora_sfarsit) {
            const minuteInceput = transformaOraInMinute(dateFormular.ora_start);
            const minuteSfarsit = transformaOraInMinute(dateFormular.ora_sfarsit);

            if (minuteSfarsit <= minuteInceput && minuteSfarsit + 24 * 60 - minuteInceput > 12 * 60) {
                erori.ora_sfarsit = "Intervalul pare prea lung pentru trecerea peste noapte";
            }
        }

        seteazaEroriCampuri(erori);
        return Object.keys(erori).length === 0;
    }, [dateFormular]);

    const gestioneazaAnulare = useCallback(() => {
        seteazaDateFormular(obtineDateInitialeFormular());
        seteazaMesajEroare("");
        seteazaMesajSucces("");
        seteazaEroriCampuri({});
        onClose(false);
    }, [obtineDateInitialeFormular, onClose]);

    const gestioneazaSalvare = useCallback(async () => {
        seteazaMesajEroare("");
        seteazaMesajSucces("");
        seteazaEroriCampuri({});

        const esteValid = valideazaFormular();
        if (!esteValid) return;

        seteazaSeIncarca(true);

        try {
            const dataFormatata = dateFormular.data.toISOString().split("T")[0];
            const anFormatat = `${dateFormular.an.getFullYear()}-01-01`;

            const payload = {
                angajat: dateFormular.angajat.value,
                luna: dateFormular.luna,
                an: anFormatat,
                ora_start: dateFormular.ora_start,
                ora_sfarsit: dateFormular.ora_sfarsit,
                pauza_masa: parseInt(dateFormular.pauza_masa, 10) || 0,
                tip: dateFormular.tip.value,
                data: dataFormatata,
                ore_lucrate: dateFormular.ore_lucrate,
                ore_lucru_suplimentare: dateFormular.ore_lucru_suplimentare,
            };

            const raspuns = await axiosInstance.post("/pontaje/", payload);

            if (raspuns.status === 201 || raspuns.status === 200) {
                seteazaAfiseazaToast(true);
                setTimeout(() => seteazaAfiseazaToast(false), 4000);
                onClose(true, "Pontaj adăugat cu succes!");
            } else {
                seteazaMesajEroare("Răspuns neașteptat de la server");
            }
        } catch (eroare) {
            let mesaj = "Eroare la crearea pontajului";
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
    }, [dateFormular, valideazaFormular, onClose]);

    const obtineStiluriPersonalizateSelect = (numeCamp) => ({
        control: (baza, stare) => ({
            ...baza,
            border: eroriCampuri[numeCamp] ? "1px solid #d32f2f" :
                stare.isFocused ? "1px solid #007BFF" : "1px solid #ccc",
            "&:hover": {
                border: eroriCampuri[numeCamp] ? "1px solid #d32f2f" :
                    stare.isFocused ? "1px solid #007BFF" : "1px solid #888"
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
            textAlign: "left"
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
                textAlign: "left"
            }
        }),
        placeholder: (baza) => ({
            ...baza,
            color: "#999",
            fontSize: "14px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
        }),
        singleValue: (baza) => ({
            ...baza,
            color: "#1a1a1a",
            fontSize: "14px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
        }),
        menu: (baza) => ({
            ...baza,
            zIndex: 9999,
            fontSize: "14px",
            textAlign: "left"
        }),
        option: (baza, stare) => ({
            ...baza,
            backgroundColor: stare.isSelected ? "#e6f2ff" : stare.isFocused ? "#f0f0f0" : "#fff",
            color: stare.isSelected ? "#006ce4" : "#1a1a1a",
            fontSize: "14px",
            textAlign: "left",
            "&:active": {
                backgroundColor: "#e6f2ff",
            }
        }),
    });

    if (!open) return null;

    return (
        <>
            {afiseazaToast && <div className="toast-global">✅ Pontaj adăugat cu succes!</div>}

            <div className="pagina-adauga-pontaj">
                <div className="continut-pagina-adauga-pontaj">
                    <div className="overlay-modal">
                        <div className="fereastra-modal">
                            <div className="antet-modal">
                                <h2>Adaugă Pontaj</h2>
                                <button className="buton-inchidere" onClick={gestioneazaAnulare}>×</button>
                            </div>

                            <hr className="separator-antet" />

                            {(seIncarca || seIncarcaOptiunile) && (
                                <div className="overlay-incarcare">
                                    <div className="loader"></div>
                                    <span>{seIncarcaOptiunile ? "Se încarcă opțiunile..." : "Se salvează pontajul..."}</span>
                                </div>
                            )}

                            {mesajEroare && <div className="alerta eroare">{mesajEroare}</div>}
                            {mesajSucces && <div className="alerta succes">{mesajSucces}</div>}

                            <div className="formular">
                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Angajat <span className="obligatoriu">*</span></label>
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
                                            {eroriCampuri.angajat && <span className="eroare-camp eroare-stanga">{eroriCampuri.angajat}</span>}
                                        </>
                                    )}
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Data <span className="obligatoriu">*</span></label>
                                    <DatePicker
                                        selected={dateFormular.data}
                                        onChange={gestioneazaSchimbareData}
                                        dateFormat="dd/MM/yyyy"
                                        locale="ro"
                                        placeholderText="Selectează data"
                                        className={`input-stanga ${eroriCampuri.data ? "chenar-eroare-camp" : ""}`}
                                        wrapperClassName="wrapper-datepicker"
                                    />
                                    {eroriCampuri.data && <span className="eroare-camp eroare-stanga">{eroriCampuri.data}</span>}
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Luna</label>
                                    <input
                                        type="text"
                                        value={dateFormular.luna}
                                        readOnly
                                        disabled
                                        className="input-stanga camp-readonly"
                                    />
                                </div>

                                <div className="rand-formular">
                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Ora start <span className="obligatoriu">*</span></label>
                                        <input
                                            type="time"
                                            value={dateFormular.ora_start}
                                            onChange={gestioneazaSchimbareOra("ora_start")}
                                            className={`input-stanga ${eroriCampuri.ora_start ? "chenar-eroare-camp" : ""}`}
                                        />
                                        {eroriCampuri.ora_start && <span className="eroare-camp eroare-stanga">{eroriCampuri.ora_start}</span>}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Ora sfârșit <span className="obligatoriu">*</span></label>
                                        <input
                                            type="time"
                                            value={dateFormular.ora_sfarsit}
                                            onChange={gestioneazaSchimbareOra("ora_sfarsit")}
                                            className={`input-stanga ${eroriCampuri.ora_sfarsit ? "chenar-eroare-camp" : ""}`}
                                        />
                                        {eroriCampuri.ora_sfarsit && <span className="eroare-camp eroare-stanga">{eroriCampuri.ora_sfarsit}</span>}
                                    </div>
                                </div>

                                <div className="rand-formular">
                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Pauză (minute)</label>
                                        <input
                                            type="number"
                                            placeholder="30"
                                            value={dateFormular.pauza_masa}
                                            onChange={gestioneazaSchimbareCamp("pauza_masa")}
                                            className={`input-stanga ${eroriCampuri.pauza_masa ? "chenar-eroare-camp" : ""}`}
                                            min="0"
                                            max="180"
                                        />
                                        <small className="indicatie-camp">
                                            Preluată automat din angajat, dar poate fi modificată
                                        </small>
                                        {eroriCampuri.pauza_masa && <span className="eroare-camp eroare-stanga">{eroriCampuri.pauza_masa}</span>}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Ore suplimentare</label>
                                        <input
                                            type="text"
                                            value={formateazaOreInHHMM(dateFormular.ore_lucru_suplimentare)}
                                            readOnly
                                            disabled
                                            className="input-stanga camp-readonly"
                                        />
                                        <small className="indicatie-camp">
                                            Calculat automat după programul angajatului ({Number(dateFormular.ore_lucru_suplimentare || 0).toFixed(2)} h)
                                        </small>
                                    </div>
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Tip zi <span className="obligatoriu">*</span></label>
                                    {seIncarcaOptiunile ? (
                                        <div className="skeleton"></div>
                                    ) : (
                                        <>
                                            <Select
                                                name="tip"
                                                value={dateFormular.tip}
                                                onChange={gestioneazaSchimbareTip}
                                                options={listaTipuriZi}
                                                placeholder="Selectează tipul zilei"
                                                className={`camp-multiselect ${eroriCampuri.tip ? "select-cu-eroare" : ""}`}
                                                classNamePrefix="select"
                                                isSearchable={true}
                                                isClearable={true}
                                                styles={obtineStiluriPersonalizateSelect("tip")}
                                            />
                                            {eroriCampuri.tip && <span className="eroare-camp eroare-stanga">{eroriCampuri.tip}</span>}
                                        </>
                                    )}
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Ore lucrate</label>
                                    <input
                                        type="text"
                                        value={formateazaOreInHHMM(dateFormular.ore_lucrate)}
                                        readOnly
                                        disabled
                                        className="input-stanga camp-readonly"
                                    />
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

export default AddPontaj;