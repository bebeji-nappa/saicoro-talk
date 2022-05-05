import React from "react";
import { Dice } from "./Dice";
import { createRoot } from 'react-dom/client';
import "./main.css"

const container = document.getElementById('root');
const root = createRoot(container);
root.render(<Dice />);
