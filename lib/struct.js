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
  const transformObject = d =>
    Object.entries(structDef).reduce((result, [key, value]) => {
      const newKey = findTagProp(tag, value);

      if (typeof d[key] !== "string" && d[key] !== undefined) {
        // deep
        if (d[key][tag]) {
          data[key] = d[key][tag]();
        }
      }

      return Object.assign({}, result, { [newKey]: d[key] });
    }, {});

  if (!Array.isArray(data)) {
    return transformObject(data);
  }

  return data.map(transformObject);
};

const isValid = (definition, data) => {
  const schema = Object.entries(definition).reduce((result, [key, value]) => {
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
  }, {});

  return Joi.object(schema).validate(data);
};

const backToStruct = (definition, tagKey, data) => {
  const mapJsonToStructDef = Object.entries(definition).reduce(
    (result, [key, value]) => {
      const findProp = findTagProp(tagKey, value);
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

  return transform("struct", mapJsonToStructDef, data);
};

//TODO: validation, deep keys, code refactor
const struct = definition => (data, format) => {
  const defaultTransform = tag => transform(tag, definition, data);

  if (isJSON(data)) {
    data = backToStruct(definition, "json", JSON.parse(data));
  } else if (format) {
    data = backToStruct(definition, format, data);
  } else {
    const objToStructFormat = d =>
      Object.keys(definition).reduce((result, key) => {
        return Object.assign({}, result, { [key]: d[key] });
      }, {});

    data = Array.isArray(data)
      ? data.map(objToStructFormat)
      : objToStructFormat(data);
  }

  const from = key => defaultTransform(key);

  if (Array.isArray(data)) {
    class Struct extends Array {
      isValid() {
        return isValid(definition, data);
      }
      from(key) {
        return from(key);
      }
    }

    return new Struct(...data);
  } else {
    class Struct {}

    return Object.assign(new Struct(), data, {
      isValid: () => isValid(definition, data),
      from
    });
  }
};

module.exports = struct;
