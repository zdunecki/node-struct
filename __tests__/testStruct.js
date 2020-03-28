const struct = require("../lib/struct");

//TODO: more tests
test("test struct", () => {
  const Product = struct({
    FirstName: `mysql:"first_name" json:"firstName"`
  });

  const firstName = "First Name";

  const product = Product({
    FirstName: firstName
  });

  const product2 = Product(`{"firstName": "${firstName}"}`);

  expect(product.FirstName).toBe(firstName);
  expect(product2.FirstName).toBe(firstName);
});
