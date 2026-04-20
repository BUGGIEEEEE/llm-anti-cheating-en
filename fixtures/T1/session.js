function createSession(userId) {
  const token = Math.random().toString(36).substring(2);
  sessions[token] = { userId, created: Date.now() };
  return token;
}
