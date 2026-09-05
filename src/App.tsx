import AppRouter from "./shared/routes/router";

import { AuthProvider } from "./shared/context/AuthContext";

import "./shared/styles/shared.css";

const App = () => {
  return (
    <AuthProvider>
      <AppRouter />
    </AuthProvider>
  );
};

export default App;