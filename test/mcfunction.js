const assert = require("assert");
const { McFunction, DifficultyCommand } = require("..");

describe("McFunction", function () {
  const cmd = new DifficultyCommand("peaceful");

  describe("constructor", function () {
    it("should accept just a string as parameter", function () {
      assert.doesNotThrow(() => new McFunction("foo"));
    });

    it("should accept an options object", function () {
      assert.doesNotThrow(() => new McFunction("foo", {}));
    });

    it("should accept an options object containing a list of commands", function () {
      assert.doesNotThrow(() => new McFunction("foo", { commands: [cmd] }));
    });

    it("should accept an options object containing an iterator of commands", function () {
      function* gen() {
        yield cmd;
      }
      assert.doesNotThrow(() => new McFunction("foo", { commands: gen() }));
    });

    it("should accept a function", function () {
      assert.doesNotThrow(() => new McFunction(() => {}));
    });

    it("should accept a function and a name", function () {
      assert.doesNotThrow(() => new McFunction(() => {}, { name: "foo" }));
    });
  });
});
