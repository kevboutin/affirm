import { describe, it, expect, vi, beforeEach } from "vitest";
import AuditLogRepository from "./auditLogRepository";
import type { CurrentUser } from "./types";

describe("AuditLogRepository", () => {
    let repository: AuditLogRepository;
    let mockModel: any;
    let mockCurrentUser: CurrentUser;

    beforeEach(() => {
        // Mock the Mongoose model
        mockModel = {
            create: vi.fn(),
            find: vi.fn(),
            countDocuments: vi.fn(),
            aggregate: vi.fn(),
        };
        repository = new AuditLogRepository(mockModel as any);
        mockCurrentUser = {
            _id: "user123",
            username: "Test User",
            email: "dummy@gmail.com",
        };
    });

    describe("log", () => {
        it("should create an audit log entry with user information", async () => {
            const mockInput = {
                entityName: "User",
                entityId: "456",
                action: AuditLogRepository.UPDATE,
                values: { name: "Updated Name" },
            };
            const mockCreatedLog = {
                ...mockInput,
                timestamp: expect.any(Date),
                createdById: mockCurrentUser._id,
                createdByEmail: mockCurrentUser.email,
            };

            mockModel.create.mockResolvedValue([mockCreatedLog]);

            const result = await repository.log(mockInput, mockCurrentUser);

            expect(mockModel.create).toHaveBeenCalledWith([
                expect.objectContaining({
                    entityName: mockInput.entityName,
                    entityId: mockInput.entityId,
                    action: mockInput.action,
                    values: mockInput.values,
                    timestamp: expect.any(Date),
                    createdById: mockCurrentUser._id,
                    createdByEmail: mockCurrentUser.email,
                }),
            ]);
            expect(result).toEqual(mockCreatedLog);
        });

        it("should create an audit log entry without user information", async () => {
            const mockInput = {
                entityName: "User",
                entityId: "456",
                action: AuditLogRepository.DELETE,
                values: null,
            };
            const mockCreatedLog = {
                ...mockInput,
                timestamp: expect.any(Date),
                createdById: null,
                createdByEmail: null,
            };

            mockModel.create.mockResolvedValue([mockCreatedLog]);

            // @ts-expect-error Testing missing currentUser case
            const result = await repository.log(mockInput, undefined);

            expect(mockModel.create).toHaveBeenCalledWith([
                expect.objectContaining({
                    entityName: mockInput.entityName,
                    entityId: mockInput.entityId,
                    action: mockInput.action,
                    values: mockInput.values,
                    timestamp: expect.any(Date),
                    createdById: null,
                    createdByEmail: null,
                }),
            ]);
            expect(result).toEqual(mockCreatedLog);
        });
    });

    describe("findAndCountAll", () => {
        beforeEach(() => {
            // Mock the chainable methods of find()
            mockModel.find.mockReturnValue({
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                collation: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                exec: vi.fn().mockResolvedValue([]),
            });
            mockModel.countDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(0),
            });
        });

        it("should find and count audit logs with default parameters", async () => {
            const result = await repository.findAndCountAll({ filter: {} });

            expect(mockModel.find).toHaveBeenCalled();
            expect(result).toEqual({
                count: 0,
                rows: [],
            });
        });

        it("should apply filters correctly", async () => {
            const filter = {
                timestampRange: {
                    start: "2024-01-01T00:00:00.000Z",
                    end: "2024-01-31T23:59:59.999Z",
                },
                action: AuditLogRepository.CREATE,
                entityId: "123",
                createdByEmail: "test@example.com",
                entityNames: ["User", "Role"],
            };

            await repository.findAndCountAll({ filter });

            expect(mockModel.find).toHaveBeenCalledWith({
                $and: [
                    {
                        timestamp: {
                            $gte: "2024-01-01T00:00:00.000Z",
                        },
                    },
                    {
                        timestamp: {
                            $lte: "2024-01-31T23:59:59.999Z",
                        },
                    },
                    { action: filter.action },
                    { entityId: filter.entityId },
                    { createdByEmail: /test@example.com/i },
                    {
                        entityName: {
                            $in: filter.entityNames,
                        },
                    },
                ],
            });
        });

        it("should handle custom limit, offset and orderBy", async () => {
            const params: {
                filter: any;
                limit?: number;
                offset?: number;
                orderBy?: string;
            } = {
                filter: {},
                limit: 10,
                offset: 20,
                orderBy: "timestamp_ASC",
            };

            await repository.findAndCountAll(params);

            const findQuery = mockModel.find.mock.results[0].value;
            expect(findQuery.limit).toHaveBeenCalledWith(10);
            expect(findQuery.skip).toHaveBeenCalledWith(20);
            expect(findQuery.sort).toHaveBeenCalled();
        });

        it("should handle undefined or null values in range filters", async () => {
            const filters = {
                timestampRange: { start: null, end: undefined },
            };

            await repository.findAndCountAll({ filter: filters });

            expect(mockModel.find).toHaveBeenCalledWith(undefined);
        });

        it("should handle valid date range filters", async () => {
            const filters = {
                timestampRange: {
                    start: "2024-01-01T00:00:00.000Z",
                    end: "2024-01-31T23:59:59.999Z",
                },
            };

            await repository.findAndCountAll({ filter: filters });

            expect(mockModel.find).toHaveBeenCalledWith({
                $and: [
                    {
                        timestamp: {
                            $gte: "2024-01-01T00:00:00.000Z",
                        },
                    },
                    {
                        timestamp: {
                            $lte: "2024-01-31T23:59:59.999Z",
                        },
                    },
                ],
            });
        });

        it("should handle partial date range filters", async () => {
            const filters = {
                timestampRange: {
                    start: "2024-01-01T00:00:00.000Z",
                    end: null,
                },
            };

            await repository.findAndCountAll({ filter: filters });

            expect(mockModel.find).toHaveBeenCalledWith({
                $and: [
                    {
                        timestamp: {
                            $gte: "2024-01-01T00:00:00.000Z",
                        },
                    },
                ],
            });
        });
    });
});
