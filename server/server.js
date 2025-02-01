const express = require("express");
const cors = require("cors");
const path = require("path");
const routes = require("./routes");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(cors());

// Servir arquivos estáticos da pasta "public"
app.use(express.static(path.join(__dirname, "../public")));

// Usar as rotas separadas
app.use("/api", routes);

app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando na porta ${PORT}`);
});
