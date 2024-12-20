export default [
  {
    test: "source",
    root: "./src",
    environment: "node",
    resolve: {
      alias: {
        "src/": new URL("./src/", import.meta.url).pathname,
      },
    },
  },
];
