import React, { useMemo, useCallback } from "react";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import "./VizualizareDocumenteConcediu.css";

const extrageListaAttach = (attach) => {
  if (!attach) return [];
  if (Array.isArray(attach)) return attach;
  if (Array.isArray(attach.results)) return attach.results;
  return [];
};

const normalizeazaAttachment = (fisier, index) => {
  if (!fisier) return null;

  const rawUrl =
    fisier.file_url ||
    fisier.file ||
    fisier.url ||
    fisier.attachment ||
    fisier.document ||
    fisier.fisier ||
    null;

  const filename =
    fisier.filename ||
    (typeof rawUrl === "string" ? rawUrl.split("/").pop() : null) ||
    `Fisier ${index + 1}`;

  return {
    id: fisier.id || index,
    filename,
    url: rawUrl,
    size: fisier.file_size || fisier.size || 0,
    uploaded_at: fisier.uploaded_at || null,
  };
};

const estePdf = (filename = "") => filename.toLowerCase().endsWith(".pdf");

const obtineIconFisier = (filename = "") => {
  const extensie = filename.split(".").pop()?.toLowerCase() || "";

  if (extensie === "pdf") {
    return <PictureAsPdfIcon style={{ fontSize: 28, color: "#d32f2f" }} />;
  }

  if (["doc", "docx"].includes(extensie)) {
    return <DescriptionIcon style={{ fontSize: 28, color: "#1976d2" }} />;
  }

  if (["xls", "xlsx", "csv"].includes(extensie)) {
    return <DescriptionIcon style={{ fontSize: 28, color: "#2e7d32" }} />;
  }

  return <InsertDriveFileIcon style={{ fontSize: 28, color: "#757575" }} />;
};

const VizualizareDocumenteConcediu = ({
  open,
  onClose,
  concediuData,
}) => {
  const documente = useMemo(() => {
    return extrageListaAttach(concediuData?.attach_files)
      .map((fisier, index) => normalizeazaAttachment(fisier, index))
      .filter(Boolean);
  }, [concediuData]);

  const numeAngajat = useMemo(() => {
    const angajat = concediuData?.angajat;

    if (!angajat) {
      return concediuData?.angajat_label || "-";
    }

    if (typeof angajat === "object") {
      return (
        angajat.nume_complet ||
        `${angajat.nume || ""} ${angajat.prenume || ""}`.trim() ||
        concediuData?.angajat_label ||
        "-"
      );
    }

    return concediuData?.angajat_label || String(angajat);
  }, [concediuData]);

  const handleClose = useCallback(() => {
    onClose?.();
  }, [onClose]);

  const handleOpenFile = useCallback(async (fisier) => {
    if (!fisier?.url) {
      alert("Fișierul nu are URL disponibil.");
      return;
    }

    try {
      const response = await fetch(fisier.url);
      if (!response.ok) {
        throw new Error("Nu s-a putut prelua fișierul.");
      }

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (estePdf(fisier.filename)) {
        const newWindow = window.open();
        if (!newWindow) {
          alert("Popup blocat. Permite popup-urile pentru preview PDF.");
          URL.revokeObjectURL(objectUrl);
          return;
        }

        newWindow.document.write(`
          <html>
            <head>
              <title>${fisier.filename}</title>
              <style>
                body { margin: 0; height: 100vh; }
                embed { width: 100%; height: 100%; }
              </style>
            </head>
            <body>
              <embed src="${objectUrl}" type="application/pdf" />
            </body>
          </html>
        `);
        newWindow.document.close();

        setTimeout(() => URL.revokeObjectURL(objectUrl), 60000);
      } else {
        const a = document.createElement("a");
        a.href = objectUrl;
        a.download = fisier.filename || "document";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    } catch (error) {
      console.error("Eroare la deschiderea fișierului:", error);
      alert("Nu s-a putut deschide fișierul selectat.");
    }
  }, []);


  if (!open) return null;

  return (
    <div className="pagina-vizualizare-documente-concediu">
      <div className="overlay-modal-documente">
        <div className="fereastra-modal-documente">
          <div className="antet-modal-documente">
            <div>
              <h2>Documente concediu</h2>
              <p className="subtitlu-modal-documente">
                Angajat: <strong>{numeAngajat}</strong>
              </p>
            </div>

            <button className="buton-inchidere-documente" onClick={handleClose}>
              ×
            </button>
          </div>

          <hr className="separator-antet-documente" />

          <div className="continut-modal-documente">
            {documente.length === 0 ? (
              <div className="stare-goala-documente">
                Nu există documente încărcate pentru acest concediu.
              </div>
            ) : (
              <div className="lista-documente-concediu">
                {documente.map((fisier) => (
                  <div key={fisier.id} className="card-document-concediu">
                    <div className="stanga-document-concediu">
                      <div className="icon-document-concediu">
                        {obtineIconFisier(fisier.filename)}
                      </div>

                      <div className="info-document-concediu">
                        <button
                          type="button"
                          className="nume-document-concediu link-document-concediu"
                          title={fisier.filename}
                          onClick={() => handleOpenFile(fisier)}
                        >
                          {fisier.filename}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="footer-modal-documente">
            <button className="buton-inchide-footer-documente" onClick={handleClose}>
              Închide
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VizualizareDocumenteConcediu;