import React, { useState, useEffect, useCallback, useMemo } from "react";
import axiosInstance from "../../Config/axiosInstance";
import { registerLocale } from "react-datepicker";
import { ro } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import Select from "react-select";
import "./AddAngajati.css"; // Folosim același CSS ca la Add

// Înregistrăm localizarea pentru react-datepicker
registerLocale("ro", ro);

const EditAngajati = ({ open, employeeData, onClose }) => {
    // Opțiuni statice pentru status (conform STATUS_CHOICES din model)
    const statusOptions = [
        { value: 'activ', label: 'Activ' },
        { value: 'inactiv', label: 'Inactiv' },
        { value: 'suspendat', label: 'Suspendat' },
    ];

    // Date inițiale pentru formular
    const initialFormData = useMemo(
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
            status: "activ", // Setăm default 'active'
        }),
        []
    );

    // State-uri principale
    const [formData, setFormData] = useState(initialFormData);
    const [loading, setLoading] = useState(false);
    const [fetchLoading, setFetchLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Funcție care preia datele angajatului pentru editare
    const fetchEmployeeDetails = useCallback(async () => {
        if (!employeeData?.id) return;

        try {
            setFetchLoading(true);
            const res = await axiosInstance.get(`/angajati/${employeeData.id}/`);

            const employee = res.data;

            // Determinăm valoarea statusului - poate veni ca string direct sau ca obiect cu id
            let statusValue = employee.status;
            if (employee.status && typeof employee.status === 'object' && employee.status.value) {
                statusValue = employee.status.value;
            } else if (employee.status && typeof employee.status === 'object' && employee.status.id) {
                // Dacă vine ca obiect cu id, încercăm să mapăm la valorile noastre
                const statusMap = {
                    1: 'activ',
                    2: 'inactiv',
                    3: 'suspendat'
                };
                statusValue = statusMap[employee.status.id] || 'activ';
            }

            setFormData({
                nume: employee.nume || "",
                prenume: employee.prenume || "",
                functie: employee.functie || "",
                telefon: employee.telefon || "",
                email: employee.email || "",
                locatie: employee.locatie || "",
                ora_incepere: employee.ora_incepere || "09:00",
                ora_sfarsit: employee.ora_sfarsit || "17:00",
                ora_pauza: employee.ora_pauza ?? 30,
                status: statusValue || "activ",
            });
        } catch (err) {
            console.error("Eroare la încărcarea detaliilor angajatului:", err);
            setError("Nu s-au putut încărca datele angajatului");
        } finally {
            setFetchLoading(false);
        }
    }, [employeeData]);

    // Când se deschide modalul, resetăm formularul și încărcăm datele
    useEffect(() => {
        if (open) {
            setError("");
            setSuccess("");
            setFieldErrors({});

            if (employeeData?.id) {
                fetchEmployeeDetails();
            } else {
                setFormData(initialFormData);
            }
        }
    }, [open, employeeData, initialFormData, fetchEmployeeDetails]);

    // Gestionare modificare câmpuri de formular
    const handleChange = useCallback(
        (field) => (e) => {
            let value = e.target.value;

            // Curățare input telefon — doar cifre, max 15 caractere
            if (field === "telefon") {
                value = value.replace(/\D/g, "");
                if (value.length > 15) {
                    value = value.slice(0, 15);
                }
            }

            // Conversie la număr pentru ora_pauza
            if (field === "ora_pauza") {
                value = parseInt(value) || 0;
            }

            setFormData((prev) => ({ ...prev, [field]: value }));
            setFieldErrors((prev) => ({ ...prev, [field]: "" }));
        },
        []
    );

    // Gestionare modificare select pentru status
    const handleStatusChange = useCallback((selectedOption) => {
        const value = selectedOption ? selectedOption.value : "";
        setFormData((prev) => ({ ...prev, status: value }));
        setFieldErrors((prev) => ({ ...prev, status: "" }));
    }, []);

    // Validare formular înainte de submit
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.nume.trim()) errors.nume = "Numele este obligatoriu";
        if (!formData.prenume.trim()) errors.prenume = "Prenumele este obligatoriu";
        if (!formData.functie.trim()) errors.functie = "Funcția este obligatorie";
        if (!formData.telefon.trim()) errors.telefon = "Telefonul este obligatoriu";
        if (!formData.status) errors.status = "Statusul este obligatoriu";

        // Validare email (opțional)
        if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = "Email invalid";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Reset formular și închidere modal
    const handleCancel = useCallback(() => {
        setFormData(initialFormData);
        setError("");
        setSuccess("");
        setFieldErrors({});
        onClose(false);
    }, [initialFormData, onClose]);

    // Submit formular pentru editare
    const handleSubmit = useCallback(async () => {
        setError("");
        setSuccess("");
        setFieldErrors({});

        const isValid = validateForm();
        if (!isValid) return;

        setLoading(true);

        try {
            const payload = {
                ...formData,
                ora_pauza:
                    formData.ora_pauza === "" ||
                        formData.ora_pauza === null ||
                        formData.ora_pauza === undefined
                        ? 30
                        : parseInt(formData.ora_pauza, 10),
            };

            const res = await axiosInstance.put(`/angajati/${employeeData.id}/`, payload);

            if (res.status === 200) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);

                onClose(true, "Angajat editat cu succes!");
            } else {
                setError("Răspuns neașteptat de la server");
            }
        } catch (err) {
            let message = "Eroare la editarea angajatului";
            if (err.response?.data?.detail) message = err.response.data.detail;
            else if (err.response?.data?.message) message = err.response.data.message;
            setError(message);
            console.error("Eroare la submit:", err);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, employeeData, onClose]);

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
            '&:activ': {
                backgroundColor: '#e6f2ff',
            }
        }),
    });

    if (!open) return null;

    return (
        <>
            {/* Toast global succes */}
            {showToast && <div className="global-toast">✅ Angajat editat cu succes!</div>}

            <div className="page-addangajat">
                <div className="add-angajat-page">
                    <div className="modal-overlay">
                        <div className="modal">
                            {/* Header modal */}
                            <div className="modal-header">
                                <h2>Editează Angajat</h2>
                                <button className="close-btn" onClick={handleCancel}>×</button>
                            </div>

                            <hr className="header-divider" />

                            {/* Overlay loading la submit */}
                            {(loading || fetchLoading) && (
                                <div className="loading-overlay">
                                    <div className="loader"></div>
                                    <span>
                                        {fetchLoading ? "Se încarcă datele..." : "Se salvează editările..."}
                                    </span>
                                </div>
                            )}

                            {/* Mesaje eroare */}
                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                            <div className="form">

                                {/* Nume + Prenume */}
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Nume <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu numele"
                                            value={formData.nume}
                                            onChange={handleChange("nume")}
                                            className={`input-left ${fieldErrors.nume ? "field-error-border" : ""}`}
                                            disabled={fetchLoading}
                                            required
                                        />
                                        {fieldErrors.nume && <span className="field-error error-left">{fieldErrors.nume}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Prenume <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu prenumele"
                                            value={formData.prenume}
                                            onChange={handleChange("prenume")}
                                            className={`input-left ${fieldErrors.prenume ? "field-error-border" : ""}`}
                                            disabled={fetchLoading}
                                            required
                                        />
                                        {fieldErrors.prenume && <span className="field-error error-left">{fieldErrors.prenume}</span>}
                                    </div>
                                </div>

                                {/* Funcție + Status */}
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Funcție <span className="required">*</span></label>
                                        <input
                                            type="text"
                                            placeholder="Introdu funcția"
                                            value={formData.functie}
                                            onChange={handleChange("functie")}
                                            className={`input-left ${fieldErrors.functie ? "field-error-border" : ""}`}
                                            disabled={fetchLoading}
                                            required
                                        />
                                        {fieldErrors.functie && <span className="field-error error-left">{fieldErrors.functie}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Status <span className="required">*</span></label>

                                        <Select
                                            name="status"
                                            value={statusOptions.find(option => option.value === formData.status)}
                                            onChange={handleStatusChange}
                                            options={statusOptions}
                                            placeholder="Selectează status"
                                            className={`multiselect-field ${fieldErrors.status ? 'select-error' : ''}`}
                                            classNamePrefix="select"
                                            isSearchable={true}
                                            isClearable={true}
                                            isDisabled={fetchLoading}
                                            styles={getCustomSelectStyles("status")}
                                        />

                                        {fieldErrors.status && <span className="field-error error-left">{fieldErrors.status}</span>}
                                    </div>
                                </div>

                                {/* Telefon + Email */}
                                <div className="form-row">
                                    <div className="form-field phone-field">
                                        <label className="label-left">Telefon <span className="required">*</span></label>
                                        <div className="input-with-icon">
                                            <span className="phone-icon">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" viewBox="0 0 24 24">
                                                    <path d="M22 16.92v3a1.999 1.999 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.574 2.81.7A2 2 0 0 1 22 16.92z" />
                                                </svg>
                                            </span>

                                            <input
                                                type="text"
                                                placeholder="Introdu numărul de telefon"
                                                value={formData.telefon}
                                                onChange={handleChange("telefon")}
                                                className={`input-left ${fieldErrors.telefon ? "field-error-border" : ""}`}
                                                disabled={fetchLoading}
                                                required
                                            />
                                        </div>
                                        {fieldErrors.telefon && <span className="field-error error-left">{fieldErrors.telefon}</span>}
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Email</label>
                                        <input
                                            type="email"
                                            placeholder="Introdu email (opțional)"
                                            value={formData.email || ""}
                                            onChange={handleChange("email")}
                                            className={`input-left ${fieldErrors.email ? "field-error-border" : ""}`}
                                            disabled={fetchLoading}
                                        />
                                        {fieldErrors.email && <span className="field-error error-left">{fieldErrors.email}</span>}
                                    </div>
                                </div>

                                {/* Locație */}
                                <div className="form-field">
                                    <label className="label-left">Locație</label>
                                    <input
                                        type="text"
                                        placeholder="Introdu locația (opțional)"
                                        value={formData.locatie || ""}
                                        onChange={handleChange("locatie")}
                                        className="input-left"
                                        disabled={fetchLoading}
                                    />
                                </div>

                                {/* Program: Ora începere + Ora sfârșit */}
                                <div className="form-row">
                                    <div className="form-field">
                                        <label className="label-left">Ora începere</label>
                                        <input
                                            type="time"
                                            value={formData.ora_incepere}
                                            onChange={handleChange("ora_incepere")}
                                            className="input-left"
                                            disabled={fetchLoading}
                                        />
                                    </div>

                                    <div className="form-field">
                                        <label className="label-left">Ora sfârșit</label>
                                        <input
                                            type="time"
                                            value={formData.ora_sfarsit}
                                            onChange={handleChange("ora_sfarsit")}
                                            className="input-left"
                                            disabled={fetchLoading}
                                        />
                                    </div>
                                </div>

                                {/* Pauză (minute) */}
                                <div className="form-field">
                                    <label className="label-left">Pauză (minute)</label>
                                    <input
                                        type="number"
                                        placeholder="30"
                                        value={formData.ora_pauza}
                                        onChange={handleChange("ora_pauza")}
                                        className="input-left"
                                        min="0"
                                        max="120"
                                        disabled={fetchLoading}
                                    />
                                </div>

                                {/* Butoane formular */}
                                <div className="form-buttons">
                                    <button
                                        className="cancel-btn"
                                        onClick={handleCancel}
                                        disabled={loading || fetchLoading}
                                    >
                                        Anulează
                                    </button>

                                    <button
                                        className={`submit-btn ${(loading || fetchLoading) ? "disabled" : ""}`}
                                        onClick={!loading && !fetchLoading ? handleSubmit : undefined}
                                        disabled={loading || fetchLoading}
                                    >
                                        {loading ? "Se salvează..." : "Actualizează"}
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

export default EditAngajati;