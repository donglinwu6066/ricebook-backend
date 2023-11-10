module.exports = {
    // Other Jest configuration...
    reporters: [
      "default", // keep the default reporter for console output
      [
        "jest-junit", {
          outputDirectory: 'test_results', // or any directory you prefer
          outputName: 'junit.xml', // or any file name you prefer
        }
      ],
    ],
  };