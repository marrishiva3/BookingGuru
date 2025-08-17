const express = require("express");
const cors =  require("cors");
const dotenv = require("dotenv").config();
const app =  express();
app.use(cors());
app.use(express.json());
const port = process.env.PORT || 3000;
require("./route")(app);
app.listen(port,()=>{
    console.log(`Server is running on port ${port}`);
});