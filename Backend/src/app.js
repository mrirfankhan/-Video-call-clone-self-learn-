import express from "express";
import {createServer} from "node:http";
import cors from "cors";
import mongoose from "mongoose";
import { connectToServer } from "./controllers/socketManager.js";
import {userRouter} from "./routes/users.routes.js";

const app = express();
const server = createServer(app);
connectToServer(server);

app.set("port",(process.env.PORT || 8000))
app.set("mongo_user",(process.env.MONGO_USER || "mrirfanhack07_db_user"))
app.use(cors())
app.use(express.json())
app.use(express.urlencoded({limit:"40mb",extended:true}))
app.use("/api/v1/users",userRouter)

app.get("/home",(req,res)=>{
    return res.json({"hello":"world"})
})

const start=async()=>{
    mongoose.connect("mongodb+srv://mrirfanhack07_db_user:KSsJCpmkmbLZlwtm@video-call-system.v0ticc1.mongodb.net/").then(()=>{
        console.log("Connected to MongoDB");
    })
    server.listen(app.get("port"),()=>{
    console.log("Server is running on port")
    })

}


start()

