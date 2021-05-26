const mongoose = require("mongoose");
const Document = require("./Document");

// mongoose.connect("mongodb://localhost/google-docs-clone", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
//   useFindAndModify: false,
//   useCreateIndex: true,
// })

mongoose
  .connect("mongodb://localhost/google-docs-clone", {
    useNewUrlParser: true,
    useUnifiedTopology: true 
  })
  .then(() => {
    const io = require("socket.io")(3001, {
      cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"],
      },
    });

    const defaultValue = "";

    io.on("connection", (socket) => {
      console.log("connected");
      socket.on("get-document", async (documentId) => {

        const document = await findOrCreateDocument(documentId);

        socket.join(documentId);
        socket.emit("load-document", document.data);

        socket.on("send-changes", (delta) => {
          socket.broadcast.to(documentId).emit("receive-changes", delta);
        });

        socket.on("save-document", async (data) => {
          await Document.findByIdAndUpdate(documentId, { data }).catch(
            (error) => {
              console.log(error);
            }
          );
        });
      });
    });

    async function findOrCreateDocument(id) {
      if (id == null) return;

      const document = await Document.findById(id).catch((err) => {
        console.log(err);
      });
      if (document) return document;
      return await Document.create({ _id: id, data: defaultValue });
    }
  }).catch(
    (err)=>{
      console.log(err)
    }
  );
