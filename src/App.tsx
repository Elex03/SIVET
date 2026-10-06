import AppRouter from "./shared/routes/router";

import { AuthProvider } from "./shared/context/AuthContext";
import ConfirmationProvider from './shared/context/ConfirmationProvider';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import "./shared/styles/shared.css";

const App = () => {
  return (
    <AuthProvider>
      <ConfirmationProvider><AppRouter /></ConfirmationProvider>
      <ToastContainer position="top-right" autoClose={4500} limit={3} closeOnClick pauseOnHover pauseOnFocusLoss newestOnTop theme="light" />
    </AuthProvider>
  );
};

export default App;
