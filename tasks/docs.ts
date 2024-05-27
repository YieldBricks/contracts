import fs from "fs";
import { task } from "hardhat/config";
import path from "path";

const directoryPath = path.join(__dirname, "..", "docs");
const indexPath = path.join(directoryPath, "Index.md");

task("docs-index", "Generates an Index for solidity-docgen docs", async (_taskArgs) => {
  console.log("Generating Index for solidity-docgen docs");

  console.log(directoryPath, indexPath);

  try {
    const files = await fs.promises.readdir(directoryPath);
    console.log("Reading directory: ", files);

    let indexContent = "# Index\n\n";

    files.forEach((file) => {
      if (file.endsWith(".md") && file !== indexPath) {
        const fileNameWithoutExtension = path.parse(file).name;
        indexContent += `- [${fileNameWithoutExtension}](./${file})\n`;
      }
    });

    console.log("Writing contents: ", indexContent);

    await fs.promises.writeFile(indexPath, indexContent);

    console.log("Successfully written to: ", indexPath);
  } catch (err) {
    console.log("Unable to scan directory: " + err);
  }
});
