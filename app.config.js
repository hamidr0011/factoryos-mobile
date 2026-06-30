const appJson = require("./app.json");

module.exports = ({ config }) => {
  const expo = {
    ...config,
    ...appJson.expo,
  };

  if (process.env.NODE_ENV !== "production") {
    delete expo.owner;
    if (expo.extra?.eas) {
      expo.extra = {
        ...expo.extra,
      };
      delete expo.extra.eas;
    }
  }

  return expo;
};
