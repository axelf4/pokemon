const path = require('path');

module.exports = {
	entry: "./src/main.js",
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
		/*{
			test: /\.js$/,
			exclude: /(node_modules)/,
			loader: "babel",
			query: { presets: ["es2015"] }
		},*/
		{ test: /\.css$/, loader: "style!css" },
		{ test: /\.glsl$/, loader: "webpack-glsl" },
		{ test: /BitSetModule/, loader: "exports?BitSetModule" },
		{ test: /fowl/, loader: "imports?BitsetModule=BitSetModule!exports?fowl" },
		{ test: /flex\.js/, loader: "exports?flex" },
		]
	}
};
