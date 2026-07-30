"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var react_1 = require("react");
var client_1 = require("react-dom/client");
var App_tsx_1 = require("./App.tsx");
require("./index.css");
var buffer_1 = require("buffer"); // 
window.Buffer = buffer_1.Buffer;
client_1.default.createRoot(document.getElementById('root')).render(<react_1.default.StrictMode>
    <App_tsx_1.default />
  </react_1.default.StrictMode>);
