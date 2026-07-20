import { useState } from "react";
import { loginWithGoogle, loginWithEmail, registerWithEmail, authErrorMessage } from "../firebase";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleGoogle() {
    setError("");
    setBusy(true);
    try {
      await loginWithGoogle();
      // Al successo, l'app rileva il login e mostra la dashboard da sola.
    } catch (e) {
      setError(authErrorMessage(e.code));
    } finally {
      setBusy(false);
    }
  }

  async function handleEmail(e) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !password) {
      setError("Inserisci email e password.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await registerWithEmail(email.trim(), password);
      } else {
        await loginWithEmail(email.trim(), password);
      }
    } catch (e2) {
      setError(authErrorMessage(e2.code));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand">
          <span className="brand-mark">IL</span>
          <div>
            <div className="brand-title">InLab</div>
            <div className="brand-sub">Agenzia di comunicazione</div>
          </div>
        </div>

        <h2 className="login-title">{mode === "register" ? "Crea il tuo accesso" : "Accedi"}</h2>

        <button className="login-google" onClick={handleGoogle} disabled={busy}>
          <GoogleIcon />
          Accedi con Google
        </button>

        <div className="login-divider">
          <span>oppure</span>
        </div>

        <form onSubmit={handleEmail} className="login-form">
          <input
            className="login-input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            autoComplete="email"
          />
          <input
            className="login-input"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
          />
          <button className="login-submit" type="submit" disabled={busy}>
            {busy ? "Attendi…" : mode === "register" ? "Registrati" : "Entra"}
          </button>
        </form>

        {error && <div className="login-error">{error}</div>}

        <div className="login-switch">
          {mode === "register" ? (
            <>
              Hai già un accesso?{" "}
              <button type="button" onClick={() => { setMode("login"); setError(""); }}>
                Accedi
              </button>
            </>
          ) : (
            <>
              Prima volta?{" "}
              <button type="button" onClick={() => { setMode("register"); setError(""); }}>
                Crea un accesso
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}
