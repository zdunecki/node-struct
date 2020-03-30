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

test("test struct with basic validation", async () => {
  const Account = struct({
    ID: `mysql:"id" json:"id" valid:"string,required"`,
    UserAccountID: `mysql:"user_account_id" json:"userAccountId" valid:"string"`,
    Email: `mysql:"email" json:"email" valid:"string"`,
    FirstName: `"mysql":first_name"json:"firstName" valid:"string"`,
    LastName: `mysql:"last_name" json:"lastName" valid:"string"`,
    Password: `mysql:"password" json:"password" valid:"string"`,
    ModificationDate: `mysql:"modification_date" json:"modificationDate valid:"string"`,
    CreationDate: `mysql:"creation_date" json:"creationDate" valid:"string"`
  });

  const firstName = "First Name";

  const account = Account({
    ID: "test-id",
    FirstName: firstName
  });

  const account2 = Account(`{"firstName": "${firstName}"}`);

  const { error } = account.isValid();

  expect(account.FirstName).toBe(firstName);
  expect(account2.FirstName).toBe(firstName);
  expect(error).toBe(null);
});
