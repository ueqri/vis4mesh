const HtmlWebpackPlugin = require("html-webpack-plugin");
const path = require("path");

module.exports = {
  // merge `production` and `development`, since there is no need to optimize
  // frontend packing and we would preserve debug mode for users
  mode: "none",
  entry: {
    index: "./src/index.ts",
  },
  devtool: "inline-source-map",
  devServer: {
    static: "./dist",
    port: 1234,
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
      {
        test: /\.s[ac]ss$/i,
        use: [
          "style-loader", // creates `style` nodes from JS strings
          "css-loader", // translates CSS into CommonJS
          "sass-loader", // compiles Sass to CSS
        ],
      },
      {
        test: /\.(woff(2)?|eot|ttf|otf|svg|)$/, // fonts and SVGs
        type: "asset/inline",
      },
    ],
  },
  resolve: {
    extensions: [".ts", ".js"],
    alias: {
      controller: path.resolve(__dirname, "./src/controller"),
      data: path.resolve(__dirname, "./src/data"),
      display: path.resolve(__dirname, "./src/display"),
      widget: path.resolve(__dirname, "./src/widget"),
      global: path.resolve(__dirname, "./src/global"),
      event: path.resolve(__dirname, "./src/event"),
      topbar: path.resolve(__dirname, "./src/topbar"),
      timebar: path.resolve(__dirname, "./src/timebar"),
      filterbar: path.resolve(__dirname, "./src/filterbar"),
    },
  },
  output: {
    filename: "[name].bundle.js",
    path: path.resolve(__dirname, "dist"),
    // publicPath: "/",
    clean: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, "public", "index.html"),
    }),
  ],
};
