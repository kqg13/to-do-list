require('dotenv').config();

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

// MongoDB Atlas

// <password>

// Use the environment variable for the MongoDB URI
const mongoURI = process.env.MONGODB_URI;

if (!mongoURI) {
    console.error("MONGODB_URI is not defined. Please check your .env file.");
    process.exit(1); // Exit the application if URI is not set
}

mongoose.connect(mongoURI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
})
.then(() => {
    console.log("MongoDB connected successfully");
})
.catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1); // Exit the application on connection error
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

app.get("/todos", async (req, res) => {
  if (req.isAuthenticated()) {
    try {
      const allToDos = await ToDo.find({ 'author.username': req.user.username });
      res.render("index", { todos: allToDos });
    } catch (err) {
      console.error(err);
      res.status(500).send("Internal Server Error");
    }
  } else {
    res.render("index");
  }
});


app.get("/save", middleware.isLoggedIn, (req, res) => {
  req.flash("success", "Your to-do list was saved!");
  res.redirect("/todos");
});

app.post("/todos", middleware.isLoggedIn, async (req, res) => {
  const task = req.sanitize(req.body.todo.task);
  const author = { id: req.user._id, username: req.user.username };
  const newToDo = { toDo: task, isCompleted: false, author };

  if (task && task.length > 0) {
    try {
      await ToDo.create(newToDo);
      res.redirect("/");
    } catch (err) {
      console.log(err);
      res.redirect("/");
    }
  } else {
    res.redirect("/");
  }
});


app.delete("/todos/:id", middleware.isLoggedIn, async (req, res) => {
  try {
    await ToDo.findByIdAndRemove(req.params.id);
    res.redirect("/todos");
  } catch (err) {
    console.error(err);
    res.redirect("/todos");
  }
});


app.put("/todos/:id", middleware.isLoggedIn, async (req, res) => {
  const isCompleted = !(req.body.todo.comp === 'true');

  try {
    await ToDo.findByIdAndUpdate(req.params.id, { $set: { isCompleted } });
    res.redirect("/todos");
  } catch (err) {
    console.log("DB did not update properly", err);
    res.redirect("/todos");
  }
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
app.post("/register", async (req, res) => {
    try {
        const newUser = new User({ username: req.body.username });
        await User.register(newUser, req.body.password);
        passport.authenticate("local")(req, res, () => {
            req.flash("success", "Successfully signed up " + req.body.username);
            res.redirect("/");
        });
    } catch (err) {
        req.flash("error", err.message);
        return res.render("register", { "error": err.message });
    }
});


// Login logic - passport is used as route middleware
app.post("/login", passport.authenticate("local",
  {
    successRedirect: "/",
    failureRedirect: "login"
  }), (req, res) => {
});

app.get("/logout", (req, res) => {
    req.logOut(err => {
        if (err) {
            console.error(err);
            return res.redirect("/todos");
        }
        req.flash("success", "Logged you out!");
        res.redirect("/todos");
    });
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
