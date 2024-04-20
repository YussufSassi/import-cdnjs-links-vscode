// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
const fetch = require("node-fetch");
import type { Libraries } from "./interfaces/Libraries";
import type { LibraryData } from "./interfaces/LibraryData";
import type { FilesData } from "./interfaces/FilesData";
import { Recent } from "./interfaces/Recent";

export async function activate(context: vscode.ExtensionContext) {
  const res = (await fetch("https://api.cdnjs.com/libraries").then((res: any) =>
    res.json()
  )) as Libraries;
  const titles = res.results.map((i) => {
    return i.name;
  });
  let chosenLibraryData: LibraryData;
  let version: string;
  let disposable = vscode.commands.registerCommand(
    "auto-import-cdn-links.import",
    () => {
      let url: string;
      vscode.window
        .showQuickPick(titles, {
          title: "Search or pick a library",
          placeHolder: `There are ${res.available} libraries available`,
        })
        .then(async (choice) => {
          if (choice) {
            const libraryData = (await fetch(
              `https://api.cdnjs.com/libraries/${choice}`
            ).then((res: any) => res.json())) as LibraryData;
            chosenLibraryData = libraryData;
          }

          //VERSIONS
          let versions: vscode.QuickPickItem[] = chosenLibraryData.versions.map(
            (v) => {
              if (v === chosenLibraryData.version) {
                return { label: v, description: `Stable` };
              } else {
                return { label: v };
              }
            }
          );

          versions.reverse()[0].description = "Latest";
          vscode.window
            .showQuickPick(versions, {
              title: "Search or pick a version",
            })
            .then(async (v) => {
              if (v) {
                version = v.label;
              }

              const filesResponse = (await fetch(
                `https://api.cdnjs.com/libraries/${choice}/${version}`
              ).then((res: any) => res.json())) as FilesData;
              vscode.window
                .showQuickPick(filesResponse.files, {
                  title: "Pick a file",
                  placeHolder:
                    "Choose one of the following files. It's html tag will be inferred automatically.",
                })
                .then((f) => {
                  if (f) {
                    const fileType = f.split("/")[0];
                    url = `https://cdnjs.cloudflare.com/ajax/libs/${chosenLibraryData.name}/${version}/${f}`;

                    if (fileType === "css") {
                      url = `https://cdnjs.cloudflare.com/ajax/libs/${chosenLibraryData.name}/${version}/${f}`;
                      vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(
                          `<link rel="stylesheet" href=${url} integrity="${filesResponse.sri[f]}" crossorigin="anonymous" referrerpolicy="no-referrer"/>`
                        )
                      );
                    } else {
                      vscode.window.activeTextEditor?.insertSnippet(
                        new vscode.SnippetString(
                          `<script src="${url}" integrity="${filesResponse.sri[f]}" crossorigin="anonymous" referrerpolicy="no-referrer"></script>`
                        )
                      );
                    }
                    const lastUsed = context.globalState.get(
                      "libraries-used"
                    ) as Array<Object>;
                    if (lastUsed) {
                      if (lastUsed.length <= 15) {
                        lastUsed.push({
                          name: chosenLibraryData.name,
                          url: url,
                          integrity: filesResponse.sri[f],
                          type: fileType,
                          version: version,
                        });
                        context.globalState.update(
                          "libraries-used",
                          JSON.stringify(lastUsed)
                        );
                      }
                    } else {
                      context.globalState.update(
                        "libraries-used",
                        JSON.stringify([
                          {
                            name: chosenLibraryData.name,
                            url: url,
                            integrity: filesResponse.sri[f],
                            type: fileType,
                            version: version,
                          },
                        ])
                      );
                    }
                  }
                });
            });
        });
    }
  );
  context.subscriptions.push(disposable);
}

export function deactivate() {}
