import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import mongoose from "mongoose";
import DatabaseService from "./index";

describe("DatabaseService", () => {
    let dbService: DatabaseService;
    const mockDbUri = "mongodb://localhost:27017/";
    const mockDbName = "testdb";
    const mockOptions = { bufferCommands: true };

    beforeEach(() => {
        dbService = new DatabaseService({
            dbUri: mockDbUri,
            dbName: mockDbName,
            databaseOpts: mockOptions,
        });
    });

    afterEach(async () => {
        await dbService.closeConnection();
        vi.clearAllMocks();
    });

    describe("constructor", () => {
        it("should initialize with correct properties", () => {
            expect(dbService.dbUri).toBe(mockDbUri);
            expect(dbService.dbName).toBe(mockDbName);
            expect(dbService.databaseOpts).toEqual(
                expect.objectContaining(mockOptions),
            );
            expect(dbService.connection).toBeNull();
        });
    });

    describe("getDatabaseName", () => {
        it("should return the database name", () => {
            expect(dbService.getDatabaseName()).toBe(mockDbName);
        });
    });

    describe("setDatabaseName", () => {
        it("should update database name", () => {
            const newDbName = "newTestDb";
            dbService.setDatabaseName(newDbName);
            expect(dbService.dbName).toBe(newDbName);
        });

        it("should update connection when it exists", async () => {
            const useDbMock = vi.fn();
            dbService.connection = {
                useDb: useDbMock,
            } as unknown as mongoose.Connection;

            const newDbName = "newTestDb";
            dbService.setDatabaseName(newDbName);

            expect(useDbMock).toHaveBeenCalledWith(newDbName, {
                useCache: true,
            });
        });
    });

    describe("toString", () => {
        it("should return masked connection string", () => {
            dbService.dbUri = "mongodb://user:pass@localhost:27017/";
            const result = dbService.toString();
            expect(result).toContain("***:***@");
            expect(result).not.toContain("user:pass");
        });
    });

    describe("createConnection", () => {
        it("should create test connection when NODE_ENV is test", async () => {
            process.env.NODE_ENV = "test";
            const connection = await dbService.createConnection();
            expect(connection).toBeDefined();
            expect(mongoose.connections.length).toBeGreaterThan(0);
        });
    });

    describe("isConnectionAlive", () => {
        it("should return true for active connection", () => {
            const mockConn = {
                readyState: 0,
            } as unknown as mongoose.Connection;
            expect(dbService.isConnectionAlive(mockConn)).toBe(false);
        });

        it("should return true for active connection", () => {
            const mockConn = {
                readyState: 1,
            } as unknown as mongoose.Connection;
            expect(dbService.isConnectionAlive(mockConn)).toBe(true);
        });

        it("should return true for connecting state", () => {
            const mockConn = {
                readyState: 2,
            } as unknown as mongoose.Connection;
            expect(dbService.isConnectionAlive(mockConn)).toBe(true);
        });
    });

    describe("getConnection", () => {
        it("should return connection when no function is provided", async () => {
            const connection = await dbService.getConnection();
            expect(connection).toBeDefined();
        });

        it("should execute function with connection when provided", async () => {
            const mockFn = vi.fn();
            await dbService.getConnection(mockFn);
            expect(mockFn).toHaveBeenCalled();
        });
    });
});
