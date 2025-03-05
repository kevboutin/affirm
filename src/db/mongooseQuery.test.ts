import { describe, it, expect, beforeEach } from "vitest";
import mongoose from "mongoose";
import MongooseQuery from "./mongooseQuery";

describe("MongooseQuery", () => {
    let query: MongooseQuery;

    beforeEach(() => {
        query = new MongooseQuery(10, 0, "name_ASC");
    });

    describe("constructor and static methods", () => {
        it("should create instance with correct defaults", () => {
            const query = new MongooseQuery(null, null, null);
            expect(query.limit).toBeUndefined();
            expect(query.skip).toBeUndefined();
            expect(query.sort).toBeUndefined();
            expect(query.isOr).toBe(false);
        });

        it("should create instance for list", () => {
            const query = MongooseQuery.forList({
                limit: 5,
                offset: 10,
                orderBy: "name_DESC",
            });
            expect(query.limit).toBe(5);
            expect(query.skip).toBe(10);
            expect(query.sort).toEqual({ name: -1 });
            expect(query.isOr).toBe(false);
        });

        it("should create instance for autocomplete", () => {
            const query = MongooseQuery.forAutocomplete({ limit: 5 });
            expect(query.limit).toBe(5);
            expect(query.isOr).toBe(true);
        });
    });

    describe("query methods", () => {
        it("should append equal condition", () => {
            query.appendEqual("name", "John");
            expect(query.criteria).toEqual({
                $and: [{ name: "John" }],
            });
        });

        it("should append not equal condition", () => {
            query.appendNotEqual("age", 25);
            expect(query.criteria).toEqual({
                $and: [{ age: { $ne: 25 } }],
            });
        });

        it("should append null conditions", () => {
            query.appendEqualNull("deletedAt");
            query.appendNotEqualNull("updatedAt");
            expect(query.criteria).toEqual({
                $and: [
                    { deletedAt: { $eq: null } },
                    { updatedAt: { $ne: null } },
                ],
            });
        });

        it("should append identifier condition with valid ObjectId", () => {
            const validId = "507f1f77bcf86cd799439011";
            query.appendId("_id", validId);
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id,
            ).toBeInstanceOf(mongoose.Types.ObjectId);
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id.toString(),
            ).toBe(validId);
        });

        it("should handle not valid ObjectId", () => {
            query.appendId("_id", "notvalid-id");
            expect(
                (query.criteria as { $and: any[] }).$and[0]._id,
            ).toBeInstanceOf(mongoose.Types.ObjectId);
        });

        it("should append in condition", () => {
            query.appendIn("status", ["active", "pending"]);
            expect(query.criteria).toEqual({
                $and: [{ status: { $in: ["active", "pending"] } }],
            });
        });

        it("should append ilike condition", () => {
            query.appendILike("name", "john");
            expect(
                (query.criteria as { $and: any[] }).$and[0].name,
            ).toBeInstanceOf(RegExp);
            expect((query.criteria as { $and: any[] }).$and[0].name.flags).toBe(
                "i",
            );
        });

        it("should append range condition", () => {
            query.appendRange("age", { start: 20, end: 30 });
            expect(query.criteria).toEqual({
                $and: [{ age: { $gte: 20 } }, { age: { $lte: 30 } }],
            });
        });

        it("should append elemMatch condition", () => {
            query.appendElemMatch("items", "category", "books");
            expect(query.criteria).toEqual({
                $and: [{ items: { $elemMatch: { category: "books" } } }],
            });
        });
    });

    describe("sort handling", () => {
        it("should handle ASC sort", () => {
            const query = new MongooseQuery(10, 0, "name_ASC");
            expect(query.sort).toEqual({ name: 1 });
        });

        it("should handle DESC sort", () => {
            const query = new MongooseQuery(10, 0, "name_DESC");
            expect(query.sort).toEqual({ name: -1 });
        });

        it("should handle id field specifically", () => {
            const query = new MongooseQuery(10, 0, "id_ASC");
            expect(query.sort).toEqual({ _id: 1 });
        });

        it("should handle leading underscore", () => {
            const query = new MongooseQuery(10, 0, "_name_DESC");
            expect(query.sort).toEqual({ name: -1 });
        });
    });

    describe("reset and criteria", () => {
        it("should reset criteria", () => {
            query.appendEqual("name", "John");
            expect(query.criteria).toBeDefined();
            query.reset();
            expect(query.criteria).toBeUndefined();
        });

        it("should use $or when isOr is true", () => {
            const orQuery = new MongooseQuery(10, 0, null, true);
            orQuery.appendEqual("name", "John");
            orQuery.appendEqual("age", 25);
            expect(orQuery.criteria).toHaveProperty("$or");
            expect((orQuery.criteria as { $or: any[] }).$or).toHaveLength(2);
        });
    });
});
