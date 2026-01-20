import { describe, it, expect, beforeEach, vi } from "vitest";
import RoleRepository from "./roleRepository";
import AuditLogRepository from "./auditLogRepository";
import type { Model } from "mongoose";
import type { CurrentUser } from "./types";

describe("RoleRepository", () => {
    let roleRepository: RoleRepository;
    let mockModel: any;
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
            email: "dummy@gmail.com",
        };
        roleRepository = new RoleRepository(mockModel as unknown as Model<any>);
        // Mock AuditLogRepository
        vi.spyOn(roleRepository.auditLogRepository, "log").mockResolvedValue({
            _id: "mockId",
            __v: 0,
        } as any);
    });

    describe("create", () => {
        it("should create a role and log the action", async () => {
            const roleData = {
                name: "Test Role",
                description: "Test Description",
            };
            const createdRole = { _id: "role123", ...roleData };

            mockModel.create.mockResolvedValue([createdRole]);
            mockModel.findById.mockResolvedValue(createdRole);

            const result = await roleRepository.create(
                roleData,
                mockCurrentUser,
            );

            expect(mockModel.createCollection).toHaveBeenCalled();
            expect(mockModel.create).toHaveBeenCalledWith([roleData]);
            expect(roleRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.CREATE,
                    entityId: "role123",
                    entityName: "role",
                    values: roleData,
                },
                mockCurrentUser,
            );
            expect(result).toEqual(createdRole);
        });
    });

    describe("update", () => {
        it("should update a role and log the action", async () => {
            const roleId = "role123";
            const updateData = { name: "Updated Role" };
            const updatedRole = { _id: roleId, ...updateData };

            mockModel.findById.mockResolvedValue(updatedRole);
            mockModel.exec.mockResolvedValue({ modifiedCount: 1 });

            const result = await roleRepository.update(
                roleId,
                updateData,
                mockCurrentUser,
            );

            expect(mockModel.updateOne).toHaveBeenCalledWith(
                { _id: roleId },
                updateData,
            );
            expect(roleRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.UPDATE,
                    entityId: roleId,
                    entityName: "role",
                    values: updateData,
                },
                mockCurrentUser,
            );
            expect(result).toEqual(updatedRole);
        });
    });

    describe("findAndCountAll", () => {
        it("should return filtered and paginated results", async () => {
            const filter = {
                name: "Test",
            };
            const limit = 10;
            const offset = 0;
            const orderBy = "name_ASC";

            const mockRoles = [
                {
                    _id: "role123",
                    name: "Test Role",
                    description: "Description",
                },
                {
                    _id: "role456",
                    name: "Another Role",
                    description: "Another Description",
                },
            ];

            mockModel.exec.mockResolvedValueOnce(mockRoles);
            mockModel.exec.mockResolvedValueOnce(2);

            const result = await roleRepository.findAndCountAll({
                filter,
                limit,
                offset,
                orderBy,
            });

            expect(result).toEqual({
                count: 2,
                rows: mockRoles,
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
                { _id: "role1", name: "Test Role 1" },
                { _id: "role2", name: "Test Role 2" },
            ];

            mockModel.exec.mockResolvedValue(mockRecords);

            const result = await roleRepository.findAllAutocomplete(
                search,
                limit,
            );

            expect(result).toEqual([
                { _id: "role1", name: "Test Role 1" },
                { _id: "role2", name: "Test Role 2" },
            ]);
            expect(mockModel.find).toHaveBeenCalled();
            expect(mockModel.limit).toHaveBeenCalled();
            expect(mockModel.sort).toHaveBeenCalled();
        });
    });

    describe("destroy", () => {
        it("should delete a role and log the action", async () => {
            const roleId = "role123";
            mockModel.exec.mockResolvedValue({ deletedCount: 1 });

            await roleRepository.destroy(roleId, mockCurrentUser);

            expect(mockModel.deleteOne).toHaveBeenCalledWith({ _id: roleId });
            expect(roleRepository.auditLogRepository.log).toHaveBeenCalledWith(
                {
                    action: AuditLogRepository.DELETE,
                    entityId: roleId,
                    entityName: "role",
                    values: null,
                },
                mockCurrentUser,
            );
        });
    });

    describe("findByName", () => {
        it("should find roles by name", async () => {
            const name = "Test Role";
            const mockRoles = [{ _id: "role1", name: "Test Role" }];

            mockModel.find.mockResolvedValue(mockRoles);

            const result = await roleRepository.findByName(name);

            expect(mockModel.find).toHaveBeenCalledWith({ name });
            expect(result).toEqual(mockRoles);
        });
    });

    describe("findByNameAndNotId", () => {
        it("should find roles by name excluding specific id", async () => {
            const name = "Test Role";
            const id = "role1";
            const mockRoles = [{ _id: "role2", name: "Test Role" }];

            mockModel.find.mockResolvedValue(mockRoles);

            const result = await roleRepository.findByNameAndNotId(name, id);

            expect(mockModel.find).toHaveBeenCalledWith({
                name: name,
                _id: { $ne: id },
            });
            expect(result).toEqual(mockRoles);
        });
    });
});
