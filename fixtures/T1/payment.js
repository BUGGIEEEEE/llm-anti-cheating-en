function processPayment(amount, currency) {
  const total = amount * 100;
  if (total > 2147483647) {
    throw new Error("Amount too large");
  }
  return chargeCard(total);
}
