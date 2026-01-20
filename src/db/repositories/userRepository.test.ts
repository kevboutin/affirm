import { describe, it, expect, beforeEach, vi } from "vitest";
import UserRepository from "./userRepository";
import AuditLogRepository from "./auditLogRepository";
import type { Model, Document } from "mongoose";
import type { CurrentUser, LogParams } from "./types";
import { User } from "../models";
import { Types } from "mongoose";

describe("UserRepository", () => {
    let userRepository: UserRepository;
    let mockModel: any;
    let mockCurrentUser: CurrentUser;

    beforeEach(() => {
        const queryChain = {
            populate: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue(null),
        };

        mockModel = {
            createCollection: vi.fn(),
            create: vi.fn(),
            updateOne: vi.fn().mockReturnThis(),
            deleteOne: vi.fn().mockReturnThis(),
            countDocuments: vi.fn().mockReturnThis(),
            findById: vi.fn().mockReturnValue(queryChain),
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
            authType: "oauth",
            roles: [],
            locale: "en_us",
            timezone: "America/Los_Angeles",
            verifiedEmail: true,
            verifiedPhone: false,
        };
        userRepository = new UserRepository(mockModel as unknown as Model<any>);
        // Mock AuditLogRepository
        vi.spyOn(userRepository.auditLogRepository, "log").mockImplementation(
            async (params: LogParams, user: CurrentUser) => {
                const mockDoc = {
                    _id: new Types.ObjectId("4ecc05e55dd98a436ddcc47c"),
                    entityId: params.entityId,
                    entityName: params.entityName,
                    action: params.action,
                    timestamp: new Date(),
                    createdById: user._id,
                    createdByEmail: user.email,
                    values: params.values,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    __v: 0,
                } as any;
                return mockDoc;
            },
        );
    });

    describe("create", () => {
        it("should create a user and log the action", async () => {
            const userData = {
                username: "Test User",
                password: "someTestPassword!",
                email: "testuser@somewhere.com",
                timezone: "America/Los_Angeles",
                roles: [],
                locale: "en_us",
                verifiedEmail: false,
                verifiedPhone: false,
                authType: "oauth" as const,
            };
            const createdUser = { _id: "user123", ...userData };

            mockModel.create.mockResolvedValue([createdUser]);
            mockModel.findById.mockResolvedValue(createdUser);

            const result = await userRepository.create(
                userData as unknown as Partial<User>,
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
            const userId = new Types.ObjectId("4ecc05e55dd98a436ddcc47c");
            const updateData = { username: "Updated User" };
            const updatedUser = {
                _id: userId,
                ...updateData,
            } as unknown as Document & {
                _id: Types.ObjectId;
                username: string;
            };

            const queryChain = {
                populate: vi.fn().mockReturnThis(),
                exec: vi.fn().mockResolvedValue(updatedUser),
            };
            mockModel.findById.mockReturnValue(queryChain);
            mockModel.updateOne.mockReturnValue({
                exec: vi.fn().mockResolvedValue({ modifiedCount: 1 }),
            });

            await userRepository.update(
                userId.toString(),
                updateData as Partial<User>,
                mockCurrentUser,
            );

            expect(mockModel.updateOne).toHaveBeenCalledWith(
                { _id: userId.toString() },
                updateData,
            );
            expect(userRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.UPDATE,
                    entityId: userId.toString(),
                    entityName: "user",
                    values: updateData,
                },
                mockCurrentUser,
            );
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
                    verifiedPhone: false,
                    authType: "oauth",
                },
                {
                    _id: "user456",
                    username: "Another User",
                    email: "user456@somewhere.com",
                    timezone: "America/New_York",
                    roles: [],
                    locale: "en_us",
                    verifiedEmail: true,
                    verifiedPhone: false,
                    authType: "oauth",
                },
            ];

            // Mock the chain of methods
            const queryChain = {
                skip: vi.fn().mockReturnThis(),
                limit: vi.fn().mockReturnThis(),
                collation: vi.fn().mockReturnThis(),
                sort: vi.fn().mockReturnThis(),
                select: vi.fn().mockReturnThis(),
                lean: vi.fn().mockReturnThis(),
                exec: vi.fn().mockResolvedValue(mockUsers),
            };
            mockModel.find.mockReturnValue(queryChain);
            mockModel.countDocuments.mockReturnValue({
                exec: vi.fn().mockResolvedValue(2),
            });

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
            expect(queryChain.select).toHaveBeenCalledWith("-password");
            expect(queryChain.lean).toHaveBeenCalled();
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
