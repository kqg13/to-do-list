var mongoose = require("mongoose");

var ToDoSchema = new mongoose.Schema({
  toDo: String,
  author: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  "User"
    },
    username: String
  },
  isCompleted: Boolean
});

module.exports = mongoose.model("ToDo", ToDoSchema);
