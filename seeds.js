var mongoose = require("mongoose");
var ToDo = require("./models/todo");

var data = [
    {
      toDo: "Walk the dog",
      isCompleted: true
    },
    {
      toDo: "Call mom",
      isCompleted: false
    },
    {
      toDo: "Go for a run",
      isCompleted: false
    },
    {
      toDo: "Call dad",
      isCompleted: true
    }
];

function seedDB() {
  // Remove tasks
  ToDo.remove({}, (err) => {
    if (err) {
      console.log(err);
    }
    console.log("removed all tasks");

    data.forEach((seed)  => {
      ToDo.create(seed, (err, todo) => {
          if (err) {
            console.log(error);
          } else {
            todo.save();
            console.log("created new to-do-s");
          }
      });
    });
  });
}

module.exports = seedDB;
