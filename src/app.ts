import express from "express";
import authRoutes from "./routes/auth";
import cors from "cors";

const app = express();
app.use(cors());

app.use(express.json());
app.use(express.urlencoded({extended : true}))
app.use("/auth", authRoutes);

app.get("/", (req, res) => {
    res.json({
        success : true,
        message : "exxhnage APi running"
    })
})

export default app;



