import mongoose, { Schema, Document } from "mongoose";

export interface AuditLogDocument extends Document {
    entityId: string;
    entityName: string;
    action: string;
    timestamp: Date;
    createdById: string;
    createdByEmail: string;
    createdAt?: Date;
    updatedAt?: Date;
}

const AuditLogSchema = new Schema(
    {
        entityId: { type: String, required: true },
        entityName: { type: String, required: true },
        action: { type: String, required: true },
        createdById: { type: String, required: false },
        createdByEmail: { type: String, required: false },
        timestamp: { type: Date, required: true },
        values: { type: Schema.Types.Mixed, required: false },
    },
    { timestamps: true, collection: "auditLogs" },
);

AuditLogSchema.index({ entityName: 1, action: 1 });

const AuditLog = mongoose.model<AuditLogDocument>("AuditLog", AuditLogSchema);
export default AuditLog;
