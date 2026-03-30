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

const formatDateKey = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseOre = (value) => {
  if (value == null || value === "") return 0;

  if (typeof value === "number") return value;

  const parsed = parseFloat(String(value).replace(",", "."));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export default function Acasa() {
  const [pontaje, setPontaje] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPontaje = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get("/pontaje/");
        const data = Array.isArray(res.data) ? res.data : res.data?.results;
        setPontaje(data || []);
      } catch (error) {
        console.error("Eroare la încărcarea pontajelor:", error);
        setPontaje([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPontaje();
  }, []);

  const data = useMemo(() => {
    const azi = new Date();
    azi.setHours(0, 0, 0, 0);

    const ultimele7Zile = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(azi);
      d.setDate(azi.getDate() - i);

      ultimele7Zile.push({
        fullDate: new Date(d),
        key: formatDateKey(d),
        zi: ZILE_SCURTE[d.getDay()],
        ore: 0,
      });
    }

    const mapZile = {};
    ultimele7Zile.forEach((item) => {
      mapZile[item.key] = item;
    });

    pontaje.forEach((p) => {
      if (!p.data) return;

      const dataPontaj = new Date(p.data);
      dataPontaj.setHours(0, 0, 0, 0);

      const key = formatDateKey(dataPontaj);

      if (mapZile[key]) {
        mapZile[key].ore += parseOre(p.ore_lucrate);
      }
    });

    return ultimele7Zile;
  }, [pontaje]);

  const totalOre = useMemo(() => {
    return data.reduce((acc, x) => acc + (x.ore || 0), 0);
  }, [data]);

  const mediaOre = useMemo(() => {
    return data.length ? totalOre / data.length : 0;
  }, [totalOre, data.length]);

  return (
    <div className="pagina-acasa">
      <h1>Bun venit în aplicația TimeTracker!</h1>
      <p>Această aplicație este concepută pentru a vă eficientiza pontajul de zi cu zi.</p>

      <div className="acasa-card">
        <div className="acasa-card-header">
          <div>
            <h2>Ore lucrate (ultimele 7 zile)</h2>
            <p className="muted">
              Total: <b>{totalOre.toFixed(1)}h</b> • Medie: <b>{mediaOre.toFixed(1)}h/zi</b>
            </p>
          </div>
        </div>

        <div className="acasa-chart">
          {loading ? (
            <div className="acasa-loading">Se încarcă datele...</div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="zi" />
                <YAxis />
                <Tooltip
                  formatter={(value) => [`${Number(value).toFixed(1)} h`, "Ore"]}
                  labelFormatter={(label, payload) => {
                    if (payload && payload.length > 0) {
                      const item = payload[0].payload;
                      return `${label} - ${item.key}`;
                    }
                    return `Zi: ${label}`;
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