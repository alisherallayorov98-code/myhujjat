-- CreateTable: EmployeeLeave (xodim ta'tillari)
CREATE TABLE "EmployeeLeave" (
    "id"             TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "employeeId"     TEXT NOT NULL,
    "type"           TEXT NOT NULL,
    "startDate"      TIMESTAMP(3) NOT NULL,
    "endDate"        TIMESTAMP(3) NOT NULL,
    "days"           INTEGER NOT NULL,
    "reason"         TEXT,
    "status"         TEXT NOT NULL DEFAULT 'APPROVED',
    "orderNum"       TEXT,
    "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmployeeLeave_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "EmployeeLeave" ADD CONSTRAINT "EmployeeLeave_organizationId_fkey"
    FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "EmployeeLeave" ADD CONSTRAINT "EmployeeLeave_employeeId_fkey"
    FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "EmployeeLeave_employeeId_idx" ON "EmployeeLeave"("employeeId");
CREATE INDEX "EmployeeLeave_organizationId_employeeId_idx" ON "EmployeeLeave"("organizationId", "employeeId");
