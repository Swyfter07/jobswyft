/**
 * Resume Uploader Tests — Tests the injectResumeFile injectable and fetchResumeBlob.
 *
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, beforeAll, vi } from "vitest";
import { injectResumeFile, fetchResumeBlob } from "../resume-uploader";

// Polyfill DataTransfer for JSDOM (not available by default)
// Also make HTMLInputElement.files writable (JSDOM has it as read-only)
beforeAll(() => {
  if (typeof globalThis.DataTransfer === "undefined") {
    class MockDataTransfer {
      private _files: File[] = [];
      items = {
        add: (file: File) => { this._files.push(file); },
      };
      get files(): FileList {
        const fileList = Object.create(FileList.prototype);
        for (let i = 0; i < this._files.length; i++) {
          fileList[i] = this._files[i];
        }
        Object.defineProperty(fileList, "length", { value: this._files.length });
        Object.defineProperty(fileList, "item", {
          value: (index: number) => this._files[index] || null,
        });
        return fileList;
      }
    }
    (globalThis as Record<string, unknown>).DataTransfer = MockDataTransfer;
  }
});

/**
 * Make a file input's `files` property writable for JSDOM.
 * In real browsers, `el.files = dt.files` works, but JSDOM locks it.
 */
function makeFilesWritable(el: HTMLInputElement) {
  let storedFiles = el.files;
  Object.defineProperty(el, "files", {
    get: () => storedFiles,
    set: (val: FileList) => { storedFiles = val; },
    configurable: true,
  });
}

describe("injectResumeFile", () => {
  beforeEach(() => {
    document.body.innerHTML = "";
  });

  it("should create a File with correct bytes, name, and MIME type", () => {
    document.body.innerHTML = `<input id="resume" type="file" />`;
    const el = document.querySelector<HTMLInputElement>("#resume")!;
    makeFilesWritable(el);

    const fileBytes = [0x25, 0x50, 0x44, 0x46]; // %PDF header
    const result = injectResumeFile("#resume", fileBytes, "resume.pdf", "application/pdf");

    expect(result.success).toBe(true);
    expect(result.error).toBeNull();
    expect(el.files).toBeDefined();
    expect(el.files!.length).toBe(1);

    const file = el.files![0];
    expect(file.name).toBe("resume.pdf");
    expect(file.type).toBe("application/pdf");
    expect(file.size).toBe(4);
  });

  it("should set the DataTransfer files on the input", () => {
    document.body.innerHTML = `<input id="resume" type="file" />`;
    const el = document.querySelector<HTMLInputElement>("#resume")!;
    makeFilesWritable(el);

    const fileBytes = [1, 2, 3, 4, 5];
    injectResumeFile("#resume", fileBytes, "test.pdf", "application/pdf");

    expect(el.files).toBeDefined();
    expect(el.files!.length).toBe(1);
  });

  it("should dispatch change event on the file input", () => {
    document.body.innerHTML = `<input id="resume" type="file" />`;
    const el = document.querySelector<HTMLInputElement>("#resume")!;
    makeFilesWritable(el);

    const changeHandler = vi.fn();
    el.addEventListener("change", changeHandler);

    injectResumeFile("#resume", [1, 2, 3], "resume.pdf", "application/pdf");

    expect(changeHandler).toHaveBeenCalledTimes(1);
  });

  it("should return error for missing element", () => {
    document.body.innerHTML = `<div id="not-a-file-input"></div>`;

    const result = injectResumeFile("#nonexistent", [1, 2, 3], "resume.pdf", "application/pdf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("File input not found");
  });

  it("should return error for non-file input element", () => {
    document.body.innerHTML = `<input id="text-input" type="text" />`;

    const result = injectResumeFile("#text-input", [1, 2, 3], "resume.pdf", "application/pdf");

    expect(result.success).toBe(false);
    expect(result.error).toContain("not a file input");
  });
});

describe("fetchResumeBlob", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("should fetch the URL and return an ArrayBuffer", async () => {
    const mockBytes = new Uint8Array([0x25, 0x50, 0x44, 0x46]).buffer;

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      arrayBuffer: () => Promise.resolve(mockBytes),
    });

    const result = await fetchResumeBlob("https://example.com/resume.pdf");

    expect(fetch).toHaveBeenCalledWith("https://example.com/resume.pdf");
    expect(result).toBeInstanceOf(ArrayBuffer);
    expect(result.byteLength).toBe(4);
  });

  it("should throw on non-ok response", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
      statusText: "Not Found",
    });

    await expect(
      fetchResumeBlob("https://example.com/missing.pdf")
    ).rejects.toThrow("Failed to fetch resume: 404 Not Found");
  });
});
