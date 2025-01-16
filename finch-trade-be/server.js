import express, { json } from "express";
import cors from "cors";
import userRoutes from "./routes/userRoutes.js";
import tradeRoutes from "./routes/tradeRoutes.js";
const port = 5000;

const app = express();
app.use(json());
app.use(cors({ origin: "http://localhost:5173" }));

app.use("/api/users", userRoutes);
app.use("/api/trades", tradeRoutes);

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
