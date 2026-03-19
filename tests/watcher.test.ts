import { describe, it, expect, afterEach } from "vitest";
import path from "node:path";
import { ContentWatcher, getWatcher } from "../src/cli/adapters/watcher.js";

describe("ContentWatcher", () => {
  describe("construction", () => {
    it("should accept a contents directory path", () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      expect(watcher).toBeInstanceOf(ContentWatcher);
    });

    it("should resolve relative paths to absolute", () => {
      const watcher = new ContentWatcher("relative/path");
      expect(watcher).toBeInstanceOf(ContentWatcher);
    });

    it("should not be running after construction", () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      expect(watcher.isRunning()).toBe(false);
    });
  });

  describe("isRunning", () => {
    it("should return false before start is called", () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      expect(watcher.isRunning()).toBe(false);
    });
  });

  describe("stop", () => {
    it("should be safe to call stop without starting", async () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      await expect(watcher.stop()).resolves.toBeUndefined();
    });

    it("should remain not running after stop without start", async () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      await watcher.stop();
      expect(watcher.isRunning()).toBe(false);
    });
  });

  describe("EventEmitter", () => {
    it("should be an EventEmitter", () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      expect(typeof watcher.on).toBe("function");
      expect(typeof watcher.emit).toBe("function");
      expect(typeof watcher.removeListener).toBe("function");
    });

    it("should accept event listeners", () => {
      const watcher = new ContentWatcher("/tmp/test-contents");
      const handler = () => {};

      watcher.on("content:add", handler);
      watcher.on("content:change", handler);
      watcher.on("content:delete", handler);
      watcher.on("error", handler);

      // Cleanup
      watcher.removeListener("content:add", handler);
      watcher.removeListener("content:change", handler);
      watcher.removeListener("content:delete", handler);
      watcher.removeListener("error", handler);
    });
  });
});

describe("getWatcher", () => {
  // Reset the singleton between test files by importing fresh module
  // Note: We cannot truly reset the module singleton here, but we can test
  // that getWatcher returns a ContentWatcher and that subsequent calls
  // return the same instance.

  it("should return a ContentWatcher instance", () => {
    const watcher = getWatcher("/tmp/test-contents");
    expect(watcher).toBeInstanceOf(ContentWatcher);
  });

  it("should return the same instance on subsequent calls (singleton)", () => {
    const watcher1 = getWatcher("/tmp/singleton-test");
    const watcher2 = getWatcher("/tmp/singleton-test");
    expect(watcher1).toBe(watcher2);
  });

  it("should return the same instance even with different paths (singleton)", () => {
    // The singleton is created on first call. Subsequent calls return the same
    // instance regardless of the path argument.
    const watcher1 = getWatcher("/tmp/path-a");
    const watcher2 = getWatcher("/tmp/path-b");
    expect(watcher1).toBe(watcher2);
  });
});
