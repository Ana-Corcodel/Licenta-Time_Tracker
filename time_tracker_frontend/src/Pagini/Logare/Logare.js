import axios from "axios";
import { useState } from "react";

function Logare({ seteazaEsteAutentificat }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      await axios.post(
        "http://127.0.0.1:8000/api/logare/",
        { email, password },
        { withCredentials: true }
      );

      seteazaEsteAutentificat(true);
      window.location.href = "/acasa";
    } catch (error) {
      console.error(error);
      alert("Email sau parola incorecte");
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />

      <input
        type="password"
        placeholder="Parola"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />

      <button type="submit">Login</button>
    </form>
  );
}

export default Logare;