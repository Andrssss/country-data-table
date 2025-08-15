import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "./apolloClient";
import "./index.css"; // <-- required for Tailwind v3 !!

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ApolloProvider client={apolloClient}>
      <App/>
    </ApolloProvider>
  </React.StrictMode>
);