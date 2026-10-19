require("dotenv").config();
const http = require("http");
const express = require("express");
const cors = require("cors");
const { Server } = require("socket.io");
const pool = require("./db");

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
    socket.on("room:join", async (data)=>{
        const roomId = data.roomId?.trim();
        if (!socket.username) {
            socket.emit("chat:error", {
                message: "Identify yourself before joining a room."
            });
            return;
        }
        if (!roomId) {
            socket.emit("chat:error", {
                message: "Room ID is required."
            });
            return;
        }
        try {
            if (socket.currentRoom) {
                await socket.leave(socket.currentRoom);
            }
            await socket.join(roomId);
            console.log(`${socket.username} joined room ${roomId}`);
            const result = await pool.query(
                `SELECT id, room_id, username, message, created_at
                FROM chat_messages
                WHERE room_id = $1
                ORDER BY created_at ASC
                LIMIT 50`,
                [roomId]
            );
            socket.emit("room:history", result.rows.map(row => ({
                id: row.id,
                username: row.username,
                message: row.message,
                roomId: row.room_id,
                createdAt: row.created_at
            })));
        } catch (error) {
            console.error("Failed to load room history:", error.message);
            socket.emit("chat:error", {
                message: "Could not load chat history."
            });
        }
    });
    socket.on("chat:message", async (data)=>{
        if (!socket.username) {
            socket.emit("chat:error", {
                message: "Identify yourself before joining a room."
            });
            return;
        }
        const {message,roomId}=data;
        if (!roomId || !socket.rooms.has(roomId)) {
            socket.emit("chat:error", {
                message: "Join the room before sending a message."
            });
            return;
        }
        if (!message){
            socket.emit("chat:error",{
                message: "Type a message."
            });
            return;
        }
        try {
            const result = await pool.query(
                `INSERT INTO chat_messages (room_id, username, message)
                VALUES ($1, $2, $3)
                RETURNING *`,
                [roomId, socket.username, message]
            );
            const savedMessage = result.rows[0];
            io.to(roomId).emit("chat:message", {
                id: savedMessage.id,
                username: savedMessage.username,
                message: savedMessage.message,
                roomId: savedMessage.room_id,
                createdAt: savedMessage.created_at
            });
        } catch (error) {
            console.error("Failed to save message:", error.message);

            socket.emit("chat:error", {
                message: "Your message could not be saved."
            });
        }
        
    })
    socket.on("disconnect",(reason)=>{
        console.log("Client disconnected: ",socket.id,reason);
    });
});

server.listen(PORT, () => {
    console.log(`HTTP + Socket.IO server running on port ${PORT}`);
});
