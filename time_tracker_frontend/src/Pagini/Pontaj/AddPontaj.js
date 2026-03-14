import React, { useState, useEffect, useCallback} from "react";
import axiosInstance from "../../Config/axiosInstance";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddPontaj.css";

// Înregistrăm localizarea pentru react-datepicker
registerLocale("ro", ro);

const AddPontaj = ({ open, onClose }) => {
    // State-uri pentru opțiuni dropdown
    const [angajati, setAngajati] = useState([]);
    const [tipuriZi, setTipuriZi] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

    // State-uri principale
    const [formData, setFormData] = useState({
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

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Încărcăm opțiunile necesare (angajați și tipuri zi)
    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open]);

    // Reset form when modal opens
    useEffect(() => {
        if (open) {
            setFormData({
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
            setError("");
            setSuccess("");
            setFieldErrors({});
        }
    }, [open]);

    // Fetch angajati si tipuri zi
    const fetchOptions = async () => {
        setLoadingOptions(true);
        try {
            const [angajatiRes, tipuriRes] = await Promise.all([
                axiosInstance.get('/angajati/'),
                axiosInstance.get('/tipuri-zile/')
            ]);

            // Formatam angajatii pentru react-select
            const angajatiFormatted = angajatiRes.data.map(a => ({
                value: a.id,
                label: `${a.nume} ${a.prenume}`,
                ...a
            }));
            setAngajati(angajatiFormatted);

            // Formatam tipurile de zi pentru react-select - CORECTAT
            const tipuriFormatted = tipuriRes.data.map(t => ({
                value: t.id,
                label: t.tip_zi, // Folosim 'tip_zi' deoarece acesta este numele câmpului din model
                prescurtare: t.prescurtare
            }));
            setTipuriZi(tipuriFormatted);
        } catch (err) {
            console.error("Eroare la încărcarea opțiunilor:", err);
            setError("Nu s-au putut încărca opțiunile necesare");
        } finally {
            setLoadingOptions(false);
        }
    };

    // Calculează luna și orele lucrate automat
    const calculateOreLucrate = useCallback((start, sfarsit, pauza) => {
        if (!start || !sfarsit) return 0;

        const [startH, startM] = start.split(':').map(Number);
        const [sfarsitH, sfarsitM] = sfarsit.split(':').map(Number);

        const startMinutes = startH * 60 + startM;
        const sfarsitMinutes = sfarsitH * 60 + sfarsitM;

        let totalMinutes = sfarsitMinutes - startMinutes;
        if (totalMinutes < 0) totalMinutes += 24 * 60; // trecere peste miezul nopții

        const oreLucrate = (totalMinutes - (pauza || 0)) / 60;
        return Math.max(0, Math.round(oreLucrate * 10) / 10); // rotunjim la 1 zecimală
    }, []);

    // Actualizează câmpul luna când se schimbă data
    useEffect(() => {
        if (formData.data) {
            const luni = [
                "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
            ];
            const luna = luni[formData.data.getMonth()];
            setFormData(prev => ({ ...prev, luna }));
        }
    }, [formData.data]);

    // Recalculează orele lucrate când se schimbă ora_start, ora_sfarsit sau pauza_masa
    useEffect(() => {
        const oreLucrate = calculateOreLucrate(
            formData.ora_start,
            formData.ora_sfarsit,
            formData.pauza_masa
        );
        setFormData(prev => ({ ...prev, ore_lucrate: oreLucrate }));
    }, [formData.ora_start, formData.ora_sfarsit, formData.pauza_masa, calculateOreLucrate]);

    // Gestionare modificare câmpuri simple
    const handleChange = useCallback((field) => (e) => {
        let value = e.target.value;

        // Conversie la număr pentru câmpurile numerice
        if (field === "pauza_masa" || field === "ore_lucru_suplimentare") {
            value = parseInt(value) || 0;
            // Limităm valorile
            if (value < 0) value = 0;
            if (field === "pauza_masa" && value > 180) value = 180;
            if (field === "ore_lucru_suplimentare" && value > 24) value = 24;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }, []);

    // Gestionare modificare pentru timp
    const handleTimeChange = useCallback((field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }, []);

    // Gestionare modificare pentru select angajat
    const handleAngajatChange = useCallback((selectedOption) => {
        setFormData(prev => ({ ...prev, angajat: selectedOption }));
        setFieldErrors(prev => ({ ...prev, angajat: "" }));
    }, []);

    // Gestionare modificare pentru select tip zi
    const handleTipChange = useCallback((selectedOption) => {
        setFormData(prev => ({ ...prev, tip: selectedOption }));
        setFieldErrors(prev => ({ ...prev, tip: "" }));
    }, []);

    // Gestionare modificare dată
    const handleDateChange = useCallback((date) => {
        setFormData(prev => ({ ...prev, data: date, an: date }));
        setFieldErrors(prev => ({ ...prev, data: "" }));
    }, []);

    // Validare formular
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.angajat) errors.angajat = "Angajatul este obligatoriu";
        if (!formData.data) errors.data = "Data este obligatorie";
        if (!formData.ora_start) errors.ora_start = "Ora de început este obligatorie";
        if (!formData.ora_sfarsit) errors.ora_sfarsit = "Ora de sfârșit este obligatorie";
        if (!formData.tip) errors.tip = "Tipul de zi este obligatoriu";

        if (formData.pauza_masa < 0) errors.pauza_masa = "Pauza nu poate fi negativă";
        if (formData.ore_lucru_suplimentare < 0) errors.ore_lucru_suplimentare = "Orele suplimentare nu pot fi negative";

        // Verificăm dacă ora de sfârșit este după ora de început
        if (formData.ora_start && formData.ora_sfarsit) {
            const [startH, startM] = formData.ora_start.split(':').map(Number);
            const [sfarsitH, sfarsitM] = formData.ora_sfarsit.split(':').map(Number);

            const startMinutes = startH * 60 + startM;
            const sfarsitMinutes = sfarsitH * 60 + sfarsitM;

            if (sfarsitMinutes <= startMinutes && sfarsitMinutes + 24 * 60 - startMinutes > 12 * 60) {
                errors.ora_sfarsit = "Intervalul pare prea lung pentru trecerea peste noapte";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Reset și închidere modal
    const handleCancel = useCallback(() => {
        setFormData({
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
        setError("");
        setSuccess("");
        setFieldErrors({});
        onClose(false);
    }, [onClose]);

    // Submit formular
    const handleSubmit = useCallback(async () => {
        setError("");
        setSuccess("");
        setFieldErrors({});

        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);

        try {
            // Formatăm data pentru trimitere (YYYY-MM-DD)
            const dataFormatted = formData.data.toISOString().split('T')[0];

            // Formatăm anul ca dată (primul zi a anului)
            const anFormatted = `${formData.an.getFullYear()}-01-01`;

            const payload = {
                angajat: formData.angajat.value,
                luna: formData.luna,
                an: anFormatted,
                ora_start: formData.ora_start,
                ora_sfarsit: formData.ora_sfarsit,
                pauza_masa: parseInt(formData.pauza_masa) || 30,
                tip: formData.tip.value,
                data: dataFormatted,
                ore_lucrate: formData.ore_lucrate,
                ore_lucru_suplimentare: parseInt(formData.ore_lucru_suplimentare) || 0,
            };

            const res = await axiosInstance.post("/pontaje/", payload);

            if (res.status === 201 || res.status === 200) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
                onClose(true, "Pontaj adăugat cu succes!");
            } else {
                setError("Răspuns neașteptat de la server");
            }
        } catch (err) {
            let message = "Eroare la crearea pontajului";
            if (err.response?.data?.detail) message = err.response.data.detail;
            else if (err.response?.data?.message) message = err.response.data.message;
            else if (err.response?.data) {
                // Afișăm erorile de validare detaliate
                const validationErrors = err.response.data;
                if (typeof validationErrors === 'object') {
                    Object.keys(validationErrors).forEach(key => {
                        if (Array.isArray(validationErrors[key])) {
                            message = validationErrors[key][0];
                        }
                    });
                }
            }
            setError(message);
            console.error("Eroare la submit:", err);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, onClose]);

    // Stiluri pentru react-select
    const getCustomSelectStyles = (fieldName) => ({
        control: (base, state) => ({
            ...base,
            border: fieldErrors[fieldName] ? '1px solid #d32f2f' :
                state.isFocused ? '1px solid #007BFF' : '1px solid #ccc',
            '&:hover': {
                border: fieldErrors[fieldName] ? '1px solid #d32f2f' :
                    state.isFocused ? '1px solid #007BFF' : '1px solid #888'
            },
            fontSize: '14px',
            fontFamily: 'Arial, sans-serif',
            minHeight: '38px',
            backgroundColor: state.isFocused ? '#fff' : '#fff',
            boxShadow: 'none',
            borderRadius: '4px',
        }),
        valueContainer: (base) => ({
            ...base,
            padding: '0 8px',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start',
            textAlign: 'left'
        }),
        input: (base) => ({
            ...base,
            color: '#1a1a1a',
            margin: '0',
            padding: '0',
            '& input': {
                boxShadow: 'none !important',
                border: 'none !important',
                outline: 'none !important',
                padding: '0',
                margin: '0',
                textAlign: 'left'
            }
        }),
        placeholder: (base) => ({
            ...base,
            color: '#999',
            fontSize: '14px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
        }),
        singleValue: (base) => ({
            ...base,
            color: '#1a1a1a',
            fontSize: '14px',
            textAlign: 'left',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-start'
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            fontSize: '14px',
            textAlign: 'left'
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? '#e6f2ff' : state.isFocused ? '#f0f0f0' : '#fff',
            color: state.isSelected ? '#006ce4' : '#1a1a1a',
            fontSize: '14px',
            textAlign: 'left',
            '&:active': {
                backgroundColor: '#e6f2ff',
            }
        }),
    });

    if (!open) return null;

    return (
        <>
            {showToast && <div className="global-toast">✅ Pontaj adăugat cu succes!</div>}

            <div className="page-addpontaj">
                <div className="add-pontaj-page">
                    <div className="modal-overlay">
                        <div className="modal">
                            {/* Header modal */}
                            <div className="modal-header">
                                <h2>Adaugă Pontaj</h2>
                                <button className="close-btn" onClick={handleCancel}>×</button>
                            </div>

                            <hr className="header-divider" />

                            {/* Overlay loading */}
                            {(loading || loadingOptions) && (
                                <div className="loading-overlay">
                                    <div className="loader"></div>
                                    <span>{loadingOptions ? "Se încarcă opțiunile..." : "Se salvează pontajul..."}</span>
                                </div>
                            )}

                            {/* Mesaje eroare */}
                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                            <div className="form">
                                {/* Angajat */}
                                <div className="form-field">
                                    <label className="label-left">Angajat <span className="required">*</span></label>
                                    {loadingOptions ? (
                                        <div className="skeleton"></div>
                                    ) : (
                                        <>
                                            <Select
                                                name="angajat"
                                                value={formData.angajat}
                                                onChange={handleAngajatChange}
                                                options={angajati}
                                                placeholder="Selectează angajat"
                                                className={`multiselect-field ${fieldErrors.angajat ? 'select-error' : ''}`}
                                                classNamePrefix="select"
                                                isSearchable={true}
                                                isClearable={true}
                                                styles={getCustomSelectStyles("angajat")}
                                            />
                                            {fieldErrors.angajat && <span className="field-error error-left">{fieldErrors.angajat}</span>}
                                        </>
                                    )}
                                </div>

                                {/* Data */}
                                <div className="form-field">
                                    <label className="label-left">Data <span className="required">*</span></label>
                                    <DatePicker
                                        selected={formData.data}
                                        onChange={handleDateChange}
                                        dateFormat="dd/MM/yyyy"
                                        locale="ro"
                                        placeholderText="Selectează data"
                                        className={`input-left ${fieldErrors.data ? "field-error-border" : ""}`}
                                        wrapperClassName="datepicker-wrapper"
                                    />
                                    {fieldErrors.data && <span className="field-error error-left">{fieldErrors.data}</span>}
                                </div>

                                {/* Luna (automat din data) */}
                                <div className="form-field">
                                    <label className="label-left">Luna</label>
                                    <input
                                        type="text"
                                        value={formData.luna}
                                        readOnly
                                        disabled
                                        className="input-left readonly-field"
                                    />
                                </div>

                                {/* Ora start + Ora sfârșit */}
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Ora start <span className="required">*</span></label>
                                        <input
                                            type="time"
                                            value={formData.ora_start}
                                            onChange={handleTimeChange("ora_start")}
                                            className={`input-left ${fieldErrors.ora_start ? "field-error-border" : ""}`}
                                        />
                                        {fieldErrors.ora_start && <span className="field-error error-left">{fieldErrors.ora_start}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Ora sfârșit <span className="required">*</span></label>
                                        <input
                                            type="time"
                                            value={formData.ora_sfarsit}
                                            onChange={handleTimeChange("ora_sfarsit")}
                                            className={`input-left ${fieldErrors.ora_sfarsit ? "field-error-border" : ""}`}
                                        />
                                        {fieldErrors.ora_sfarsit && <span className="field-error error-left">{fieldErrors.ora_sfarsit}</span>}
                                    </div>
                                </div>

                                {/* Pauză masă + Ore suplimentare */}
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Pauză (minute)</label>
                                        <input
                                            type="number"
                                            placeholder="30"
                                            value={formData.pauza_masa}
                                            onChange={handleChange("pauza_masa")}
                                            className={`input-left ${fieldErrors.pauza_masa ? "field-error-border" : ""}`}
                                            min="0"
                                            max="180"
                                        />
                                        {fieldErrors.pauza_masa && <span className="field-error error-left">{fieldErrors.pauza_masa}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Ore suplimentare</label>
                                        <input
                                            type="number"
                                            placeholder="0"
                                            value={formData.ore_lucru_suplimentare}
                                            onChange={handleChange("ore_lucru_suplimentare")}
                                            className={`input-left ${fieldErrors.ore_lucru_suplimentare ? "field-error-border" : ""}`}
                                            min="0"
                                            max="24"
                                            step="0.5"
                                        />
                                        {fieldErrors.ore_lucru_suplimentare && <span className="field-error error-left">{fieldErrors.ore_lucru_suplimentare}</span>}
                                    </div>
                                </div>

                                {/* Tip zi */}
                                <div className="form-field">
                                    <label className="label-left">Tip zi <span className="required">*</span></label>
                                    {loadingOptions ? (
                                        <div className="skeleton"></div>
                                    ) : (
                                        <>
                                            <Select
                                                name="tip"
                                                value={formData.tip}
                                                onChange={handleTipChange}
                                                options={tipuriZi}
                                                placeholder="Selectează tipul zilei"
                                                className={`multiselect-field ${fieldErrors.tip ? 'select-error' : ''}`}
                                                classNamePrefix="select"
                                                isSearchable={true}
                                                isClearable={true}
                                                styles={getCustomSelectStyles("tip")}
                                            />
                                            {fieldErrors.tip && <span className="field-error error-left">{fieldErrors.tip}</span>}
                                        </>
                                    )}
                                </div>

                                {/* Ore lucrate (automat) */}
                                <div className="form-field">
                                    <label className="label-left">Ore lucrate</label>
                                    <input
                                        type="number"
                                        value={formData.ore_lucrate}
                                        readOnly
                                        disabled
                                        step="0.1"
                                        className="input-left readonly-field"
                                    />
                                    <small className="field-hint">Calculat automat</small>
                                </div>

                                {/* Butoane formular */}
                                <div className="form-buttons">
                                    <button className="cancel-btn" onClick={handleCancel}>
                                        Anulează
                                    </button>

                                    <button
                                        className={`submit-btn ${loading ? "disabled" : ""}`}
                                        onClick={!loading ? handleSubmit : undefined}
                                        disabled={loading}
                                    >
                                        {loading ? "Se salvează..." : "Salvează"}
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