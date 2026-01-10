const mongoose = require("mongoose")

const KVPSchema = new mongoose.Schema({
    key:{type:String, require:true,index:true},
    value:{type:mongoose.Schema.Types.Mixed,require:true}
},{timestamps:true})

const KVP = mongoose.model("KVP",KVPSchema)

module.exports = KVP 