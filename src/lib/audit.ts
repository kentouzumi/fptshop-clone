import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Nhật ký thao tác quản trị — dùng model `AuditLog` đã có sẵn trong schema từ
 * đầu dự án nhưng chưa một dòng code nào dùng tới.
 *
 * Trả lời đúng câu hỏi đã nêu trong bản rà soát: ai sửa giá, ai đổi trạng thái
 * đơn, ai chỉnh tồn kho, ai khóa tài khoản.
 */

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE_PRODUCT: "Tạo sản phẩm",
  UPDATE_PRODUCT: "Sửa sản phẩm",
  DELETE_PRODUCT: "Xóa sản phẩm",
  CREATE_VARIANT: "Tạo biến thể",
  UPDATE_VARIANT: "Sửa biến thể",
  DELETE_VARIANT: "Xóa biến thể",
  SET_INVENTORY: "Đặt số lượng tồn kho",
  UPDATE_ORDER_STATUS: "Đổi trạng thái đơn hàng",
  CONFIRM_BANK_TRANSFER: "Xác nhận đã nhận chuyển khoản",
  APPROVE_INSTALLMENT: "Duyệt hồ sơ trả góp",
  UPDATE_USER_ROLE: "Đổi vai trò người dùng",
  SET_USER_ACTIVE: "Khóa/mở khóa tài khoản",
  CREATE_COUPON: "Tạo mã giảm giá",
  UPDATE_COUPON: "Sửa mã giảm giá",
  DELETE_COUPON: "Xóa mã giảm giá",
  CREATE_POST: "Tạo bài viết",
  UPDATE_POST: "Sửa bài viết",
  DELETE_POST: "Xóa bài viết",
};

export const AUDIT_ENTITY_LABELS: Record<string, string> = {
  Product: "Sản phẩm",
  ProductVariant: "Biến thể",
  Inventory: "Tồn kho",
  Order: "Đơn hàng",
  User: "Người dùng",
  Coupon: "Mã giảm giá",
  Post: "Bài viết",
};

export interface AuditInput {
  userId: string | null;
  action: keyof typeof AUDIT_ACTION_LABELS | string;
  entityType: string;
  entityId: string;
  /** Chi tiết thao tác (giá cũ -> giá mới, trạng thái cũ -> mới...). */
  metadata?: Prisma.InputJsonValue;
}

/**
 * CỐ Ý KHÔNG BAO GIỜ THROW: nhật ký là thông tin phụ trợ, một lỗi ghi log
 * không được phép làm hỏng chính thao tác nghiệp vụ mà admin vừa thực hiện
 * (vd sửa giá thành công rồi nhưng API trả 500 vì ghi log lỗi — admin sẽ bấm
 * lại và sửa nhầm lần nữa). Lỗi in ra console để còn biết mà xử lý.
 *
 * Cũng CỐ Ý không gọi bên trong transaction của nghiệp vụ: nếu transaction
 * rollback thì cũng không nên còn lại dòng log nói rằng thao tác đã xảy ra.
 * Vì vậy mọi nơi gọi đều đặt logAudit() SAU khi thao tác thành công.
 */
export async function logAudit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata,
      },
    });
  } catch (e) {
    console.error("[audit] không ghi được nhật ký:", (e as Error).message, input);
  }
}

const PAGE_SIZE = 30;

export interface AuditLogQuery {
  action?: string;
  entityType?: string;
  /** Tìm theo tên/email người thao tác hoặc theo đúng id đối tượng bị tác động. */
  search?: string;
  page?: number;
}

export async function getAuditLogsForAdmin(params: AuditLogQuery = {}) {
  const page = Math.max(1, params.page ?? 1);
  const search = params.search?.trim();

  const where: Prisma.AuditLogWhereInput = {
    ...(params.action ? { action: params.action } : {}),
    ...(params.entityType ? { entityType: params.entityType } : {}),
    ...(search
      ? {
          OR: [
            { entityId: search },
            { user: { fullName: { contains: search, mode: "insensitive" } } },
            { user: { email: { contains: search, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { user: { select: { id: true, fullName: true, email: true } } },
    }),
    prisma.auditLog.count({ where }),
  ]);

  return { logs, total, page, totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

/** Các giá trị action/entityType THỰC SỰ có trong DB — dùng dựng chip lọc. */
export async function getAuditFilterOptions() {
  const [actions, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({ distinct: ["action"], select: { action: true }, orderBy: { action: "asc" } }),
    prisma.auditLog.findMany({
      distinct: ["entityType"],
      select: { entityType: true },
      orderBy: { entityType: "asc" },
    }),
  ]);
  return {
    actions: actions.map((a) => a.action),
    entityTypes: entityTypes.map((e) => e.entityType),
  };
}
