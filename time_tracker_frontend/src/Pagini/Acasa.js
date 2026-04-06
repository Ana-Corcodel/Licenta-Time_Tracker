import React, { useEffect, useMemo, useState } from "react";
import "./Acasa.css";
import axiosInstance from "../Config/axiosInstance";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

const ZILE_SCURTE = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

const formateazaCheieData = (data) => {
  const an = data.getFullYear();
  const luna = String(data.getMonth() + 1).padStart(2, "0");
  const zi = String(data.getDate()).padStart(2, "0");
  return `${an}-${luna}-${zi}`;
};

const parseazaOre = (valoare) => {
  if (valoare == null || valoare === "") return 0;

  if (typeof valoare === "number") return valoare;

  const valoareParsata = parseFloat(String(valoare).replace(",", "."));
  return Number.isNaN(valoareParsata) ? 0 : valoareParsata;
};

export default function Acasa() {
  const [pontaje, setPontaje] = useState([]);
  const [seIncarca, setSeIncarca] = useState(true);

  useEffect(() => {
    const preiaPontaje = async () => {
      try {
        setSeIncarca(true);
        const raspuns = await axiosInstance.get("/pontaje/");
        const date = Array.isArray(raspuns.data) ? raspuns.data : raspuns.data?.results;
        setPontaje(date || []);
      } catch (eroare) {
        console.error("Eroare la încărcarea pontajelor:", eroare);
        setPontaje([]);
      } finally {
        setSeIncarca(false);
      }
    };

    preiaPontaje();
  }, []);

  const dateGrafic = useMemo(() => {
    const azi = new Date();
    azi.setHours(0, 0, 0, 0);

    const ultimeleSapteZile = [];

    for (let i = 6; i >= 0; i--) {
      const dataCurenta = new Date(azi);
      dataCurenta.setDate(azi.getDate() - i);

      ultimeleSapteZile.push({
        dataCompleta: new Date(dataCurenta),
        cheie: formateazaCheieData(dataCurenta),
        zi: ZILE_SCURTE[dataCurenta.getDay()],
        ore: 0,
      });
    }

    const mapareZile = {};
    ultimeleSapteZile.forEach((element) => {
      mapareZile[element.cheie] = element;
    });

    pontaje.forEach((pontaj) => {
      if (!pontaj.data) return;

      const dataPontaj = new Date(pontaj.data);
      dataPontaj.setHours(0, 0, 0, 0);

      const cheie = formateazaCheieData(dataPontaj);

      if (mapareZile[cheie]) {
        mapareZile[cheie].ore += parseazaOre(pontaj.ore_lucrate);
      }
    });

    return ultimeleSapteZile;
  }, [pontaje]);

  const totalOre = useMemo(() => {
    return dateGrafic.reduce((acumulator, element) => acumulator + (element.ore || 0), 0);
  }, [dateGrafic]);

  const mediaOre = useMemo(() => {
    return dateGrafic.length ? totalOre / dateGrafic.length : 0;
  }, [totalOre, dateGrafic.length]);

  return (
    <div className="pagina-acasa">
      <h1>Bun venit în aplicația TimeTracker!</h1>
      <p>Această aplicație este concepută pentru a vă eficientiza pontajul de zi cu zi.</p>

      <div className="card-acasa">
        <div className="antet-card-acasa">
          <div>
            <h2>Ore lucrate (ultimele 7 zile)</h2>
            <p className="text-estompat">
              Total: <b>{totalOre.toFixed(1)}h</b> • Medie: <b>{mediaOre.toFixed(1)}h/zi</b>
            </p>
          </div>
        </div>

        <div className="grafic-acasa">
          {seIncarca ? (
            <div className="incarcare-acasa">Se încarcă datele...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dateGrafic} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zi" />
                <YAxis />
                <Tooltip
                  formatter={(valoare) => [`${Number(valoare).toFixed(1)} h`, "Ore"]}
                  labelFormatter={(eticheta, payload) => {
                    if (payload && payload.length > 0) {
                      const element = payload[0].payload;
                      return `${eticheta} - ${element.cheie}`;
                    }
                    return `Zi: ${eticheta}`;
                  }}
                />
                <Bar dataKey="ore" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}