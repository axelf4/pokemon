const path = require('path');
const webpack = require('webpack');

module.exports = {
	entry: ["@babel/polyfill", "./src/main.js"],
	resolve: {
		modules: [
			path.join(__dirname, "src"),
			"node_modules",
		]
	},
	devtool: "cheap-module-eval-source-map",
	devServer: {
		hot: true,
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
	],
	output: {
		// path: path.join(__dirname, 'build'),
		path: __dirname,
		filename: "bundle.js",
	},
	module: {
		rules: [
		{
			test: /\.js$/,
			include: path.resolve(__dirname, 'src'),
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				presets: ["@babel/preset-env"],
				plugins: ["@babel/plugin-syntax-dynamic-import"]
			}
		},
		{ test: /\.glsl$/, loader: "webpack-glsl-loader" },
		{ test: /BitSetModule/, loader: "exports-loader?BitSetModule" },
		{
			test: /fowl/,
			loader: "imports-loader?BitSetModule!exports-loader?fowl"
		},
		{ test: /flex\.js/, loader: "exports-loader?flex" },
		]
	}
};
