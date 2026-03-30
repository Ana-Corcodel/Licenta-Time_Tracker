import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import DatePicker from "react-datepicker";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddPontaj.css";

registerLocale("ro", ro);

const EditPontaj = ({ open, pontajData, onClose }) => {
    const [angajati, setAngajati] = useState([]);
    const [tipuriZi, setTipuriZi] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(false);

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

    const getInitialFormData = useCallback(() => ({
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
    }), []);

    const normalizeTime = (timeValue) => {
        if (!timeValue) return "";
        return String(timeValue).slice(0, 5);
    };

    const timeToMinutes = (time) => {
        if (!time) return 0;
        const [h, m] = String(time).split(":").map(Number);
        return h * 60 + m;
    };

    const formatHoursToHHMM = (value) => {
        const numericValue = Number(value) || 0;
        const totalMinutes = Math.round(numericValue * 60);
        const hours = Math.floor(totalMinutes / 60);
        const minutes = totalMinutes % 60;

        return `${hours}:${String(minutes).padStart(2, "0")}`;
    };

    const fetchOptions = useCallback(async () => {
        setLoadingOptions(true);
        try {
            const [angajatiRes, tipuriRes] = await Promise.all([
                axiosInstance.get("/angajati/"),
                axiosInstance.get("/tipuri-zile/")
            ]);

            const angajatiData = Array.isArray(angajatiRes.data)
                ? angajatiRes.data
                : angajatiRes.data?.results || [];

            const tipuriData = Array.isArray(tipuriRes.data)
                ? tipuriRes.data
                : tipuriRes.data?.results || [];

            const angajatiFormatted = angajatiData.map(a => ({
                value: a.id,
                label: `${a.nume} ${a.prenume}`,
                ...a
            }));

            const tipuriFormatted = tipuriData.map(t => ({
                value: t.id,
                label: t.tip_zi,
                prescurtare: t.prescurtare,
                ...t
            }));

            setAngajati(angajatiFormatted);
            setTipuriZi(tipuriFormatted);

            return {
                angajatiFormatted,
                tipuriFormatted,
            };
        } catch (err) {
            console.error("Eroare la încărcarea opțiunilor:", err);
            setError("Nu s-au putut încărca opțiunile necesare");
            return {
                angajatiFormatted: [],
                tipuriFormatted: [],
            };
        } finally {
            setLoadingOptions(false);
        }
    }, []);

    useEffect(() => {
        if (open) {
            fetchOptions();
        }
    }, [open, fetchOptions]);

    const initializeForm = useCallback(async () => {
        if (!pontajData) return;

        setError("");
        setSuccess("");
        setFieldErrors({});

        try {
            let currentAngajati = angajati;
            let currentTipuriZi = tipuriZi;

            if (angajati.length === 0 || tipuriZi.length === 0) {
                const loaded = await fetchOptions();
                currentAngajati = loaded.angajatiFormatted;
                currentTipuriZi = loaded.tipuriFormatted;
            }

            const angajatId =
                typeof pontajData.angajat === "object"
                    ? pontajData.angajat?.id
                    : pontajData.angajat;

            const tipId =
                typeof pontajData.tip === "object"
                    ? pontajData.tip?.id
                    : pontajData.tip;

            const angajatSelectat =
                currentAngajati.find(a => a.value === angajatId) || null;

            const tipSelectat =
                currentTipuriZi.find(t => t.value === tipId) || null;

            const dataObj = pontajData.data ? new Date(pontajData.data) : new Date();
            const anObj = pontajData.an ? new Date(pontajData.an) : new Date();

            setFormData({
                angajat: angajatSelectat,
                luna: pontajData.luna || "",
                an: anObj,
                ora_start: normalizeTime(pontajData.ora_start) || "09:00",
                ora_sfarsit: normalizeTime(pontajData.ora_sfarsit) || "17:00",
                pauza_masa: pontajData.pauza_masa ?? angajatSelectat?.ora_pauza ?? 30,
                tip: tipSelectat,
                data: dataObj,
                ore_lucrate: Number(pontajData.ore_lucrate) || 0,
                ore_lucru_suplimentare: Number(pontajData.ore_lucru_suplimentare) || 0,
            });
        } catch (err) {
            console.error("Eroare la inițializarea formularului:", err);
            setError("Nu s-au putut încărca datele pentru editare");
        }
    }, [pontajData, angajati, tipuriZi, fetchOptions]);

    useEffect(() => {
        if (open && pontajData) {
            initializeForm();
        }
    }, [open, pontajData, initializeForm]);

    const calculateOreLucrate = useCallback((start, sfarsit, pauza) => {
        if (!start || !sfarsit) return 0;

        const startMinutes = timeToMinutes(start);
        const sfarsitMinutes = timeToMinutes(sfarsit);

        let totalMinutes = sfarsitMinutes - startMinutes;
        if (totalMinutes < 0) totalMinutes += 24 * 60;

        const minuteLucrate = Math.max(0, totalMinutes - (Number(pauza) || 0));
        return Math.round((minuteLucrate / 60) * 100) / 100;
    }, []);

    const calculateOreSuplimentare = useCallback((pontajEnd, programEnd) => {
        if (!pontajEnd || !programEnd) return 0;

        const pontajEndMinutes = timeToMinutes(pontajEnd);
        const programEndMinutes = timeToMinutes(programEnd);

        let extraMinutes = pontajEndMinutes - programEndMinutes;
        if (extraMinutes < 0) extraMinutes = 0;

        return Math.round((extraMinutes / 60) * 100) / 100;
    }, []);

    useEffect(() => {
        if (formData.data) {
            const luni = [
                "Ianuarie", "Februarie", "Martie", "Aprilie", "Mai", "Iunie",
                "Iulie", "August", "Septembrie", "Octombrie", "Noiembrie", "Decembrie"
            ];
            const luna = luni[formData.data.getMonth()];
            setFormData(prev => {
                if (prev.luna === luna) return prev;
                return { ...prev, luna };
            });
        }
    }, [formData.data]);

    useEffect(() => {
        const oreLucrate = calculateOreLucrate(
            formData.ora_start,
            formData.ora_sfarsit,
            formData.pauza_masa
        );

        const programEnd = normalizeTime(formData.angajat?.ora_sfarsit);

        const oreSuplimentare = calculateOreSuplimentare(
            formData.ora_sfarsit,
            programEnd
        );

        setFormData(prev => {
            if (
                prev.ore_lucrate === oreLucrate &&
                prev.ore_lucru_suplimentare === oreSuplimentare
            ) {
                return prev;
            }

            return {
                ...prev,
                ore_lucrate: oreLucrate,
                ore_lucru_suplimentare: oreSuplimentare,
            };
        });
    }, [
        formData.ora_start,
        formData.ora_sfarsit,
        formData.pauza_masa,
        formData.angajat,
        calculateOreLucrate,
        calculateOreSuplimentare
    ]);

    const handleChange = useCallback((field) => (e) => {
        let value = e.target.value;

        if (field === "pauza_masa") {
            value = parseInt(value, 10);
            if (Number.isNaN(value)) value = 0;
            if (value < 0) value = 0;
            if (value > 180) value = 180;
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }, []);

    const handleTimeChange = useCallback((field) => (e) => {
        const value = e.target.value;
        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }, []);

    const handleAngajatChange = useCallback((selectedOption) => {
        setFormData(prev => ({
            ...prev,
            angajat: selectedOption,
            pauza_masa: selectedOption?.ora_pauza ?? 30,
            ora_start: normalizeTime(selectedOption?.ora_incepere) || "09:00",
            ora_sfarsit: normalizeTime(selectedOption?.ora_sfarsit) || "17:00",
        }));
        setFieldErrors(prev => ({
            ...prev,
            angajat: "",
            pauza_masa: "",
            ora_start: "",
            ora_sfarsit: "",
        }));
    }, []);

    const handleTipChange = useCallback((selectedOption) => {
        setFormData(prev => ({ ...prev, tip: selectedOption }));
        setFieldErrors(prev => ({ ...prev, tip: "" }));
    }, []);

    const handleDateChange = useCallback((date) => {
        setFormData(prev => ({ ...prev, data: date, an: date || new Date() }));
        setFieldErrors(prev => ({ ...prev, data: "" }));
    }, []);

    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.angajat) errors.angajat = "Angajatul este obligatoriu";
        if (!formData.data) errors.data = "Data este obligatorie";
        if (!formData.ora_start) errors.ora_start = "Ora de început este obligatorie";
        if (!formData.ora_sfarsit) errors.ora_sfarsit = "Ora de sfârșit este obligatorie";
        if (!formData.tip) errors.tip = "Tipul de zi este obligatoriu";

        if (formData.pauza_masa < 0) {
            errors.pauza_masa = "Pauza nu poate fi negativă";
        }

        if (formData.ora_start && formData.ora_sfarsit) {
            const startMinutes = timeToMinutes(formData.ora_start);
            const sfarsitMinutes = timeToMinutes(formData.ora_sfarsit);

            if (sfarsitMinutes <= startMinutes && sfarsitMinutes + 24 * 60 - startMinutes > 12 * 60) {
                errors.ora_sfarsit = "Intervalul pare prea lung pentru trecerea peste noapte";
            }
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    const handleCancel = useCallback(() => {
        setFormData(getInitialFormData());
        setError("");
        setSuccess("");
        setFieldErrors({});
        onClose(false);
    }, [getInitialFormData, onClose]);

    const handleSubmit = useCallback(async () => {
        setError("");
        setSuccess("");
        setFieldErrors({});

        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);

        try {
            const dataFormatted = formData.data.toISOString().split("T")[0];
            const anFormatted = `${formData.an.getFullYear()}-01-01`;

            const payload = {
                angajat: formData.angajat.value,
                luna: formData.luna,
                an: anFormatted,
                ora_start: formData.ora_start,
                ora_sfarsit: formData.ora_sfarsit,
                pauza_masa: parseInt(formData.pauza_masa, 10) || 0,
                tip: formData.tip.value,
                data: dataFormatted,
                ore_lucrate: formData.ore_lucrate,
                ore_lucru_suplimentare: formData.ore_lucru_suplimentare,
            };

            const res = await axiosInstance.put(`/pontaje/${pontajData.id}/`, payload);

            if (res.status === 200) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
                onClose(true, "Pontaj actualizat cu succes!");
            } else {
                setError("Răspuns neașteptat de la server");
            }
        } catch (err) {
            let message = "Eroare la actualizarea pontajului";
            if (err.response?.data?.detail) message = err.response.data.detail;
            else if (err.response?.data?.message) message = err.response.data.message;
            else if (err.response?.data) {
                const validationErrors = err.response.data;
                if (typeof validationErrors === "object") {
                    const firstKey = Object.keys(validationErrors)[0];
                    if (firstKey && Array.isArray(validationErrors[firstKey])) {
                        message = validationErrors[firstKey][0];
                    }
                }
            }
            setError(message);
            console.error("Eroare la submit:", err);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, pontajData, onClose]);

    const getCustomSelectStyles = (fieldName) => ({
        control: (base, state) => ({
            ...base,
            border: fieldErrors[fieldName] ? "1px solid #d32f2f" :
                state.isFocused ? "1px solid #007BFF" : "1px solid #ccc",
            "&:hover": {
                border: fieldErrors[fieldName] ? "1px solid #d32f2f" :
                    state.isFocused ? "1px solid #007BFF" : "1px solid #888"
            },
            fontSize: "14px",
            fontFamily: "Arial, sans-serif",
            minHeight: "38px",
            backgroundColor: "#fff",
            boxShadow: "none",
            borderRadius: "4px",
        }),
        valueContainer: (base) => ({
            ...base,
            padding: "0 8px",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start",
            textAlign: "left"
        }),
        input: (base) => ({
            ...base,
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
        placeholder: (base) => ({
            ...base,
            color: "#999",
            fontSize: "14px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
        }),
        singleValue: (base) => ({
            ...base,
            color: "#1a1a1a",
            fontSize: "14px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-start"
        }),
        menu: (base) => ({
            ...base,
            zIndex: 9999,
            fontSize: "14px",
            textAlign: "left"
        }),
        option: (base, state) => ({
            ...base,
            backgroundColor: state.isSelected ? "#e6f2ff" : state.isFocused ? "#f0f0f0" : "#fff",
            color: state.isSelected ? "#006ce4" : "#1a1a1a",
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
            {showToast && <div className="global-toast">✅ Pontaj actualizat cu succes!</div>}

            <div className="page-addpontaj">
                <div className="add-pontaj-page">
                    <div className="modal-overlay">
                        <div className="modal">
                            <div className="modal-header">
                                <h2>Editează Pontaj</h2>
                                <button className="close-btn" onClick={handleCancel}>×</button>
                            </div>

                            <hr className="header-divider" />

                            {(loading || loadingOptions) && (
                                <div className="loading-overlay">
                                    <div className="loader"></div>
                                    <span>{loadingOptions ? "Se încarcă opțiunile..." : "Se actualizează pontajul..."}</span>
                                </div>
                            )}

                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                            <div className="form">
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
                                                className={`multiselect-field ${fieldErrors.angajat ? "select-error" : ""}`}
                                                classNamePrefix="select"
                                                isSearchable={true}
                                                isClearable={true}
                                                styles={getCustomSelectStyles("angajat")}
                                            />
                                            {fieldErrors.angajat && (
                                                <span className="field-error error-left">{fieldErrors.angajat}</span>
                                            )}
                                        </>
                                    )}
                                </div>

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
                                    {fieldErrors.data && (
                                        <span className="field-error error-left">{fieldErrors.data}</span>
                                    )}
                                </div>

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

                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Ora start <span className="required">*</span></label>
                                        <input
                                            type="time"
                                            value={formData.ora_start}
                                            onChange={handleTimeChange("ora_start")}
                                            className={`input-left ${fieldErrors.ora_start ? "field-error-border" : ""}`}
                                        />
                                        {fieldErrors.ora_start && (
                                            <span className="field-error error-left">{fieldErrors.ora_start}</span>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Ora sfârșit <span className="required">*</span></label>
                                        <input
                                            type="time"
                                            value={formData.ora_sfarsit}
                                            onChange={handleTimeChange("ora_sfarsit")}
                                            className={`input-left ${fieldErrors.ora_sfarsit ? "field-error-border" : ""}`}
                                        />
                                        {fieldErrors.ora_sfarsit && (
                                            <span className="field-error error-left">{fieldErrors.ora_sfarsit}</span>
                                        )}
                                    </div>
                                </div>

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
                                        <small className="field-hint">
                                            Preluată automat din angajat, dar poate fi modificată
                                        </small>
                                        {fieldErrors.pauza_masa && (
                                            <span className="field-error error-left">{fieldErrors.pauza_masa}</span>
                                        )}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Ore suplimentare</label>
                                        <input
                                            type="text"
                                            value={formatHoursToHHMM(formData.ore_lucru_suplimentare)}
                                            readOnly
                                            disabled
                                            className="input-left readonly-field"
                                        />
                                        <small className="field-hint">
                                            Calculat automat după programul angajatului ({Number(formData.ore_lucru_suplimentare || 0).toFixed(2)} h)
                                        </small>
                                    </div>
                                </div>

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
                                                className={`multiselect-field ${fieldErrors.tip ? "select-error" : ""}`}
                                                classNamePrefix="select"
                                                isSearchable={true}
                                                isClearable={true}
                                                styles={getCustomSelectStyles("tip")}
                                            />
                                            {fieldErrors.tip && (
                                                <span className="field-error error-left">{fieldErrors.tip}</span>
                                            )}
                                        </>
                                    )}
                                </div>

                                <div className="form-field">
                                    <label className="label-left">Ore lucrate</label>
                                    <input
                                        type="text"
                                        value={formatHoursToHHMM(formData.ore_lucrate)}
                                        readOnly
                                        disabled
                                        className="input-left readonly-field"
                                    />
                                    <small className="field-hint">
                                        Calculat automat ({Number(formData.ore_lucrate || 0).toFixed(2)} h)
                                    </small>
                                </div>

                                <div className="form-buttons">
                                    <button className="cancel-btn" onClick={handleCancel}>
                                        Anulează
                                    </button>

                                    <button
                                        className={`submit-btn ${loading ? "disabled" : ""}`}
                                        onClick={!loading ? handleSubmit : undefined}
                                        disabled={loading}
                                    >
                                        {loading ? "Se actualizează..." : "Actualizează"}
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

export default EditPontaj;