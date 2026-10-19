const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
require("dotenv").config();

const PORT = process.env.PORT||5000;
const FRONTEND_URL=process.env.FRONTEND_URL;
const app = express();

app.use(cors());
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({status: "ok"});
});

const server = http.createServer(app);
const io = new Server(server,{
    cors: {
        origin: FRONTEND_URL
    }
});
io.on("connection",(socket)=>{
    console.log("Client connected:", socket.id);
    socket.emit("connected",{
        message:"Welcome to the chat server!"
    });
    socket.on("user:identify",(data)=>{
        const username = data.username?.trim();
        if(!username) return;
        socket.username=username;
        console.log(`${socket.id} identified as ${socket.username}`);
    })
    socket.on("room:join",(data)=>{
        socket.join(data.roomId);
        console.log(`${socket.username} Joined room ${data.roomId}`);
    });
    socket.on("chat:message",(data)=>{
        if (!socket.username) return;
        console.log("Received: ", data);
        io.to(data.roomId).emit("chat:message", {
            username:socket.username,
            message:data.message,
            roomId:data.roomId
        });
    })
    socket.on("disconnect",(reason)=>{
        console.log("Client disconnected: ",socket.id,reason);
    });
});

server.listen(PORT, () => {
    console.log(`HTTP + Socket.IO server running on port ${PORT}`);
});
