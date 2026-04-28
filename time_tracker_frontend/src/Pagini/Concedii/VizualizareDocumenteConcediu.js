import React, { useMemo, useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import axiosInstance from "../../Config/axiosInstance";
import InsertDriveFileIcon from "@mui/icons-material/InsertDriveFile";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import DescriptionIcon from "@mui/icons-material/Description";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
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

const getIdValue = (valoare) => {
  if (!valoare) return "";
  if (typeof valoare === "object") return valoare.id || valoare.value || "";
  return valoare;
};

const VizualizareDocumenteConcediu = ({
  open,
  onClose,
  concediuData,
  onUploaded,
}) => {
  const [afiseazaGestionare, setAfiseazaGestionare] = useState(false);
  const [documenteEditabile, setDocumenteEditabile] = useState([]);
  const [files, setFiles] = useState([]);
  const [seIncarca, setSeIncarca] = useState(false);

  const documente = useMemo(() => {
    return extrageListaAttach(concediuData?.attach_files)
      .map((fisier, index) => normalizeazaAttachment(fisier, index))
      .filter(Boolean);
  }, [concediuData]);

  useEffect(() => {
    if (open) {
      setDocumenteEditabile(documente);
      setFiles([]);
      setAfiseazaGestionare(false);
      setSeIncarca(false);
    }
  }, [open, documente]);

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
    setAfiseazaGestionare(false);
    setDocumenteEditabile(documente);
    setFiles([]);
    onClose?.();
  }, [documente, onClose]);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      "application/pdf": [],
      "application/msword": [],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [],
      "image/jpeg": [],
      "image/png": [],
      "application/vnd.ms-excel": [],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [],
      "text/plain": [],
    },
    multiple: true,
    maxSize: 1024 * 1024 * 100,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        const tooLarge = rejectedFiles.find(
          (f) => f.errors?.[0]?.code === "file-too-large"
        );

        if (tooLarge) {
          alert(`Fișierul ${tooLarge.file.name} depășește 100MB`);
        }
      }

      if (acceptedFiles.length > 0) {
        setFiles((prev) => [...prev, ...acceptedFiles]);
      }
    },
  });

  const handleRemoveFileNou = useCallback((indexToRemove) => {
    setFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
  }, []);

  const handleRemoveDocumentExistent = useCallback((idDocument) => {
    setDocumenteEditabile((prev) =>
      prev.filter((document) => document.id !== idDocument)
    );
  }, []);

  const handleToggleGestionare = useCallback(() => {
    setAfiseazaGestionare((prev) => {
      const nouaValoare = !prev;

      if (!nouaValoare) {
        setDocumenteEditabile(documente);
        setFiles([]);
      }

      return nouaValoare;
    });
  }, [documente]);

  const handleUploadDocumente = useCallback(async () => {
    if (!concediuData?.id) {
      alert("Nu există concediu selectat.");
      return;
    }

    setSeIncarca(true);

    try {
      const formData = new FormData();

      formData.append("angajat", getIdValue(concediuData.angajat));
      formData.append("data_start", concediuData.data_start);
      formData.append("data_sfarsit", concediuData.data_sfarsit);
      formData.append("durata", String(concediuData.durata));
      formData.append("an_concediu", String(concediuData.an_concediu));
      formData.append("tip_concediu", getIdValue(concediuData.tip_concediu));

      documenteEditabile.forEach((attachment) => {
        if (attachment.id) {
          formData.append("keep_attachments", attachment.id);
        }
      });

      files.forEach((fisier) => {
        formData.append("attach", fisier);
      });

      await axiosInstance.put(`/api/concedii/${concediuData.id}/`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setFiles([]);
      setAfiseazaGestionare(false);
      onUploaded?.("Documentele au fost actualizate cu succes!");
    } catch (error) {
      console.error("Eroare la actualizarea documentelor:", error);
      alert(
        error?.response?.data?.detail ||
          error?.response?.data?.message ||
          "Nu s-au putut actualiza documentele."
      );
    } finally {
      setSeIncarca(false);
    }
  }, [concediuData, documenteEditabile, files, onUploaded]);

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
            {documenteEditabile.length === 0 ? (
              <div className="stare-goala-documente">
                Nu există documente încărcate pentru acest concediu.
              </div>
            ) : (
              <div className="lista-documente-concediu">
                {documenteEditabile.map((fisier) => (
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

                    {afiseazaGestionare && (
                      <button
                        type="button"
                        className="buton-stergere-document-existent"
                        onClick={() => handleRemoveDocumentExistent(fisier.id)}
                        title="Șterge document"
                      >
                        <DeleteIcon fontSize="small" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <div className="zona-adauga-documente-concediu">
              <button
                type="button"
                className="buton-adauga-documente-concediu"
                onClick={handleToggleGestionare}
              >
                {afiseazaGestionare ? "Renunță" : "Gestionează documente"}
              </button>

              {afiseazaGestionare && (
                <div className="dropzone-wrapper-documente">
                  <div {...getRootProps({ className: "dropzone-documente" })}>
                    <input {...getInputProps()} />

                    <div className="dropzone-content-documente">
                      <CloudUploadIcon style={{ fontSize: 40, color: "#888" }} />
                      <p>
                        {isDragActive
                          ? "Lasă fișierele aici..."
                          : "Trage fișierele aici sau apasă pentru selectare"}
                      </p>
                    </div>
                  </div>

                  {files.length > 0 && (
                    <div className="files-preview-documente">
                      <h4>Fișiere noi selectate ({files.length})</h4>

                      {files.map((file, index) => (
                        <div
                          key={`${file.name}-${index}`}
                          className="file-preview-documente"
                        >
                          <div className="file-info-documente">
                            {obtineIconFisier(file.name)}

                            <span className="file-name-documente" title={file.name}>
                              {file.name}
                            </span>

                            <span className="file-size-documente">
                              {(file.size / 1024).toFixed(1)} KB
                            </span>
                          </div>

                          <button
                            type="button"
                            className="remove-file-documente"
                            onClick={() => handleRemoveFileNou(index)}
                            title="Șterge fișier"
                          >
                            <DeleteIcon fontSize="small" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    className="buton-salveaza-documente"
                    onClick={handleUploadDocumente}
                    disabled={seIncarca}
                  >
                    {seIncarca ? "Se salvează..." : "Salvează modificările"}
                  </button>
                </div>
              )}
            </div>
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