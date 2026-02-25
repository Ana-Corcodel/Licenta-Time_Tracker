import React, { useMemo } from "react";
import "./Acasa.css";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

export default function Acasa() {
  // Date demo (înlocuiește cu date reale din backend)
  const data = useMemo(
    () => [
      { zi: "Lun", ore: 6.5 },
      { zi: "Mar", ore: 7.0 },
      { zi: "Mie", ore: 8.0 },
      { zi: "Joi", ore: 5.5 },
      { zi: "Vin", ore: 7.5 },
      { zi: "Sâm", ore: 2.0 },
      { zi: "Dum", ore: 0.0 },
    ],
    []
  );

  const totalOre = useMemo(
    () => data.reduce((acc, x) => acc + (x.ore || 0), 0),
    [data]
  );
  const mediaOre = useMemo(() => totalOre / data.length, [totalOre, data.length]);

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
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="zi" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${Number(value).toFixed(1)} h`, "Ore"]}
                labelFormatter={(label) => `Zi: ${label}`}
              />
              <Bar dataKey="ore" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}