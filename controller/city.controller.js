const cityService = require("../services/city.service")
async function getCities(req,res,next){
  try{
  const resp = await cityService.getCities(req)
  res.status(200).json(resp)
  }catch(err){
    res.status(500).send(err)
  }

}

module.exports.getCities = getCities