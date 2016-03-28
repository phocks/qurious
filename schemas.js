// Define the schema
TestSchema = new SimpleSchema({
  name: {
    type: String,
    label: "Name",
    max: 10
  },
});

obj = {name: "Mistydsdddd"};

// isValid = TestSchema.namedContext("myContext").validate(obj);

// console.log(isValid);