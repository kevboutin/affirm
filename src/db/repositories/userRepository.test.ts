import { describe, it, expect, beforeEach, vi } from "vitest";
import UserRepository from "./userRepository";
import AuditLogRepository from "./auditLogRepository";
// import { verifying } from "hono/utils/jwt/jws";
import type { Model } from "mongoose";
import type { CurrentUser } from "./types";

describe("UserRepository", () => {
    let userRepository: UserRepository;
    let mockModel: Partial<Model<any>> & {
        createCollection: ReturnType<typeof vi.fn>;
        create: ReturnType<typeof vi.fn>;
        find: ReturnType<typeof vi.fn>;
        skip: ReturnType<typeof vi.fn>;
        limit: ReturnType<typeof vi.fn>;
        collation: ReturnType<typeof vi.fn>;
        sort: ReturnType<typeof vi.fn>;
        exec: ReturnType<typeof vi.fn>;
        updateOne: ReturnType<typeof vi.fn>;
        deleteOne: ReturnType<typeof vi.fn>;
        countDocuments: ReturnType<typeof vi.fn>;
        findById: ReturnType<typeof vi.fn>;
    };
    let mockCurrentUser: CurrentUser;

    beforeEach(() => {
        mockModel = {
            createCollection: vi.fn(),
            create: vi.fn(),
            updateOne: vi.fn().mockReturnThis(),
            deleteOne: vi.fn().mockReturnThis(),
            countDocuments: vi.fn().mockReturnThis(),
            findById: vi.fn(),
            find: vi.fn().mockReturnThis(),
            skip: vi.fn().mockReturnThis(),
            limit: vi.fn().mockReturnThis(),
            collation: vi.fn().mockReturnThis(),
            sort: vi.fn().mockReturnThis(),
            exec: vi.fn(),
        };

        mockCurrentUser = {
            _id: "user123",
            username: "Test User",
            email: "testuser@somewhere.com",
            roles: [],
            locale: "en_us",
            timezone: "America/Los_Angeles",
            verifiedEmail: true,
        };
        userRepository = new UserRepository(mockModel as unknown as Model<any>);
        // Mock AuditLogRepository
        vi.spyOn(userRepository.auditLogRepository, "log").mockResolvedValue({
            _id: "mockId",
            __v: 0,
        } as any);
    });

    describe("create", () => {
        it("should create a user and log the action", async () => {
            const userData = {
                username: "Test User",
                email: "testuser@somewhere.com",
                timezone: "America/Los_Angeles",
                roles: [],
                locale: "en_us",
                verifiedEmail: false,
            };
            const createdUser = { _id: "user123", ...userData };

            mockModel.create.mockResolvedValue([createdUser]);
            mockModel.findById.mockResolvedValue(createdUser);

            const result = await userRepository.create(
                userData,
                mockCurrentUser,
            );

            expect(mockModel.createCollection).toHaveBeenCalled();
            expect(mockModel.create).toHaveBeenCalledWith([userData]);
            expect(userRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.CREATE,
                    entityId: "user123",
                    entityName: "user",
                    values: userData,
                },
                mockCurrentUser,
            );
            expect(result).toEqual(createdUser);
        });
    });

    describe("update", () => {
        it("should update a user and log the action", async () => {
            const userId = "user123";
            const updateData = { username: "Updated User" };
            const updatedUser = { _id: userId, ...updateData };

            mockModel.findById.mockResolvedValue(updatedUser);
            mockModel.exec.mockResolvedValue({ modifiedCount: 1 });

            const result = await userRepository.update(
                userId,
                updateData,
                mockCurrentUser,
            );

            expect(mockModel.updateOne).toHaveBeenCalledWith(
                { _id: userId },
                updateData,
            );
            expect(userRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.UPDATE,
                    entityId: userId,
                    entityName: "user",
                    values: updateData,
                },
                mockCurrentUser,
            );
            expect(result).toEqual(updatedUser);
        });
    });

    describe("findAndCountAll", () => {
        it("should return filtered and paginated results", async () => {
            const filter = {
                username: "Test",
            };
            const limit = 10;
            const offset = 0;
            const orderBy = "name_ASC";

            const mockUsers = [
                {
                    _id: "user123",
                    username: "Test User",
                    email: "user123@somewhere.com",
                    timezone: "America/Los_Angeles",
                    roles: [],
                    locale: "en_us",
                    verifiedEmail: false,
                },
                {
                    _id: "user456",
                    username: "Another User",
                    email: "user456@somewhere.com",
                    timezone: "America/New_York",
                    roles: [],
                    locale: "en_us",
                    verifiedEmail: true,
                },
            ];

            mockModel.exec.mockResolvedValueOnce(mockUsers);
            mockModel.exec.mockResolvedValueOnce(2);

            const result = await userRepository.findAndCountAll({
                filter,
                limit,
                offset,
                orderBy,
            });

            expect(result).toEqual({
                count: 2,
                rows: mockUsers,
            });
            expect(mockModel.find).toHaveBeenCalled();
            expect(mockModel.countDocuments).toHaveBeenCalled();
        });
    });

    describe("findAllAutocomplete", () => {
        it("should return formatted autocomplete results", async () => {
            const search = "test";
            const limit = 10;
            const mockRecords = [
                { _id: "user1", username: "Test User 1" },
                { _id: "user2", username: "Test User 2" },
            ];

            mockModel.exec.mockResolvedValue(mockRecords);

            const result = await userRepository.findAllAutocomplete(
                search,
                limit,
            );

            expect(result).toEqual([
                { _id: "user1", username: "Test User 1" },
                { _id: "user2", username: "Test User 2" },
            ]);
            expect(mockModel.find).toHaveBeenCalled();
            expect(mockModel.limit).toHaveBeenCalled();
            expect(mockModel.sort).toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("should delete a user and log the action", async () => {
            const userId = "user123";
            mockModel.exec.mockResolvedValue({ deletedCount: 1 });

            await userRepository.destroy(userId, mockCurrentUser);

            expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: userId });
            expect(userRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.DELETE,
                    entityId: userId,
                    entityName: "user",
                    values: null,
                },
                mockCurrentUser,
            );
        });
    });

    describe("findByUsername", () => {
        it("should find users by username", async () => {
            const username = "Test User";
            const mockUsers = [{ _id: "user1", name: "Test User" }];

            mockModel.find.mockResolvedValue(mockUsers);

            const result = await userRepository.findByUsername(username);

            expect(mockModel.find).toHaveBeenCalledWith({ username });
            expect(result).toEqual(mockUsers);
        });
    });

    describe("findByUsernameAndNotId", () => {
        it("should find users by username excluding specific id", async () => {
            const username = "Test User";
            const id = "user1";
            const mockUsers = [{ _id: "user2", username: "Test User" }];

            mockModel.find.mockResolvedValue(mockUsers);

            const result = await userRepository.findByUsernameAndNotId(
                username,
                id,
            );

            expect(mockModel.find).toHaveBeenCalledWith({
                username: username,
                _id: { $ne: id },
            });
            expect(result).toEqual(mockUsers);
        });
    });
});
