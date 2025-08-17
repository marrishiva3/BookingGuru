const citiesController = require("./controller/city.controller")
module.exports = (app)=>{
    app.get("/cities",citiesController.getCities)
}