import fs from "fs";
import { task } from "hardhat/config";
import path from "path";

const directoryPath = path.join(__dirname, "..", "docs");

task("docs", "Additonal docs processing", async (_taskArgs) => {
  try {
    const files = await fs.promises.readdir(directoryPath);

    for (const file of files) {
      if (file.endsWith(".md")) {
        const fileNameWithoutExtension = path.parse(file).name;

        const filePath = path.join(directoryPath, file);
        let fileContent = (await fs.promises.readFile(filePath)).toString();

        const frontMatter = `---
layout: default
title: ${fileNameWithoutExtension}
nav_order: 2
---

`;

        fileContent = frontMatter + fileContent;
        await fs.promises.writeFile(filePath, fileContent);
      }
    }
  } catch (err) {
    console.log("Unable to scan directory: " + err);
  }
});
