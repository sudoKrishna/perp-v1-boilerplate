import http from "http";
import { Server } from "socket.io";
import app from "./app";

const PORT = process.env.PORT || 3000;

const server  = http.createServer(app);

const io = new Server(server, {
   cors : {
      origin :"*",
   },
});
io.on('connection' , (socket) => {
   console.log(`USer connected ${socket.id}`)
})

io.on('disconnect',(socket) => {
   console.log(`user in disconnected ${socket.id}`)
} )

app.listen(PORT ,  () => {
   console.log("server is running ")
})

// import http from "http";
// import { Server } from "socket.io";

// import app from "./app";


// const PORT = process.env.PORT || 3000;


// const server = http.createServer(app);

// const io  = new Server(server,  {
//    cors : {
//       origin : "*",
//    },
// });

// io.on('connection' , (socket) => {
//    console.log(`User connected : ${socket.id}`);

//    socket.on("disconnect" , () => {
//       console.log(`User disconnected : ${socket.id}`);
//    })
// })

// server.listen(PORT,  () => {
//    console.log(`Server running on port ${PORT}`)
// })