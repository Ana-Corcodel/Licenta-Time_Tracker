import React, { useState, useEffect, useCallback, useMemo } from "react";
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

    const [dateFormular, seteazaDateFormular] = useState(obtineDateInitialeFormular);
    const [seIncarca, seteazaSeIncarca] = useState(false);
    const [mesajEroare, seteazaMesajEroare] = useState("");
    const [mesajSucces, seteazaMesajSucces] = useState("");
    const [afiseazaToast, seteazaAfiseazaToast] = useState(false);
    const [eroriCampuri, seteazaEroriCampuri] = useState({});

    const optiuniOra = useMemo(
        () =>
            Array.from({ length: 24 }, (_, index) => {
                const valoare = String(index).padStart(2, "0");
                return { value: valoare, label: valoare };
            }),
        []
    );

    const optiuniMinute = useMemo(
        () =>
            Array.from({ length: 60 }, (_, index) => {
                const valoare = String(index).padStart(2, "0");
                return { value: valoare, label: valoare };
            }),
        []
    );

    const normalizeazaOra = (valoareOra) => {
        if (!valoareOra) return "";
        return String(valoareOra).slice(0, 5);
    };

    const extrageOraSiMinute = useCallback((valoareTimp) => {
        const [ora = "00", minute = "00"] = String(valoareTimp || "00:00").split(":");
        return { ora, minute };
    }, []);

    const construiesteTimp = useCallback((ora, minute) => {
        return `${String(ora).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }, []);

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

            const tipuriFormatate = dateTipuri.map((tipZi) => ({
                value: tipZi.id,
                label: tipZi.tip_zi,
                prescurtare: tipZi.prescurtare,
                ...tipZi,
            }));

            seteazaListaAngajati(angajatiFormatati);
            seteazaListaTipuriZi(tipuriFormatate);
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
            seteazaDateFormular(obtineDateInitialeFormular());
            seteazaMesajEroare("");
            seteazaMesajSucces("");
            seteazaEroriCampuri({});
        }
    }, [open, incarcaOptiuni, obtineDateInitialeFormular]);

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
                "Ianuarie",
                "Februarie",
                "Martie",
                "Aprilie",
                "Mai",
                "Iunie",
                "Iulie",
                "August",
                "Septembrie",
                "Octombrie",
                "Noiembrie",
                "Decembrie",
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
        calculeazaOreSuplimentare,
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

    const gestioneazaSchimbareTimpSeparat = useCallback(
        (camp, tip, optiuneSelectata) => {
            const valoareSelectata = optiuneSelectata ? optiuneSelectata.value : "00";

            seteazaDateFormular((anterior) => {
                const { ora, minute } = extrageOraSiMinute(anterior[camp]);

                return {
                    ...anterior,
                    [camp]: construiesteTimp(
                        tip === "ora" ? valoareSelectata : ora,
                        tip === "minute" ? valoareSelectata : minute
                    ),
                };
            });

            seteazaEroriCampuri((anterior) => ({ ...anterior, [camp]: "" }));
        },
        [extrageOraSiMinute, construiesteTimp]
    );

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
        seteazaDateFormular((anterior) => ({
            ...anterior,
            data: dataSelectata,
            an: dataSelectata || new Date(),
        }));

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

        if (!valideazaFormular()) return;

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
            minHeight: "43px",
            borderRadius: "12px",
            border: eroriCampuri[numeCamp]
                ? "1px solid #dc2626"
                : stare.isFocused
                    ? "1px solid #2563eb"
                    : "1px solid #d1d5db",
            boxShadow: stare.isFocused ? "0 0 0 4px rgba(37, 99, 235, 0.13)" : "none",
            backgroundColor: "#fff",
            transition: "all 0.22s ease",
            fontWeight: 400,
            "&:hover": {
                borderColor: eroriCampuri[numeCamp] ? "#dc2626" : "#93c5fd",
                backgroundColor: eroriCampuri[numeCamp] ? "#fff7f7" : "#f8fbff",
            },
        }),
        valueContainer: (baza) => ({
            ...baza,
            padding: "0 12px",
        }),
        input: (baza) => ({
            ...baza,
            color: "#111827",
            margin: 0,
            padding: 0,
        }),
        placeholder: (baza) => ({
            ...baza,
            color: "#94a3b8",
            fontSize: "14px",
            fontWeight: 400,
        }),
        singleValue: (baza) => ({
            ...baza,
            color: "#111827",
            fontSize: "14px",
            fontWeight: 400,
        }),
        menu: (baza) => ({
            ...baza,
            zIndex: 9999,
            borderRadius: "14px",
            overflow: "hidden",
            border: "1px solid #e5e7eb",
            boxShadow: "0 18px 40px rgba(15, 23, 42, 0.18)",
        }),
        menuList: (baza) => ({
            ...baza,
            maxHeight: "170px",
            padding: "6px",
        }),
        option: (baza, stare) => ({
            ...baza,
            borderRadius: "10px",
            padding: "10px 12px",
            cursor: "pointer",
            fontSize: "14px",
            backgroundColor: stare.isSelected ? "#dbeafe" : stare.isFocused ? "#eff6ff" : "#fff",
            color: "#111827",
            fontWeight: 400,
            "&:active": {
                backgroundColor: "#dbeafe",
            },
        }),
    });

    if (!open) return null;

    const oraStart = extrageOraSiMinute(dateFormular.ora_start);
    const oraSfarsit = extrageOraSiMinute(dateFormular.ora_sfarsit);

    return (
        <>
            {afiseazaToast && <div className="toast-global">✅ Pontaj adăugat cu succes!</div>}

            <div className="pagina-adauga-pontaj">
                <div className="continut-pagina-adauga-pontaj">
                    <div className="overlay-modal">
                        <div className="fereastra-modal">
                            <div className="antet-modal">
                                <h2>Adaugă Pontaj</h2>
                                <button className="buton-inchidere" onClick={gestioneazaAnulare}>
                                    ×
                                </button>
                            </div>

                            {(seIncarca || seIncarcaOptiunile) && (
                                <div className="overlay-incarcare">
                                    <div className="loader"></div>
                                    <span>
                                        {seIncarcaOptiunile
                                            ? "Se încarcă opțiunile..."
                                            : "Se salvează pontajul..."}
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
                                                className={`camp-multiselect ${eroriCampuri.angajat ? "select-cu-eroare" : ""}`}
                                                classNamePrefix="select"
                                                isSearchable
                                                isClearable
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

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">
                                        Data <span className="obligatoriu">*</span>
                                    </label>

                                    <DatePicker
                                        selected={dateFormular.data}
                                        onChange={gestioneazaSchimbareData}
                                        dateFormat="dd.MM.yyyy"
                                        locale="ro"
                                        placeholderText="Selectează data"
                                        className={`input-stanga ${eroriCampuri.data ? "chenar-eroare-camp" : ""}`}
                                        wrapperClassName="wrapper-datepicker"
                                    />

                                    {eroriCampuri.data && (
                                        <span className="eroare-camp eroare-stanga">
                                            {eroriCampuri.data}
                                        </span>
                                    )}
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
                                        <label className="eticheta-stanga">
                                            Ora start <span className="obligatoriu">*</span>
                                        </label>

                                        <div className="grup-selecturi-timp">
                                            <div className="select-timp">
                                                <Select
                                                    name="ora_start_ora"
                                                    value={optiuniOra.find((optiune) => optiune.value === oraStart.ora)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_start", "ora", optiuneSelectata)
                                                    }
                                                    options={optiuniOra}
                                                    placeholder="Ora"
                                                    className={`camp-multiselect ${eroriCampuri.ora_start ? "select-cu-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable
                                                    isClearable={false}
                                                    styles={obtineStiluriPersonalizateSelect("ora_start")}
                                                    menuPlacement="top"
                                                    menuPosition="fixed"
                                                />
                                            </div>

                                            <span className="separator-timp">:</span>

                                            <div className="select-timp">
                                                <Select
                                                    name="ora_start_minute"
                                                    value={optiuniMinute.find((optiune) => optiune.value === oraStart.minute)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_start", "minute", optiuneSelectata)
                                                    }
                                                    options={optiuniMinute}
                                                    placeholder="Min"
                                                    className={`camp-multiselect ${eroriCampuri.ora_start ? "select-cu-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable
                                                    isClearable={false}
                                                    styles={obtineStiluriPersonalizateSelect("ora_start")}
                                                    menuPlacement="top"
                                                    menuPosition="fixed"
                                                />
                                            </div>
                                        </div>

                                        <small className="indicatie-camp">
                                            Preluată automat din programul angajatului, dar poate fi modificată
                                        </small>

                                        {eroriCampuri.ora_start && (
                                            <span className="eroare-camp eroare-stanga">
                                                {eroriCampuri.ora_start}
                                            </span>
                                        )}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">
                                            Ora sfârșit <span className="obligatoriu">*</span>
                                        </label>

                                        <div className="grup-selecturi-timp">
                                            <div className="select-timp">
                                                <Select
                                                    name="ora_sfarsit_ora"
                                                    value={optiuniOra.find((optiune) => optiune.value === oraSfarsit.ora)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_sfarsit", "ora", optiuneSelectata)
                                                    }
                                                    options={optiuniOra}
                                                    placeholder="Ora"
                                                    className={`camp-multiselect ${eroriCampuri.ora_sfarsit ? "select-cu-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable
                                                    isClearable={false}
                                                    styles={obtineStiluriPersonalizateSelect("ora_sfarsit")}
                                                    menuPlacement="top"
                                                    menuPosition="fixed"
                                                />
                                            </div>

                                            <span className="separator-timp">:</span>

                                            <div className="select-timp">
                                                <Select
                                                    name="ora_sfarsit_minute"
                                                    value={optiuniMinute.find((optiune) => optiune.value === oraSfarsit.minute)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_sfarsit", "minute", optiuneSelectata)
                                                    }
                                                    options={optiuniMinute}
                                                    placeholder="Min"
                                                    className={`camp-multiselect ${eroriCampuri.ora_sfarsit ? "select-cu-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable
                                                    isClearable={false}
                                                    styles={obtineStiluriPersonalizateSelect("ora_sfarsit")}
                                                    menuPlacement="top"
                                                    menuPosition="fixed"
                                                />
                                            </div>
                                        </div>

                                        <small className="indicatie-camp">
                                            Preluată automat din programul angajatului, dar poate fi modificată
                                        </small>

                                        {eroriCampuri.ora_sfarsit && (
                                            <span className="eroare-camp eroare-stanga">
                                                {eroriCampuri.ora_sfarsit}
                                            </span>
                                        )}
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
                                            Preluată automat din programul angajatului, dar poate fi modificată
                                        </small>

                                        {eroriCampuri.pauza_masa && (
                                            <span className="eroare-camp eroare-stanga">
                                                {eroriCampuri.pauza_masa}
                                            </span>
                                        )}
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
                                            Calculat automat după programul angajatului
                                        </small>
                                    </div>
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">
                                        Tip zi <span className="obligatoriu">*</span>
                                    </label>

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
                                                isSearchable
                                                isClearable
                                                styles={obtineStiluriPersonalizateSelect("tip")}
                                                menuPlacement="top"
                                                menuPosition="fixed"
                                            />

                                            {eroriCampuri.tip && (
                                                <span className="eroare-camp eroare-stanga">
                                                    {eroriCampuri.tip}
                                                </span>
                                            )}
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
        </>
    );
};

export default AddPontaj;