module: {
  resolve: {
    // Add .ts and .tsx as a resolvable extension.
    extensions: [".ts", ".tsx", ".js"]
  }
  rules: [
    { 
      test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"
    }   
  ]
}