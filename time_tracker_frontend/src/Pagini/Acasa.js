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
  Cell,
} from "recharts";

const ZILE_SCURTE = ["Dum", "Lun", "Mar", "Mie", "Joi", "Vin", "Sâm"];

const formateazaCheieData = (data) => {
  const an = data.getFullYear();
  const luna = String(data.getMonth() + 1).padStart(2, "0");
  const zi = String(data.getDate()).padStart(2, "0");
  return `${an}-${luna}-${zi}`;
};

const formateazaDataScurta = (data) => {
  const ziSaptamana = ZILE_SCURTE[data.getDay()];
  const zi = String(data.getDate()).padStart(2, "0");
  const luna = String(data.getMonth() + 1).padStart(2, "0");
  return `${ziSaptamana} ${zi}.${luna}`;
};

const parseazaOre = (valoare) => {
  if (valoare == null || valoare === "") return 0;
  if (typeof valoare === "number") return valoare;

  const valoareParsata = parseFloat(String(valoare).replace(",", "."));
  return Number.isNaN(valoareParsata) ? 0 : valoareParsata;
};

const parseazaDataFaraTimezone = (dataText) => {
  if (!dataText) return null;

  const parti = String(dataText).split("-");
  if (parti.length !== 3) return null;

  const [an, luna, zi] = parti.map(Number);
  return new Date(an, luna - 1, zi);
};

const formateazaOreSiMinute = (valoare) => {
  const numar = Number(valoare || 0);

  const oreIntregi = Math.floor(numar);
  const minute = Math.round((numar - oreIntregi) * 60);

  if (minute === 60) {
    return `${String(oreIntregi + 1).padStart(2, "0")}:00`;
  }

  return `${String(oreIntregi).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
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
        cheie: formateazaCheieData(dataCurenta),
        eticheta: formateazaDataScurta(dataCurenta),
        dataCompleta: dataCurenta.toLocaleDateString("ro-RO"),
        ore: 0,
      });
    }

    const mapareZile = {};
    ultimeleSapteZile.forEach((zi) => {
      mapareZile[zi.cheie] = zi;
    });

    pontaje.forEach((pontaj) => {
      if (!pontaj.data) return;

      const dataPontaj = parseazaDataFaraTimezone(pontaj.data);
      if (!dataPontaj) return;

      const cheie = formateazaCheieData(dataPontaj);

      if (mapareZile[cheie]) {
        mapareZile[cheie].ore += parseazaOre(pontaj.ore_lucrate);
      }
    });

    return ultimeleSapteZile.map((zi) => ({
      ...zi,
      ore: Number(zi.ore.toFixed(2)),
    }));
  }, [pontaje]);

  const totalOre = useMemo(() => {
    return dateGrafic.reduce((total, element) => total + element.ore, 0);
  }, [dateGrafic]);

  const mediaOre = useMemo(() => {
    return dateGrafic.length ? totalOre / dateGrafic.length : 0;
  }, [totalOre, dateGrafic]);

  return (
    <div className="pagina-acasa">
      <h1>Bun venit în aplicația Sistem Pontaj!</h1>
      <p>Această aplicație este concepută pentru a vă eficientiza pontajul de zi cu zi.</p>

      <div className="card-acasa">
        <div className="antet-card-acasa">
          <h2>Ore lucrate în ultimele 7 zile</h2>
          <p className="text-estompat">
            Total: <b>{formateazaOreSiMinute(totalOre)}</b> • Medie:{" "}
            <b>{formateazaOreSiMinute(mediaOre)}</b>/zi
          </p>
        </div>

        <div className="grafic-acasa">
          {seIncarca ? (
            <div className="incarcare-acasa">Se încarcă datele...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={dateGrafic}
                margin={{ top: 10, right: 20, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="eticheta" />
                <YAxis tickFormatter={(valoare) => formateazaOreSiMinute(valoare)} />
                <Tooltip
                  formatter={(valoare) => [formateazaOreSiMinute(valoare), "Ore lucrate"]}
                  labelFormatter={(label, payload) => {
                    if (payload?.length) {
                      return `Data: ${payload[0].payload.dataCompleta}`;
                    }
                    return label;
                  }}
                />
                <Bar dataKey="ore" radius={[8, 8, 0, 0]}>
                  {dateGrafic.map((_, index) => (
                    <Cell key={index} fill="#006d83" />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}