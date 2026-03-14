module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      webpackConfig.ignoreWarnings = [
        {
          module: /react-datepicker/,
        },
      ];
      return webpackConfig;
    },
  },
};