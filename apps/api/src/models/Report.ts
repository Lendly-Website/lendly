import { model, Schema } from "mongoose";
import {
  REPORT_STATUSES,
  REPORT_TARGET_TYPES,
  type ReportStatus,
  type ReportTargetType,
} from "@lendly/shared";

export interface ReportDocument {
  reporterId: Schema.Types.ObjectId;
  targetType: ReportTargetType;
  targetId: Schema.Types.ObjectId;
  reason: string;
  details: string;
  status: ReportStatus;
  resolution?: string;
}

const reportSchema = new Schema<ReportDocument>(
  {
    reporterId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    targetType: { type: String, enum: REPORT_TARGET_TYPES, required: true },
    targetId: { type: Schema.Types.ObjectId, required: true, index: true },
    reason: { type: String, required: true, trim: true },
    details: { type: String, required: true, trim: true, maxlength: 2000 },
    status: { type: String, enum: REPORT_STATUSES, default: "open", required: true, index: true },
    resolution: { type: String, trim: true, maxlength: 2000 },
  },
  { timestamps: true },
);

reportSchema.index({ status: 1, createdAt: -1 });

reportSchema.set("toJSON", {
  transform: (_document, returned) => {
    const result = returned as unknown as Record<string, unknown>;
    result.id = String(result._id);
    delete result._id;
    delete result.__v;
    return result;
  },
});

export const Report = model<any>("Report", reportSchema);
