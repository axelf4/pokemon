const path = require('path');

module.exports = {
	entry: ["babel-polyfill", "./src/main.js"],
	resolve: {
		modules: [
			path.join(__dirname, "src"),
			path.join(__dirname, "glsl"),
			"node_modules",
		]
	},
	output: {
		// path: path.join(__dirname, 'build'),
		path: __dirname,
		filename: "bundle.js",
	},
	devtool: "source-map",
	module: {
		rules: [
		{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				presets: ["env"]
			}
		},
		{ test: /\.glsl$/, loader: "webpack-glsl-loader" },
		{ test: /BitSetModule/, loader: "exports-loader?BitSetModule" },
		{
			test: /fowl/,
			loader: "imports-loader?BitsetModule=BitSetModule!exports-loader?fowl"
		},
		{ test: /flex\.js/, loader: "exports-loader?flex" },
		]
	}
};
