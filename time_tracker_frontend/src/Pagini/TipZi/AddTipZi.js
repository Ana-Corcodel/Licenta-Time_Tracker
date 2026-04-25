import React, { useState, useEffect, useCallback } from "react";
import axiosInstance from "../../Config/axiosInstance";
import "./AddTipZi.css";

const EditTipZi = ({ open, tipData, onClose }) => {
    const [dateFormular, setDateFormular] = useState({
        prescurtare: "",
        tip_zi: "",
    });

    const [seIncarca, setSeIncarca] = useState(false);
    const [eroare, setEroare] = useState("");
    const [succes, setSucces] = useState("");
    const [afiseazaToast, setAfiseazaToast] = useState(false);
    const [eroriCampuri, setEroriCampuri] = useState({});

    useEffect(() => {
        if (open && tipData) {
            setDateFormular({
                prescurtare: tipData.prescurtare || "",
                tip_zi: tipData.tip_zi || "",
            });
            setEroare("");
            setSucces("");
            setEroriCampuri({});
        }
    }, [open, tipData]);

    const gestioneazaSchimbarea = useCallback((camp) => (e) => {
        let valoare = e.target.value;

        if (camp === "prescurtare" && valoare.length > 10) {
            valoare = valoare.slice(0, 10);
        }

        setDateFormular((anterior) => ({
            ...anterior,
            [camp]: valoare,
        }));

        setEroriCampuri((anterior) => ({
            ...anterior,
            [camp]: "",
        }));
    }, []);

    const valideazaFormularul = useCallback(() => {
        const erori = {};

        if (!dateFormular.prescurtare.trim()) {
            erori.prescurtare = "Prescurtarea este obligatorie";
        } else if (dateFormular.prescurtare.length > 10) {
            erori.prescurtare = "Prescurtarea nu poate depăși 10 caractere";
        }

        if (!dateFormular.tip_zi.trim()) {
            erori.tip_zi = "Tipul zilei este obligatoriu";
        }

        setEroriCampuri(erori);
        return Object.keys(erori).length === 0;
    }, [dateFormular]);

    const gestioneazaAnularea = useCallback(() => {
        setDateFormular({
            prescurtare: "",
            tip_zi: "",
        });
        setEroare("");
        setSucces("");
        setEroriCampuri({});
        onClose(false);
    }, [onClose]);

    const gestioneazaTrimiterea = useCallback(async () => {
        setEroare("");
        setSucces("");
        setEroriCampuri({});

        if (!valideazaFormularul()) return;

        setSeIncarca(true);

        try {
            const payload = {
                prescurtare: dateFormular.prescurtare.trim(),
                tip_zi: dateFormular.tip_zi.trim(),
            };

            const raspuns = await axiosInstance.put(
                `/tipuri-zile/${tipData.id}/`,
                payload
            );

            if (raspuns.status === 200) {
                setAfiseazaToast(true);
                setTimeout(() => setAfiseazaToast(false), 4000);
                onClose(true, "Tip de zi actualizat cu succes!");
            } else {
                setEroare("Răspuns neașteptat de la server");
            }
        } catch (err) {
            let mesaj = "Eroare la actualizarea tipului de zi";

            if (err.response?.data?.detail) {
                mesaj = err.response.data.detail;
            } else if (err.response?.data?.message) {
                mesaj = err.response.data.message;
            } else if (err.response?.data) {
                const eroriValidare = err.response.data;

                if (typeof eroriValidare === "object") {
                    if (eroriValidare.prescurtare && Array.isArray(eroriValidare.prescurtare)) {
                        mesaj = eroriValidare.prescurtare[0];
                        setEroriCampuri((anterior) => ({
                            ...anterior,
                            prescurtare: eroriValidare.prescurtare[0],
                        }));
                    } else {
                        Object.keys(eroriValidare).forEach((cheie) => {
                            if (Array.isArray(eroriValidare[cheie])) {
                                mesaj = eroriValidare[cheie][0];
                            }
                        });
                    }
                }
            }

            setEroare(mesaj);
            console.error("Eroare la trimitere:", err);
        } finally {
            setSeIncarca(false);
        }
    }, [dateFormular, valideazaFormularul, tipData, onClose]);

    if (!open) return null;

    return (
        <>
            {afiseazaToast && (
                <div className="toast-global">✅ Tip de zi actualizat cu succes!</div>
            )}

            <div className="pagina-adaugare-tipzi">
                <div className="pagina-tipzi-adaugare">
                    <div className="suprapunere-modal">
                        <div className="modal">
                            <div className="antet-modal">
                                <h2>Editează Tip Zi</h2>
                                <button
                                    className="buton-inchidere"
                                    onClick={gestioneazaAnularea}
                                >
                                    ×
                                </button>
                            </div>

                            {seIncarca && (
                                <div className="suprapunere-incarcare">
                                    <div className="incarcator"></div>
                                    <span>Se actualizează tipul de zi...</span>
                                </div>
                            )}

                            {eroare && <div className="alerta eroare">{eroare}</div>}
                            {succes && <div className="alerta succes">{succes}</div>}

                            <div className="formular">
                                <div className="camp-formular">
                                    <label className="eticheta-stanga">
                                        Prescurtare <span className="obligatoriu">*</span>
                                        <span className="contor-caractere">
                                            ({dateFormular.prescurtare.length}/10)
                                        </span>
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Ex: CO"
                                        value={dateFormular.prescurtare}
                                        onChange={gestioneazaSchimbarea("prescurtare")}
                                        className={`input-stanga ${
                                            eroriCampuri.prescurtare ? "chenar-eroare-camp" : ""
                                        }`}
                                        maxLength="10"
                                        required
                                    />

                                    {eroriCampuri.prescurtare && (
                                        <span className="eroare-camp eroare-stanga">
                                            {eroriCampuri.prescurtare}
                                        </span>
                                    )}
                                </div>

                                <div className="camp-formular">
                                    <label className="eticheta-stanga">
                                        Tip zi <span className="obligatoriu">*</span>
                                    </label>

                                    <input
                                        type="text"
                                        placeholder="Ex: Concediu de odihnă"
                                        value={dateFormular.tip_zi}
                                        onChange={gestioneazaSchimbarea("tip_zi")}
                                        className={`input-stanga ${
                                            eroriCampuri.tip_zi ? "chenar-eroare-camp" : ""
                                        }`}
                                        required
                                    />

                                    {eroriCampuri.tip_zi && (
                                        <span className="eroare-camp eroare-stanga">
                                            {eroriCampuri.tip_zi}
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="butoane-formular">
                                <button
                                    className="buton-anulare"
                                    onClick={gestioneazaAnularea}
                                >
                                    Anulează
                                </button>

                                <button
                                    className={`buton-trimitere ${
                                        seIncarca ? "dezactivat" : ""
                                    }`}
                                    onClick={!seIncarca ? gestioneazaTrimiterea : undefined}
                                    disabled={seIncarca}
                                >
                                    {seIncarca ? "Se actualizează..." : "Actualizează"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditTipZi;