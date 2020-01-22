import { app } from "./app";

app.init().then(port =>
    console.log(`🚀  app listening at port ${port}`)
)