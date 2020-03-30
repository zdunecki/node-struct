const Joi = require("joi");

const removeQuotes = s => s.trim().replace(/\"/g, "");

const findTagProp = (key, value) => {
  const tagRegexp = new RegExp(`(${key}):"(.*?)"`);

  const match = value.match(tagRegexp);

  if (!match) {
    return;
  }

  let [, , props] = match;

  if (!props) {
    return;
  }

  return removeQuotes(props);
};

const isJSON = d => typeof d === "string" && (d[0] === "{" || d[0] === "[");

const transform = (tag, structDef, data) => {
  return Object.entries(structDef).reduce((result, [key, value]) => {
    const newKey = findTagProp(tag, value);

    if (typeof data[key] !== "string" && data[key] !== undefined) {
      data[key] = data[key][tag]();
    }

    return Object.assign({}, result, { [newKey]: data[key] });
  }, {});
};

//TODO: validation, deep keys, code refactor
const struct = definition => data => {
  const defaultTransform = tag => transform(tag, definition, data);

  if (isJSON(data)) {
    const mapJsonToStructDef = Object.entries(definition).reduce(
      (result, [key, value]) => {
        const findProp = findTagProp("json", value);
        const oldKey = key;
        if (findProp) {
          key = findProp;
        }

        return Object.assign({}, result, {
          [key]: `${value} struct:"${oldKey}"`
        });
      },
      {}
    );

    data = transform("struct", mapJsonToStructDef, JSON.parse(data));
  } else {
    data = Object.keys(definition).reduce((result, key) => {
      return Object.assign({}, result, { [key]: data[key] });
    }, {});
  }

  return Object.assign(Object.create(data), {
    json: () => {
      return defaultTransform("json");
    },
    mysql: () => {
      return defaultTransform("mysql");
    },
    isValid: () => {
      const schema = Object.entries(definition).reduce(
        (result, [key, value]) => {
          const props = findTagProp("valid", value);

          if (!props) {
            return result;
          }

          result[key] = props.split(",").reduce((acc, next) => {
            let [method, args = ""] = next.split("=");

            if (args) {
              args = (args.split(",") || []).map(arg => {
                const floatArg = parseFloat(arg);

                return isNaN(floatArg) ? arg : floatArg;
              });
            }

            return acc[method](...args);
          }, Joi);

          return result;
        },
        {}
      );

      return Joi.object(schema).validate(data);
    }
  });
};

module.exports = struct;
