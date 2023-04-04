const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const path = require("path");
const express = require("express");
const bcrypt = require("bcrypt");
const app = express();
app.use(express.json());

const dbpath = path.join(__dirname, "userData.db");
let db;
const InitializeAndStartServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server is running on http://localhost:3000");
    });
  } catch (e) {
    console.log(`dbError ${e.message}`);
    process.exit(1);
  }
};
//server starting
InitializeAndStartServer();

//register user

const createUser = app.post("/register/", async (request, response) => {
  const { name, username, password, gender, location } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  const hashedPassword = await bcrypt.hash(password, 10);
  const dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    //user not in database
    if (password.length < 5) {
      //password lessthan 5 len
      response.status(400);
      response.send("Password is too short");
    } else {
      //new user
      const userEntry = `INSERT INTO user (username,name,password,gender,location) VALUES ('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      await db.run(userEntry);
      response.status(200);
      response.send("User created successfully");
    }
  } else {
    //user already exists
    response.status(400);
    response.send("User already exists");
  }
});

app.post("/login/", async (request, response) => {
  const { username, password } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  let dbUser = await db.get(selectUser);
  if (dbUser === undefined) {
    //if user not in database
    response.status(400);
    response.send("Invalid user");
  } else {
    //if user in database
    let passwordMatch = await bcrypt.compare(password, dbUser.password);
    if (passwordMatch) {
      //password is correct
      response.status(200);
      response.send("Login success!");
    } else {
      //wrong password
      response.status(400);
      response.send("Invalid password");
    }
  }
});

//update password

app.put("/change-password/", async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const selectUser = `SELECT * FROM user WHERE username='${username}';`;
  const dbUser = await db.get(selectUser);
  const oldpasswordMatch = await bcrypt.compare(oldPassword, dbUser.password);
  if (oldpasswordMatch === false) {
    response.status(400);
    response.send("Invalid current password");
  } else {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const hashednewpassword = await bcrypt.hash(newPassword, 10);
      const userPassword = `UPDATE user SET password='${hashednewpassword}' WHERE username='${username}';`;
      await db.run(userPassword);
      response.status(200);
      response.send("Password updated");
    }
  }
});
module.exports = createUser;
