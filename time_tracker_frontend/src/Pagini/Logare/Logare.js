import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../Config/axiosInstance";

function Logare({ seteazaEsteAutentificat }) {
  const [email, setEmail] = useState("");
  const [parola, setParola] = useState("");
  const [eroare, setEroare] = useState("");

  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await axiosInstance.post("/api/logare/", {
        email: email,
        password: parola,
      });

      seteazaEsteAutentificat(true);
      navigate("/");
    } catch (err) {
      setEroare("Email sau parola greșite");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      <form onSubmit={handleLogin}>
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          type="password"
          placeholder="Parola"
          value={parola}
          onChange={(e) => setParola(e.target.value)}
        />
        <br /><br />

        <button type="submit">Login</button>
      </form>

      {eroare && <p style={{ color: "red" }}>{eroare}</p>}
    </div>
  );
}

export default Logare;