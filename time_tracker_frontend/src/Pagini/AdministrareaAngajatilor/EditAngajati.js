import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../../Config/axiosInstance";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddAngajati.css";

registerLocale("ro", ro);

const EditAngajati = ({ open, employeeData, onClose }) => {
    const optiuniStatus = [
        { value: "activ", label: "Activ" },
        { value: "inactiv", label: "Inactiv" },
        { value: "suspendat", label: "Suspendat" },
    ];

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

    const dateInitialeFormular = useMemo(
        () => ({
            nume: "",
            prenume: "",
            functie: "",
            telefon: "",
            email: "",
            locatie: "",
            ora_incepere: "09:00",
            ora_sfarsit: "17:00",
            ora_pauza: 30,
            status: "activ",
        }),
        []
    );

    const [dateFormular, setDateFormular] = useState(dateInitialeFormular);
    const [seSalveaza, setSeSalveaza] = useState(false);
    const [seIncarcaDatele, setSeIncarcaDatele] = useState(false);
    const [mesajEroare, setMesajEroare] = useState("");
    const [mesajSucces, setMesajSucces] = useState("");
    const [afiseazaToast, setAfiseazaToast] = useState(false);
    const [eroriCampuri, setEroriCampuri] = useState({});

    const extrageOraSiMinute = useCallback((valoareTimp) => {
        const [ora = "00", minute = "00"] = String(valoareTimp || "00:00").split(":");
        return { ora, minute };
    }, []);

    const construiesteTimp = useCallback((ora, minute) => {
        return `${String(ora).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
    }, []);

    const preiaDetaliiAngajat = useCallback(async () => {
        if (!employeeData?.id) return;

        try {
            setSeIncarcaDatele(true);
            const raspuns = await axiosInstance.get(`/angajati/${employeeData.id}/`);

            const angajat = raspuns.data;

            let valoareStatus = angajat.status;

            if (angajat.status && typeof angajat.status === "object" && angajat.status.value) {
                valoareStatus = angajat.status.value;
            } else if (angajat.status && typeof angajat.status === "object" && angajat.status.id) {
                const mapaStatus = {
                    1: "activ",
                    2: "inactiv",
                    3: "suspendat",
                };
                valoareStatus = mapaStatus[angajat.status.id] || "activ";
            }

            setDateFormular({
                nume: angajat.nume || "",
                prenume: angajat.prenume || "",
                functie: angajat.functie || "",
                telefon: angajat.telefon || "",
                email: angajat.email || "",
                locatie: angajat.locatie || "",
                ora_incepere: angajat.ora_incepere || "09:00",
                ora_sfarsit: angajat.ora_sfarsit || "17:00",
                ora_pauza: angajat.ora_pauza ?? 30,
                status: valoareStatus || "activ",
            });
        } catch (eroare) {
            console.error("Eroare la încărcarea detaliilor angajatului:", eroare);
            setMesajEroare("Nu s-au putut încărca datele angajatului");
        } finally {
            setSeIncarcaDatele(false);
        }
    }, [employeeData]);

    useEffect(() => {
        if (open) {
            setMesajEroare("");
            setMesajSucces("");
            setEroriCampuri({});

            if (employeeData?.id) {
                preiaDetaliiAngajat();
            } else {
                setDateFormular(dateInitialeFormular);
            }
        }
    }, [open, employeeData, dateInitialeFormular, preiaDetaliiAngajat]);

    const gestioneazaSchimbare = useCallback(
        (camp) => (e) => {
            let valoare = e.target.value;

            if (camp === "telefon") {
                valoare = valoare.replace(/\D/g, "");
                if (valoare.length > 15) {
                    valoare = valoare.slice(0, 15);
                }
            }

            if (camp === "ora_pauza") {
                valoare = parseInt(valoare, 10);
                if (Number.isNaN(valoare)) {
                    valoare = 0;
                }
            }

            setDateFormular((anterior) => ({ ...anterior, [camp]: valoare }));
            setEroriCampuri((anterior) => ({ ...anterior, [camp]: "" }));
        },
        []
    );

    const gestioneazaSchimbareStatus = useCallback((optiuneSelectata) => {
        const valoare = optiuneSelectata ? optiuneSelectata.value : "";
        setDateFormular((anterior) => ({ ...anterior, status: valoare }));
        setEroriCampuri((anterior) => ({ ...anterior, status: "" }));
    }, []);

    const gestioneazaSchimbareTimpSeparat = useCallback(
        (camp, tip, optiuneSelectata) => {
            const valoareSelectata = optiuneSelectata ? optiuneSelectata.value : "00";

            setDateFormular((anterior) => {
                const { ora, minute } = extrageOraSiMinute(anterior[camp]);

                const oraNoua = tip === "ora" ? valoareSelectata : ora;
                const minuteNoi = tip === "minute" ? valoareSelectata : minute;

                return {
                    ...anterior,
                    [camp]: construiesteTimp(oraNoua, minuteNoi),
                };
            });

            setEroriCampuri((anterior) => ({ ...anterior, [camp]: "" }));
        },
        [extrageOraSiMinute, construiesteTimp]
    );

    const valideazaFormular = useCallback(() => {
        const erori = {};

        if (!dateFormular.nume.trim()) erori.nume = "Numele este obligatoriu";
        if (!dateFormular.prenume.trim()) erori.prenume = "Prenumele este obligatoriu";
        if (!dateFormular.functie.trim()) erori.functie = "Funcția este obligatorie";
        if (!dateFormular.telefon.trim()) erori.telefon = "Telefonul este obligatoriu";
        if (!dateFormular.status) erori.status = "Statusul este obligatoriu";
        if (!dateFormular.ora_incepere) erori.ora_incepere = "Ora de începere este obligatorie";
        if (!dateFormular.ora_sfarsit) erori.ora_sfarsit = "Ora de sfârșit este obligatorie";

        if (dateFormular.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dateFormular.email)) {
            erori.email = "Email invalid";
        }

        setEroriCampuri(erori);
        return Object.keys(erori).length === 0;
    }, [dateFormular]);

    const gestioneazaAnulare = useCallback(() => {
        setDateFormular(dateInitialeFormular);
        setMesajEroare("");
        setMesajSucces("");
        setEroriCampuri({});
        onClose(false);
    }, [dateInitialeFormular, onClose]);

    const gestioneazaActualizare = useCallback(async () => {
        setMesajEroare("");
        setMesajSucces("");
        setEroriCampuri({});

        const esteValid = valideazaFormular();
        if (!esteValid) return;

        setSeSalveaza(true);

        try {
            const payload = {
                ...dateFormular,
                ora_pauza:
                    dateFormular.ora_pauza === "" ||
                        dateFormular.ora_pauza === null ||
                        dateFormular.ora_pauza === undefined
                        ? 30
                        : parseInt(dateFormular.ora_pauza, 10),
            };

            const raspuns = await axiosInstance.put(`/angajati/${employeeData.id}/`, payload);

            if (raspuns.status === 200) {
                setAfiseazaToast(true);
                setTimeout(() => setAfiseazaToast(false), 4000);
                onClose(true, "Angajat editat cu succes!");
            } else {
                setMesajEroare("Răspuns neașteptat de la server");
            }
        } catch (eroare) {
            let mesaj = "Eroare la editarea angajatului";
            if (eroare.response?.data?.detail) mesaj = eroare.response.data.detail;
            else if (eroare.response?.data?.message) mesaj = eroare.response.data.message;

            setMesajEroare(mesaj);
            console.error("Eroare la actualizare:", eroare);
        } finally {
            setSeSalveaza(false);
        }
    }, [dateFormular, valideazaFormular, employeeData, onClose]);

    const obtineStiluriSelectPersonalizat = (numeCamp) => ({
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
            maxHeight: "150px",
            overflowY: "auto"
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

    const oraIncepere = extrageOraSiMinute(dateFormular.ora_incepere);
    const oraSfarsit = extrageOraSiMinute(dateFormular.ora_sfarsit);

    return (
        <>
            {afiseazaToast && <div className="toast-global">✅ Angajat editat cu succes!</div>}

            <div className="pagina-adauga-angajat">
                <div className="pagina-formular-angajat">
                    <div className="fundal-modal">
                        <div className="fereastra-modal">
                            <div className="antet-modal">
                                <h2>Editează Angajat</h2>
                                <button className="buton-inchidere" onClick={gestioneazaAnulare}>×</button>
                            </div>

                            <hr className="linie-antet" />

                            {(seSalveaza || seIncarcaDatele) && (
                                <div className="suprapunere-incarcare">
                                    <div className="incarcator"></div>
                                    <span>
                                        {seIncarcaDatele ? "Se încarcă datele..." : "Se salvează editările..."}
                                    </span>
                                </div>
                            )}

                            {mesajEroare && <div className="alerta eroare">{mesajEroare}</div>}
                            {mesajSucces && <div className="alerta succes">{mesajSucces}</div>}

                            <div className="formular">
                                <div className="rand-formular">
                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Nume <span className="obligatoriu">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu numele"
                                            value={dateFormular.nume}
                                            onChange={gestioneazaSchimbare("nume")}
                                            className={`input-stanga ${eroriCampuri.nume ? "chenar-eroare-camp" : ""}`}
                                            disabled={seIncarcaDatele}
                                            required
                                        />
                                        {eroriCampuri.nume && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.nume}</span>}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Prenume <span className="obligatoriu">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu prenumele"
                                            value={dateFormular.prenume}
                                            onChange={gestioneazaSchimbare("prenume")}
                                            className={`input-stanga ${eroriCampuri.prenume ? "chenar-eroare-camp" : ""}`}
                                            disabled={seIncarcaDatele}
                                            required
                                        />
                                        {eroriCampuri.prenume && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.prenume}</span>}
                                    </div>
                                </div>

                                <div className="rand-formular">
                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Funcție <span className="obligatoriu">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu funcția"
                                            value={dateFormular.functie}
                                            onChange={gestioneazaSchimbare("functie")}
                                            className={`input-stanga ${eroriCampuri.functie ? "chenar-eroare-camp" : ""}`}
                                            disabled={seIncarcaDatele}
                                            required
                                        />
                                        {eroriCampuri.functie && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.functie}</span>}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Status <span className="obligatoriu">*</span></label>

                                        <Select
                                            name="status"
                                            value={optiuniStatus.find(optiune => optiune.value === dateFormular.status)}
                                            onChange={gestioneazaSchimbareStatus}
                                            options={optiuniStatus}
                                            placeholder="Selectează status"
                                            className={`camp-select-multiplu ${eroriCampuri.status ? "select-eroare" : ""}`}
                                            classNamePrefix="select"
                                            isSearchable={true}
                                            isClearable={true}
                                            isDisabled={seIncarcaDatele}
                                            styles={obtineStiluriSelectPersonalizat("status")}
                                        />

                                        {eroriCampuri.status && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.status}</span>}
                                    </div>
                                </div>

                                <div className="rand-formular">
                                    <div className="camp-formular camp-telefon">
                                        <label className="eticheta-stanga">Telefon <span className="obligatoriu">*</span></label>
                                        <div className="input-cu-icon">
                                            <span className="icon-telefon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 24 24">
                                                    <path d="M22 16.92v3a1.999 1.999 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                            </span>

                                            <input
                                                type="text"
                                                placeholder="Introdu numărul de telefon"
                                                value={dateFormular.telefon}
                                                onChange={gestioneazaSchimbare("telefon")}
                                                className={`input-stanga ${eroriCampuri.telefon ? "chenar-eroare-camp" : ""}`}
                                                disabled={seIncarcaDatele}
                                                required
                                            />
                                        </div>
                                        {eroriCampuri.telefon && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.telefon}</span>}
                                    </div>

                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Introdu email (opțional)"
                                            value={dateFormular.email || ""}
                                            onChange={gestioneazaSchimbare("email")}
                                            className={`input-stanga ${eroriCampuri.email ? "chenar-eroare-camp" : ""}`}
                                            disabled={seIncarcaDatele}
                                        />
                                        {eroriCampuri.email && <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.email}</span>}
                                    </div>
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Locație</label>
                                    <input
                                        type="text"
                                        placeholder="Introdu locația (opțional)"
                                        value={dateFormular.locatie || ""}
                                        onChange={gestioneazaSchimbare("locatie")}
                                        className="input-stanga"
                                        disabled={seIncarcaDatele}
                                    />
                                </div>

                                <div className="rand-formular">
                                    <div className="camp-formular">
                                        <label className="eticheta-stanga">
                                            Ora începere <span className="obligatoriu">*</span>
                                        </label>

                                        <div className="grup-selecturi-timp">
                                            <div className="select-timp">
                                                <Select
                                                    name="ora_incepere_ora"
                                                    value={optiuniOra.find((optiune) => optiune.value === oraIncepere.ora)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_incepere", "ora", optiuneSelectata)
                                                    }
                                                    options={optiuniOra}
                                                    placeholder="Ora"
                                                    className={`camp-select-multiplu ${eroriCampuri.ora_incepere ? "select-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable={true}
                                                    isClearable={false}
                                                    isDisabled={seIncarcaDatele}
                                                    styles={obtineStiluriSelectPersonalizat("ora_incepere")}
                                                />
                                            </div>

                                            <span className="separator-timp">:</span>

                                            <div className="select-timp">
                                                <Select
                                                    name="ora_incepere_minute"
                                                    value={optiuniMinute.find((optiune) => optiune.value === oraIncepere.minute)}
                                                    onChange={(optiuneSelectata) =>
                                                        gestioneazaSchimbareTimpSeparat("ora_incepere", "minute", optiuneSelectata)
                                                    }
                                                    options={optiuniMinute}
                                                    placeholder="Min"
                                                    className={`camp-select-multiplu ${eroriCampuri.ora_incepere ? "select-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable={true}
                                                    isClearable={false}
                                                    isDisabled={seIncarcaDatele}
                                                    styles={obtineStiluriSelectPersonalizat("ora_incepere")}
                                                />
                                            </div>
                                        </div>

                                        {eroriCampuri.ora_incepere && (
                                            <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.ora_incepere}</span>
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
                                                    className={`camp-select-multiplu ${eroriCampuri.ora_sfarsit ? "select-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable={true}
                                                    isClearable={false}
                                                    isDisabled={seIncarcaDatele}
                                                    styles={obtineStiluriSelectPersonalizat("ora_sfarsit")}
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
                                                    className={`camp-select-multiplu ${eroriCampuri.ora_sfarsit ? "select-eroare" : ""}`}
                                                    classNamePrefix="select"
                                                    isSearchable={true}
                                                    isClearable={false}
                                                    isDisabled={seIncarcaDatele}
                                                    styles={obtineStiluriSelectPersonalizat("ora_sfarsit")}
                                                />
                                            </div>
                                        </div>

                                        {eroriCampuri.ora_sfarsit && (
                                            <span className="mesaj-eroare-camp eroare-stanga">{eroriCampuri.ora_sfarsit}</span>
                                        )}
                                    </div>
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">Pauză (minute)</label>
                                    <input
                                        type="number"
                                        placeholder="30"
                                        value={dateFormular.ora_pauza}
                                        onChange={gestioneazaSchimbare("ora_pauza")}
                                        className="input-stanga"
                                        min="0"
                                        max="120"
                                        disabled={seIncarcaDatele}
                                    />
                                </div>
                            </div>
                            <div className="butoane-formular">
                                <button
                                    className="buton-anulare"
                                    onClick={gestioneazaAnulare}
                                    disabled={seSalveaza || seIncarcaDatele}
                                >
                                    Anulează
                                </button>

                                <button
                                    className={`buton-salvare ${(seSalveaza || seIncarcaDatele) ? "dezactivat" : ""}`}
                                    onClick={!seSalveaza && !seIncarcaDatele ? gestioneazaActualizare : undefined}
                                    disabled={seSalveaza || seIncarcaDatele}
                                >
                                    {seSalveaza ? "Se salvează..." : "Actualizează"}
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditAngajati;