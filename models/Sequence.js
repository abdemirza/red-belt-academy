const mongoose = require("mongoose");

const SequenceSchema = new mongoose.Schema({
  name:{
      type:String,
  },
  value:{
      type:Number,
  }
});
const Sequence = mongoose.model("Sequence", SequenceSchema);
module.exports = Sequence;
