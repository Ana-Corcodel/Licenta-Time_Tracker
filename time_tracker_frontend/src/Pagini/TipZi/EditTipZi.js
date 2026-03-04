import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import "./AddTipZi.css"; // Folosește același CSS

const EditTipZi = ({ open, tipData, onClose }) => {
    // State-uri principale
    const [formData, setFormData] = useState({
        prescurtare: "",
        tip_zi: "",
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");
    const [showToast, setShowToast] = useState(false);
    const [fieldErrors, setFieldErrors] = useState({});

    // Inițializăm formularul cu datele existente când se deschide modalul
    useEffect(() => {
        if (open && tipData) {
            setFormData({
                prescurtare: tipData.prescurtare || "",
                tip_zi: tipData.tip_zi || "",
            });
            setError("");
            setSuccess("");
            setFieldErrors({});
        }
    }, [open, tipData]);

    // Gestionare modificare câmpuri
    const handleChange = useCallback((field) => (e) => {
        let value = e.target.value;

        // Pentru prescurtare, limităm la 10 caractere (conform modelului)
        if (field === "prescurtare" && value.length > 10) {
            value = value.slice(0, 10);
        }

        setFormData(prev => ({ ...prev, [field]: value }));
        setFieldErrors(prev => ({ ...prev, [field]: "" }));
    }, []);

    // Validare formular
    const validateForm = useCallback(() => {
        const errors = {};

        if (!formData.prescurtare.trim()) {
            errors.prescurtare = "Prescurtarea este obligatorie";
        } else if (formData.prescurtare.length > 10) {
            errors.prescurtare = "Prescurtarea nu poate depăși 10 caractere";
        }

        if (!formData.tip_zi.trim()) {
            errors.tip_zi = "Tipul zilei este obligatoriu";
        }

        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    }, [formData]);

    // Reset și închidere modal
    const handleCancel = useCallback(() => {
        setFormData({
            prescurtare: "",
            tip_zi: "",
        });
        setError("");
        setSuccess("");
        setFieldErrors({});
        onClose(false);
    }, [onClose]);

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
                prescurtare: formData.prescurtare.trim(),
                tip_zi: formData.tip_zi.trim(),
            };

            const res = await axiosInstance.put(`/tipuri-zile/${tipData.id}/`, payload);

            if (res.status === 200) {
                setShowToast(true);
                setTimeout(() => setShowToast(false), 4000);
                onClose(true, "Tip zi actualizat cu succes!");
            } else {
                setError("Răspuns neașteptat de la server");
            }
        } catch (err) {
            let message = "Eroare la actualizarea tipului de zi";
            
            if (err.response?.data?.detail) {
                message = err.response.data.detail;
            } else if (err.response?.data?.message) {
                message = err.response.data.message;
            } else if (err.response?.data) {
                // Afișăm erorile de validare detaliate
                const validationErrors = err.response.data;
                if (typeof validationErrors === 'object') {
                    // Verificăm dacă există eroare pentru câmpul prescurtare (unic)
                    if (validationErrors.prescurtare && Array.isArray(validationErrors.prescurtare)) {
                        message = validationErrors.prescurtare[0];
                        setFieldErrors(prev => ({ ...prev, prescurtare: validationErrors.prescurtare[0] }));
                    } else {
                        Object.keys(validationErrors).forEach(key => {
                            if (Array.isArray(validationErrors[key])) {
                                message = validationErrors[key][0];
                            }
                        });
                    }
                }
            }
            
            if (!fieldErrors.prescurtare) {
                setError(message);
            }
            
            console.error("Eroare la submit:", err);
        } finally {
            setLoading(false);
        }
    }, [formData, validateForm, tipData, onClose, fieldErrors]);

    if (!open) return null;

    return (
        <>
            {showToast && <div className="global-toast">✅ Tip zi actualizat cu succes!</div>}

            <div className="page-addtipzi">
                <div className="add-tipzi-page">
                    <div className="modal-overlay">
                        <div className="modal">
                            {/* Header modal */}
                            <div className="modal-header">
                                <h2>Editează Tip Zi</h2>
                                <button className="close-btn" onClick={handleCancel}>×</button>
                            </div>

                            <hr className="header-divider" />

                            {/* Overlay loading */}
                            {loading && (
                                <div className="loading-overlay">
                                    <div className="loader"></div>
                                    <span>Se actualizează tipul de zi...</span>
                                </div>
                            )}

                            {/* Mesaje eroare */}
                            {error && <div className="alert error">{error}</div>}
                            {success && <div className="alert success">{success}</div>}

                            <div className="form">
                                {/* Prescurtare */}
                                <div className="form-field">
                                    <label className="label-left">
                                        Prescurtare <span className="required">*</span>
                                        <span className="char-counter">
                                            ({formData.prescurtare.length}/10)
                                        </span>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Ex: LU, MA, MI, etc."
                                        value={formData.prescurtare}
                                        onChange={handleChange("prescurtare")}
                                        className={`input-left ${fieldErrors.prescurtare ? "field-error-border" : ""}`}
                                        maxLength="10"
                                        required
                                    />
                                    {fieldErrors.prescurtare && (
                                        <span className="field-error error-left">{fieldErrors.prescurtare}</span>
                                    )}
                                </div>

                                {/* Tip zi */}
                                <div className="form-field">
                                    <label className="label-left">Tip zi <span className="required">*</span></label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Lucru, Concediu, Sărbătoare legală"
                                        value={formData.tip_zi}
                                        onChange={handleChange("tip_zi")}
                                        className={`input-left ${fieldErrors.tip_zi ? "field-error-border" : ""}`}
                                        required
                                    />
                                    {fieldErrors.tip_zi && (
                                        <span className="field-error error-left">{fieldErrors.tip_zi}</span>
                                    )}
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

export default EditTipZi;