import { Plug } from "../../plugos/plug.ts";
import {
  FileData,
  FileEncoding,
  SpacePrimitives,
} from "../../common/spaces/space_primitives.ts";
import { FileMeta } from "../../common/types.ts";
import { NamespaceOperation, PageNamespaceHook } from "./page_namespace.ts";

export class PlugSpacePrimitives implements SpacePrimitives {
  constructor(
    private wrapped: SpacePrimitives,
    private hook: PageNamespaceHook,
  ) {}

  performOperation(
    type: NamespaceOperation,
    pageName: string,
    ...args: any[]
  ): Promise<any> | false {
    for (const { operation, pattern, plug, name } of this.hook.spaceFunctions) {
      if (operation === type && pageName.match(pattern)) {
        return plug.invoke(name, [pageName, ...args]);
      }
    }
    return false;
  }

  async fetchFileList(): Promise<FileMeta[]> {
    const allFiles: FileMeta[] = [];
    for (const { plug, name, operation } of this.hook.spaceFunctions) {
      if (operation === "listFiles") {
        try {
          for (const pm of await plug.invoke(name, [])) {
            allFiles.push(pm);
          }
        } catch (e) {
          console.error("Error listing files", e);
        }
      }
    }
    const result = await this.wrapped.fetchFileList();
    for (const pm of result) {
      allFiles.push(pm);
    }
    return allFiles;
  }

  readFile(
    name: string,
    encoding: FileEncoding,
  ): Promise<{ data: FileData; meta: FileMeta }> {
    const result = this.performOperation("readFile", name);
    if (result) {
      return result;
    }
    return this.wrapped.readFile(name, encoding);
  }

  getFileMeta(name: string): Promise<FileMeta> {
    const result = this.performOperation("getFileMeta", name);
    if (result) {
      return result;
    }
    return this.wrapped.getFileMeta(name);
  }

  writeFile(
    name: string,
    encoding: FileEncoding,
    data: FileData,
    selfUpdate?: boolean,
  ): Promise<FileMeta> {
    const result = this.performOperation(
      "writeFile",
      name,
      encoding,
      data,
      selfUpdate,
    );
    if (result) {
      return result;
    }

    return this.wrapped.writeFile(name, encoding, data, selfUpdate);
  }

  deleteFile(name: string): Promise<void> {
    const result = this.performOperation("deleteFile", name);
    if (result) {
      return result;
    }
    return this.wrapped.deleteFile(name);
  }

  proxySyscall(plug: Plug<any>, name: string, args: any[]): Promise<any> {
    return this.wrapped.proxySyscall(plug, name, args);
  }

  invokeFunction(
    plug: Plug<any>,
    env: string,
    name: string,
    args: any[],
  ): Promise<any> {
    return this.wrapped.invokeFunction(plug, env, name, args);
  }
}