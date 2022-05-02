import { FileWithDirectoryAndFileHandle } from "browser-fs-access";

export class FileLoader {
  dirEnrties: FileWithDirectoryAndFileHandle[];
  edgeFiles: File[];
  readonly dirRoot = "meshmetrics/";
  readonly dirEdges = this.dirRoot.concat("edge_prefix_sum/");

  // dirHandle: built by openDirectory() method supported by web-fs-access
  public constructor(dirHandle: FileWithDirectoryAndFileHandle[]) {
    this.edgeFiles = [];
    this.dirEnrties = dirHandle;
  }

  // getEdgeFiles: must be called and awaited before MeshInfo
  public async getEdgeFiles() {
    if (this.edgeFiles.length > 0) {
      return;
    }
    for (const entry of this.dirEnrties) {
      if (entry.webkitRelativePath.startsWith(this.dirEdges)) {
        if (entry.handle === undefined) {
          throw new Error("Unreachable code of build edgeFile[] object");
        }
        this.edgeFiles.push(await entry.handle.getFile());
      }
    }

    // make sure edge files are in order
    this.edgeFiles.sort((a, b) => {
      return this.getFilenameIndex(a.name) - this.getFilenameIndex(b.name);
    });

    // check the order of edge files
    // for(const file of this.edgeFiles) {
    //     console.log(file.name);
    // }
  }

  // getFileContent: expected to be called for three times (meta, flat, nodes)
  public async getFileContent(filename: string) {
    filename += ".json";
    for (const entry of this.dirEnrties) {
      if (entry.name === filename) {
        if (entry.handle === undefined) {
          throw new Error(filename + " has not been loaded");
        }
        let file = await entry.handle.getFile();
        return await file.text();
      }
    }
  }

  // ! getEdgeFileContent: idx should be limited to meta.elapse by caller
  public async getEdgeFileContent(idx: number) {
    if (this.edgeFiles.length <= idx) {
      // unreachable code
      throw new Error("Unreacheable! Edge Files are not loaded");
    }
    const content = await this.edgeFiles[idx].text();
    return content;
  }

  private getFilenameIndex(filename: string): number {
    return parseInt(filename.split(".")[0]);
  }
}
