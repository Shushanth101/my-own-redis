const mongoose = require("mongoose")
const { list } = require("../datastructures")

const listSchema =  new mongoose.Schema({
    name:{type:String,require:true,index:true},
    item :{type:mongoose.Schema.Types.Mixed,require:true},
    order:{type:Number,require:true}
},{timestamps:true})

const listModel = mongoose.model("list",listSchema)

module.exports = listModel