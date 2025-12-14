import React from 'react';
import ReactDOM from 'react-dom/client';
//import { BrowserRouter, unstable_setRouterFutureFlags } from 'react-router-dom';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './globals.css';

// ✅ Opt-in to React Router v7 behavior early
/*
unstable_setRouterFutureFlags({
  v7_startTransition: true,
});
*/

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);