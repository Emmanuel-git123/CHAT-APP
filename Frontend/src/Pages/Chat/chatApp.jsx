import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";

function chatApp() {
  const socketRef = useRef(null);

  const [status, setStatus] = useState("Disconnected");
  const [messages, setMessages] = useState([]);
  const [roomId, setRoomId] = useState("");
  const [currentRoom, setCurrentRoom] = useState("");
  const [input, setInput] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [username, setUsername] = useState("");

  useEffect(() => {
    const socket = io("http://localhost:8080");

    socketRef.current = socket;
    console.log(socket);
    socket.on("connect", () => {
      console.log("Socket.IO connected:", socket.id);
      setStatus("Connected");
  });
    socket.on("connected", (data) => {
      setMessages((previous) => [
        ...previous,
        {
          type: "system",
          message: data.message,
        },
      ]);
    });

    socket.on("chat:message", (data) => {
      setMessages((previous) => [
        ...previous,
        {
          type: "chat",
          id:data.id,
          username:data.username,
          message: data.message,
        },
      ]);
    });

    socket.on("room:history", (history) => {
      setMessages((previous) => [
        ...previous.filter((msg) => msg.type === "system"),
        ...history.map((msg) => ({
          type: "chat",
          id: msg.id,
          username: msg.username,
          message: msg.message,
        })),
      ]);
    });

    socket.on("disconnect", (reason) => {
      console.log("Disconnected:", reason);
      setStatus("Disconnected");
      toast.error("Connection lost. Reconnecting...");
    });

    socket.on("connect_error", (error) => {
      console.error("Connection error:", error.message);
      setStatus("Error");
      toast.error("Couldn't connect to the chat server.");
    });
    socket.on("chat:error", (data) => {
      toast.error(data.message);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const sendMessage = () => {
    if (!input.trim()){
      toast.error("Type a message first.");
      return;
    }

    if (!socketRef.current?.connected){
      toast.error("You're disconnected. Please wait for reconnection.");
      return;
    }

    socketRef.current.emit("chat:message", {
      message: input.trim(),
      roomId: currentRoom,
    });

    setInput("");
  };

  const createRoom = () => {
    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    if (!roomId.trim()) {
      toast.error("Please enter a room ID.");
      return;
    }
    if (!socketRef.current?.connected) {
      toast.error("You're disconnected. Please wait for reconnection.");
      return;
    }
    const user=username.trim();
    const room=roomId.trim();
    socketRef.current.emit("user:identify",{
      username:user
    })
    socketRef.current.emit("room:join", {
      roomId: room
    });
    setUsername("");
    setCurrentRoom(room);
    setRoomId("");
  };

  const joinRoom = () => {
    if (!username.trim()) {
      toast.error("Please enter a username.");
      return;
    }
    if (!joinRoomId.trim()) {
      toast.error("Please enter a room ID.");
      return;
    }
    if (!socketRef.current?.connected){
      toast.error("You're disconnected. Please wait for reconnection.");
      return;
    }
    const user=username.trim();
    const room=joinRoomId.trim();
    socketRef.current.emit("user:identify",{
      username:user
    })
    socketRef.current.emit("room:join", {
      roomId: room
    });
    setUsername("");
    setCurrentRoom(room);
    setJoinRoomId("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
      <Toaster
        toastOptions={{
          duration: 3000,
          style: {
            background: "#1e293b",
            color: "#f1f5f9",
            border: "1px solid #334155",
          },
        }}
      />
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Distributed Chat</h1>
            {currentRoom && (
              <p className="text-sm text-slate-400 mt-1">
                Room:{" "}
                <span className="text-slate-200 font-medium">{currentRoom}</span>
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className={`h-2.5 w-2.5 rounded-full ${status === "Connected" ? "bg-emerald-400": status === "Error"? "bg-red-400": "bg-slate-500"}`}/>
            <span className={status === "Connected"? "text-emerald-400": status === "Error"? "text-red-400": "text-slate-400"}>{status}</span>
          </div>
        </div>

        {currentRoom ? (
          <div className="flex flex-col flex-1 min-h-0">
            <div className="flex-1 overflow-y-auto p-6 space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-500">No messages yet.</div>
              ) : (
                messages.map((item) => (
                  <div key={item.id} className={`flex ${item.type === "system" ? "justify-center" : "justify-start"}`}>
                    <div className={item.type === "system"? "text-xs text-slate-500 italic": "max-w-[75%] bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5"}>
                      {item.type !== "system" && (
                        <p className="text-xs text-slate-400 mb-1">{item.username}</p>
                      )}
                      <p className="text-sm wrap-break-words">{item.message}</p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="border-t border-slate-800 p-4">
              <div className="flex gap-3">
                <input 
                  value={input}
                  onChange={(event) => setInput(event.target.value)} 
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      sendMessage();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                />

                <button onClick={sendMessage} className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 rounded-xl font-medium text-sm transition">Send</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8">

              <div className="text-center">
                <h2 className="text-2xl font-bold">Join a conversation</h2>
                <p className="text-sm text-slate-400 mt-2">Create a room or join an existing one.</p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Enter Username</label>

                <div className="flex gap-3">
                  <input
                    value={username}
                    onChange={(event) => setUsername(event.target.value)}
                    placeholder="e.g. Michael Jackson"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Create Room</label>

                <div className="flex gap-3">
                  <input
                    value={roomId}
                    onChange={(event) => setRoomId(event.target.value)}
                    placeholder="e.g. room-123"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  />

                  <button onClick={createRoom} className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 rounded-xl font-medium text-sm transition">Create</button>
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium text-slate-300">Join Room</label>

                <div className="flex gap-3">
                  <input
                    value={joinRoomId}
                    onChange={(event) => setJoinRoomId(event.target.value)}
                    placeholder="e.g. room-123"
                    className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />

                  <button onClick={joinRoom} className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-xl font-medium text-sm transition">Join</button>
                </div>
              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default chatApp;