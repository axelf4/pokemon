const path = require('path'),
	webpack = require('webpack'),
	ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');

module.exports = {
	entry: ["@babel/polyfill", "./src/main.js"],
	resolve: {
		modules: [
			path.join(__dirname, "src"),
			"node_modules",
		],
		extensions: ['.wasm', '.mjs', '.js', '.json', '.ts'],
	},
	devtool: "source-map",
	devServer: {
		hot: true,
	},
	plugins: [
		new webpack.HotModuleReplacementPlugin(),
		new ForkTsCheckerWebpackPlugin(),
	],
	output: {
		// path: path.join(__dirname, 'build'),
		path: __dirname,
		filename: "bundle.js",
	},
	module: {
		rules: [
		{
			test: /\.(js|ts)$/,
			include: path.resolve(__dirname, 'src'),
			exclude: /(node_modules|bower_components)/,
			loader: "babel-loader",
			options: {
				presets: ["@babel/typescript", "@babel/preset-env"],
				plugins: ["@babel/plugin-syntax-dynamic-import", "@babel/plugin-proposal-class-properties"]
			}
		},
		{ test: /\.glsl$/, loader: "webpack-glsl-loader" },
		]
	}
};
