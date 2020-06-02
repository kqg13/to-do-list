var express           =     require("express"),
    app               =     express(),
    expressSanitizer  =     require("express-sanitizer"),
    bodyParser        =     require("body-parser"),
    methodOverride    =     require("method-override");

var mongoose          =     require("mongoose"),
    seedDB            =     require("./seeds");

var passport          =     require("passport"),
    LocalStrategy     =     require("passport-local"),
    middleware        =     require("./middleware"),
    flash             =     require("connect-flash");

var User              =     require("./models/user"),
    ToDo              =     require("./models/todo");

// DB setup
mongoose.set('useUnifiedTopology', true);
mongoose.set('useFindAndModify', false);
// mongoose.connect("mongodb://localhost/to-do", {useNewUrlParser: true});

// MongoDB Atlas
mongoose.connect("mongodb+srv://kedarg:<password>@cluster0-dxoty.mongodb.net/test?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useCreateIndex: true
}).then(() =>{
  console.log('Connected to DB!');
}).catch(err => {
  console.log('ERROR: ', err.message);
});
// Seed the database
// seedDB();

// EJS & other setup
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(expressSanitizer()); // sanitize create & updates
app.use(methodOverride("_method"));

// Expresss-session & passport config
app.use(require("express-session")({
    secret: "Ollie is the cutest cat",
    resave: false,
    saveUninitialized: false
}));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

// A middleware function that will be passed to every route
app.use((req, res, next) => {
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

// ========================================
// Index ROUTES
// ========================================
app.get("/", (req, res) => {
    res.redirect("/todos");
});

app.get("/todos", (req, res) => {
  if (req.isAuthenticated()) {
    ToDo.find({'author.username': req.user.username}, (err, allToDos) => {
      if (err) {
        console.log(err);
      } else {
        res.render("index", {todos: allToDos});
      }
    });
  } else {
    res.render("index");
  }
});

app.get("/save", middleware.isLoggedIn, (req, res) => {
  req.flash("success", "Your to-do list was saved!");
  res.redirect("/todos");
});

app.post("/todos", middleware.isLoggedIn, (req, res) => {
  var task = req.sanitize(req.body.todo.task);
  var author = {id: req.user._id, username: req.user.username}
  var newToDo = {toDo: task, isCompleted: false, author: author};

  if (task && task.length > 0) {
    ToDo.create(newToDo, (err, newlyCreated) => {
      if (err) {
        console.log(err);
      } else {
        res.redirect("/");
      }
    });
  } else {
    res.redirect("/");
  }
});

app.delete("/todos/:id", middleware.isLoggedIn, (req, res) => {
  ToDo.findByIdAndRemove(req.params.id, (err, removedTask) => {
    if (err) {
      res.redirect("/todos");
    } else {
      res.redirect("/todos");
    }
  });
});

app.put("/todos/:id", middleware.isLoggedIn, (req, res) => {
  var isCompleted = !(req.body.todo.comp == 'true')

  ToDo.findByIdAndUpdate(req.params.id, {$set: {"isCompleted": isCompleted}}, (err, todo) => {
    if (err) {
      console.log("DB did not update properly");
      res.redirect("/todos");
    } else {
      res.redirect("/todos");
    }
  });
});

// ========================================
// Auth ROUTES
// ========================================
app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/register", (req, res) => {
  res.render("register");
});

// Sign-up logic- passport called within route handler which gives us access
// to req and res objects through closure
app.post("/register", (req, res) => {
  var newUser = new User({username: req.body.username});
  User.register(newUser, req.body.password, (err, user) => {
    if (err) {
      req.flash("error", err.message);
      return res.render("register", {"error": err.message});
    }
    passport.authenticate("local")(req, res, () => {
      req.flash("success", "Successfully signed up " + req.body.username);
      res.redirect("/");
    });
  });
});

// Login logic - passport is used as route middleware
app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/",
    failureRedirect: "login"
  }), (req, res) => {
});

app.get("/logout", (req, res) => {
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/todos");
});

// ========================================
// Other
// ========================================
app.get("*", (req, res) => {
  res.send("<h1>Page not found!</h1>");
});

var port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log("The to-do Server has started!");
});
