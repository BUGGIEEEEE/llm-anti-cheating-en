const dbConfig = {
  host: "localhost",
  user: "admin",
  password: "password123"
};
function connect() {
  return mysql.createConnection(dbConfig);
}
