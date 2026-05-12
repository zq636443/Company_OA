PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS "WorkflowTemplate" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "name" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "duration" TEXT NOT NULL,
  "favorite" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'draft',
  "custom" BOOLEAN NOT NULL DEFAULT true,
  "fieldsJson" TEXT NOT NULL DEFAULT '[]',
  "nodesJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "WorkflowInstance" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "no" TEXT NOT NULL,
  "templateId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "category" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "initiator" TEXT NOT NULL,
  "department" TEXT NOT NULL,
  "currentNode" TEXT NOT NULL,
  "owner" TEXT NOT NULL,
  "amount" TEXT NOT NULL DEFAULT '-',
  "vendor" TEXT NOT NULL DEFAULT '-',
  "purpose" TEXT NOT NULL DEFAULT '-',
  "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "stuckHours" INTEGER NOT NULL DEFAULT 0,
  "summaryJson" TEXT NOT NULL DEFAULT '[]',
  "dataJson" TEXT NOT NULL DEFAULT '{}',
  CONSTRAINT "WorkflowInstance_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "WorkflowTemplate" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "WorkflowInstance_no_key" ON "WorkflowInstance" ("no");

CREATE TABLE IF NOT EXISTS "WorkflowNode" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "templateNodeId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "assignee" TEXT NOT NULL,
  "approver" TEXT NOT NULL DEFAULT '',
  "cc" TEXT NOT NULL DEFAULT '',
  "time" TEXT NOT NULL DEFAULT '未开始',
  "dwell" TEXT NOT NULL DEFAULT '-',
  "summaryJson" TEXT NOT NULL DEFAULT '[]',
  "detailsJson" TEXT NOT NULL DEFAULT '[]',
  "editable" BOOLEAN NOT NULL DEFAULT false,
  "opinion" TEXT NOT NULL DEFAULT '',
  "attachmentsJson" TEXT NOT NULL DEFAULT '[]',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WorkflowNode_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "AuditLog" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT NOT NULL,
  "nodeId" TEXT,
  "actor" TEXT NOT NULL,
  "action" TEXT NOT NULL,
  "opinion" TEXT NOT NULL DEFAULT '',
  "metadataJson" TEXT NOT NULL DEFAULT '{}',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_workflowId_fkey" FOREIGN KEY ("workflowId") REFERENCES "WorkflowInstance" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "WorkflowNode" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Notification" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "workflowId" TEXT,
  "nodeId" TEXT,
  "targetUser" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "link" TEXT NOT NULL,
  "channel" TEXT NOT NULL DEFAULT 'wecom',
  "status" TEXT NOT NULL DEFAULT 'queued',
  "errorMessage" TEXT NOT NULL DEFAULT '',
  "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sentAt" DATETIME
);
