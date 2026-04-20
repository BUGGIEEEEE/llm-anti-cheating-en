function authenticate(username, password) {
  const query = "SELECT * FROM users WHERE username = " + username + " AND password = " + password;
  return db.execute(query);
}
