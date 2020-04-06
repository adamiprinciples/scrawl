const fs = require("fs");
const path = require("path");
const webpack = require("webpack");

const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require('terser-webpack-plugin');

const webpackDefine = require("./webpack.define");

const sourcePath = path.resolve("./src");
const outputPath = path.resolve("./www");

module.exports = ({ environment }) => {
  console.log("=================================");
  console.log(`ENVIRONMENT: ${environment}`);
  console.log("=================================");

  let mode = environment === "dev" ? "development" : "production";

  const config = {
    mode,
    optimization: {
      minimizer: [new TerserPlugin({
        cache: true,
        parallel: true
      })],
    },
    devServer: {
      contentBase: outputPath,
      compress: true,
      port: 3001,
      historyApiFallback: true,
      writeToDisk: true
    },
    entry: {
      app: path.join(sourcePath, "index.tsx")
    },
    output: {
      filename: "[name].js",
      path: outputPath,
      publicPath: "/"
    },
    resolve: {
      extensions: [".ts", ".tsx", ".js", ".scss"] // search for files ending with these extensions when importing
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          loader: "ts-loader", // compile typescript
        },
        {
          test: /\.(jpg|ttf|svg|woff2?|eot|png|mp4|mp3)$/, // add extensions for new file types here
          use: {
            loader: "file-loader", // copy files to proxy and update paths to be absolute
            options: {
              name: "[name].[ext]",
              outputPath: 'assets/',
              publicPath: "/assets",
              esModule: false
            }
          }
        },
        {
          test: /\.s?css$/,
          use: [
            mode === "dev" ? "style-loader" : MiniCssExtractPlugin.loader,
            "css-loader", // turn url() and @import calls into require
            {
              loader: "postcss-loader",
              options: {
                plugins: [require("autoprefixer")]
              }
            },
            "sass-loader" // compile sass
          ]
        },
        {
          test: /\.mjs$/,
          include: /node_modules/,
          type: "javascript/auto",
        }
      ]
    },
    plugins: [
      new MiniCssExtractPlugin({ filename: "[name].css" }),
      new HtmlWebpackPlugin({
        title: `React web boilerplate${environment !== "production" ? ` - ${environment}` : ""}`,
        template: path.join(sourcePath, "index.html.ejs"),
        files: {
          js: ["[name].js"],
          css: ["[name].css"],
          chunks: {
            head: {
              css: "[name].css"
            },
            main: {
              entry: "[name].js"
            }
          },
          excludeChunks: mode === "development" ? ["head"] : []
        }
      }),
      new webpack.DefinePlugin({
        APP_CONFIG: JSON.stringify(webpackDefine(environment)),
        'process.env.NODE_ENV': JSON.stringify(mode)
      })
    ]
  }

  // dev  setup
  if (environment === "dev") {
    config.devtool = "eval";
  }

  return config
}