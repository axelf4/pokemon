const path = require('path');

module.exports = {
	entry: ["babel-polyfill", "./src/main.js"],
	resolve: {
		root: [
			path.resolve('./src'),
			path.resolve('./glsl'),
		],
	},
	output: {
		// path: path.join(__dirname, 'build'),
		path: __dirname,
		filename: "bundle.js",
	},
	devtool: "source-map",
	module: {
		loaders: [
		{
			test: /\.js$/,
			exclude: /(node_modules|bower_components)/,
			loader: "babel",
			query: { presets: ["es2015"] }
		},
		{ test: /\.glsl$/, loader: "webpack-glsl" },
		{ test: /BitSetModule/, loader: "exports?BitSetModule" },
		{ test: /fowl/, loader: "imports?BitsetModule=BitSetModule!exports?fowl" },
		{ test: /flex\.js/, loader: "exports?flex" },
		]
	}
};
