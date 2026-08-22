/**
 * ControlGraph deterministic seed.
 * Run from the server directory so server/.env is loaded:
 *   cd controlgraph/server && npx tsx ../scripts/seed.ts
 */
import { initDriver, closeDriver } from "../server/src/db/driver.js";
import { env } from "../server/src/config/env.js";

export const APP_LABELS = [
  "Coworker", "Workflow", "Agent", "Skill", "Connector", "System", "Resource", "DataAsset",
  "Policy", "Permission", "ApprovalGate", "Action", "KnowledgeBase", "Document", "User",
];

// ---------------- Systems ----------------
const systems = [
  { id: "sys_salesforce", name: "Salesforce", type: "CRM", environment: "production" },
  { id: "sys_hubspot", name: "HubSpot", type: "Marketing", environment: "production" },
  { id: "sys_slack", name: "Slack", type: "Collaboration", environment: "production" },
  { id: "sys_gmail", name: "Gmail", type: "Email", environment: "production" },
  { id: "sys_jira", name: "Jira", type: "ProjectTracking", environment: "production" },
  { id: "sys_stripe", name: "Stripe", type: "Payments", environment: "production" },
  { id: "sys_zendesk", name: "Zendesk", type: "Support", environment: "production" },
  { id: "sys_snowflake", name: "Snowflake", type: "DataWarehouse", environment: "production" },
  { id: "sys_gdrive", name: "Google Drive", type: "FileStorage", environment: "production" },
  { id: "sys_internal_crm", name: "Internal CRM", type: "CRM", environment: "staging" },
];

const connectors = systems.map((s) => ({
  id: `conn_${s.id.replace("sys_", "")}`,
  name: `${s.name} Connector`,
  provider: s.name,
  type: s.id === "sys_internal_crm" ? "internal" : "external",
  status: "active",
}));

// ---------------- Resources & DataAssets ----------------
const res = (id: string, name: string, type: string, sensitivity: string, systemId: string) => ({ id, name, type, sensitivity, systemId });
const resources = [
  res("res_sf_customers", "Customer Records", "dataset", "HIGH", "sys_salesforce"),
  res("res_sf_opportunities", "Opportunity Pipeline", "dataset", "MEDIUM", "sys_salesforce"),
  res("res_hs_contacts", "Marketing Contacts", "dataset", "MEDIUM", "sys_hubspot"),
  res("res_hs_campaigns", "Campaign Performance", "dataset", "LOW", "sys_hubspot"),
  res("res_slack_messages", "Channel Messages", "stream", "MEDIUM", "sys_slack"),
  res("res_gmail_inbox", "Inbox & Threads", "mailbox", "HIGH", "sys_gmail"),
  res("res_jira_tickets", "Jira Tickets", "dataset", "MEDIUM", "sys_jira"),
  res("res_stripe_payments", "Payment Transactions", "dataset", "CRITICAL", "sys_stripe"),
  res("res_stripe_refunds", "Refund Records", "dataset", "CRITICAL", "sys_stripe"),
  res("res_zd_tickets", "Support Tickets", "dataset", "MEDIUM", "sys_zendesk"),
  res("res_zd_csat", "CSAT Surveys", "dataset", "LOW", "sys_zendesk"),
  res("res_sf_warehouse", "Warehouse Analytics", "dataset", "CRITICAL", "sys_snowflake"),
  res("res_sf_marketing", "Marketing Segments", "dataset", "MEDIUM", "sys_snowflake"),
  res("res_gd_docs", "Company Documents", "folder", "MEDIUM", "sys_gdrive"),
  res("res_gd_shared", "Shared Drives", "folder", "HIGH", "sys_gdrive"),
  res("res_crm_accounts", "Internal Accounts", "dataset", "HIGH", "sys_internal_crm"),
  res("res_crm_leads", "Internal Leads", "dataset", "MEDIUM", "sys_internal_crm"),
  res("res_contracts", "Contract Repository", "folder", "HIGH", "sys_gdrive"),
  res("res_fin_reports", "Financial Statements", "dataset", "CRITICAL", "sys_snowflake"),
  res("res_hr_records", "Employee Records", "dataset", "HIGH", "sys_internal_crm"),
];

const dataAssets = resources.map((r) => ({
  id: r.id.replace("res_", "da_"),
  name: `${r.name} Data`,
  classification: r.sensitivity === "CRITICAL" || r.sensitivity === "HIGH" ? "CONFIDENTIAL" : "INTERNAL",
  sensitivity: r.sensitivity,
  resourceId: r.id,
}));

// ---------------- Coworkers / Workflows / Agents ----------------
const coworkers = [
  { id: "cw_support", name: "Customer Support Copilot", description: "Triage, escalate and resolve customer support requests.", status: "active", owner: "Maria Chen", environment: "production" },
  { id: "cw_sales", name: "Sales Development Assistant", description: "Prospect research, outreach drafting and lead scoring.", status: "active", owner: "James Patel", environment: "production" },
  { id: "cw_finance", name: "Finance Operations Agent", description: "Invoice processing, refunds and financial reporting.", status: "active", owner: "Aisha Khan", environment: "production" },
  { id: "cw_marketing", name: "Marketing Automation Hub", description: "Campaign reporting and audience segmentation.", status: "active", owner: "Tom Becker", environment: "production" },
  { id: "cw_it", name: "IT Helpdesk Bot", description: "Onboarding, ticket routing and access audits.", status: "active", owner: "Priya Nair", environment: "staging" },
];

const workflows = [
  { id: "wf_support_triage", name: "Support Triage", description: "Classify and route inbound tickets.", status: "active", coworkerId: "cw_support" },
  { id: "wf_support_escalation", name: "Escalation Handler", description: "Escalate high-severity tickets to humans.", status: "active", coworkerId: "cw_support" },
  { id: "wf_kb_assist", name: "Knowledge Assist", description: "Answer agents with KB lookups.", status: "active", coworkerId: "cw_support" },
  { id: "wf_prospect_outreach", name: "Prospect Outreach", description: "Research prospects and draft emails.", status: "active", coworkerId: "cw_sales" },
  { id: "wf_lead_scoring", name: "Lead Scoring", description: "Score inbound leads from CRM data.", status: "active", coworkerId: "cw_sales" },
  { id: "wf_invoice_processing", name: "Invoice Processing", description: "Match and record supplier invoices.", status: "active", coworkerId: "cw_finance" },
  { id: "wf_refund_review", name: "Refund Review", description: "Review and process refund requests.", status: "active", coworkerId: "cw_finance" },
  { id: "wf_financial_reporting", name: "Financial Reporting", description: "Build monthly financial reports.", status: "active", coworkerId: "cw_finance" },
  { id: "wf_campaign_reporting", name: "Campaign Reporting", description: "Aggregate campaign performance.", status: "active", coworkerId: "cw_marketing" },
  { id: "wf_it_onboarding", name: "IT Onboarding", description: "Provision accounts for new hires.", status: "active", coworkerId: "cw_it" },
];

const agents = [
  { id: "ag_triage", name: "Triage Agent", purpose: "Classify inbound support tickets.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_support_triage"] },
  { id: "ag_escalation", name: "Escalation Agent", purpose: "Escalate high-severity tickets.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_support_escalation"] },
  { id: "ag_kb_search", name: "KB Search Agent", purpose: "Retrieve answers from knowledge bases.", status: "active", riskLevel: "LOW", workflowIds: ["wf_kb_assist"] },
  { id: "ag_crm_lookup", name: "CRM Lookup Agent", purpose: "Fetch customer context from CRM.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_support_triage", "wf_support_escalation"] },
  { id: "ag_prospect_research", name: "Prospect Research Agent", purpose: "Research prospects on the web and CRM.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_prospect_outreach"] },
  { id: "ag_email_drafter", name: "Email Drafter Agent", purpose: "Draft outreach emails.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_prospect_outreach"] },
  { id: "ag_lead_scorer", name: "Lead Scoring Agent", purpose: "Score leads from CRM signals.", status: "active", riskLevel: "LOW", workflowIds: ["wf_lead_scoring"] },
  { id: "ag_invoice_processor", name: "Invoice Processor Agent", purpose: "Process supplier invoices.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_invoice_processing"] },
  { id: "ag_refund_agent", name: "Refund Agent", purpose: "Process refunds and payment edits.", status: "active", riskLevel: "CRITICAL", workflowIds: ["wf_refund_review"] },
  { id: "ag_financial_analyst", name: "Financial Analyst Agent", purpose: "Generate financial reports.", status: "active", riskLevel: "HIGH", workflowIds: ["wf_financial_reporting"] },
  { id: "ag_campaign_reporter", name: "Campaign Reporter Agent", purpose: "Aggregate marketing performance.", status: "active", riskLevel: "LOW", workflowIds: ["wf_campaign_reporting"] },
  { id: "ag_audience_builder", name: "Audience Builder Agent", purpose: "Build audience segments.", status: "active", riskLevel: "MEDIUM", workflowIds: ["wf_campaign_reporting"] },
  { id: "ag_onboarding_bot", name: "Onboarding Bot", purpose: "Provision new-hire accounts.", status: "active", riskLevel: "HIGH", workflowIds: ["wf_it_onboarding"] },
  { id: "ag_ticket_router", name: "Ticket Router Agent", purpose: "Route IT tickets to queues.", status: "active", riskLevel: "LOW", workflowIds: ["wf_it_onboarding"] },
  { id: "ag_access_auditor", name: "Access Auditor Agent", purpose: "Audit access grants across systems.", status: "active", riskLevel: "MEDIUM", workflowIds: [] },
];

const skills = [
  { id: "sk_crm_read", name: "CRM Read", category: "data", riskLevel: "MEDIUM" },
  { id: "sk_crm_write", name: "CRM Write", category: "data", riskLevel: "HIGH" },
  { id: "sk_kb_search", name: "Knowledge Search", category: "retrieval", riskLevel: "LOW" },
  { id: "sk_email_send", name: "Email Send", category: "communication", riskLevel: "MEDIUM" },
  { id: "sk_slack_post", name: "Slack Post", category: "communication", riskLevel: "LOW" },
  { id: "sk_web_research", name: "Web Research", category: "retrieval", riskLevel: "LOW" },
  { id: "sk_lead_scoring", name: "Lead Scoring", category: "analytics", riskLevel: "LOW" },
  { id: "sk_payment_read", name: "Payment Read", category: "finance", riskLevel: "HIGH" },
  { id: "sk_payment_write", name: "Payment Write", category: "finance", riskLevel: "CRITICAL" },
  { id: "sk_refund_process", name: "Refund Processing", category: "finance", riskLevel: "CRITICAL" },
  { id: "sk_sql_query", name: "SQL Query", category: "analytics", riskLevel: "MEDIUM" },
  { id: "sk_doc_analysis", name: "Document Analysis", category: "analytics", riskLevel: "MEDIUM" },
  { id: "sk_jira_create", name: "Jira Create", category: "project", riskLevel: "MEDIUM" },
  { id: "sk_provisioning", name: "Account Provisioning", category: "itadmin", riskLevel: "HIGH" },
  { id: "sk_audit_scan", name: "Audit Scan", category: "security", riskLevel: "MEDIUM" },
];

// Agent USES Skill; Skill USES Connector
const agentSkills: { agentId: string; skillId: string }[] = [
  { agentId: "ag_triage", skillId: "sk_crm_read" },
  { agentId: "ag_triage", skillId: "sk_slack_post" },
  { agentId: "ag_escalation", skillId: "sk_slack_post" },
  { agentId: "ag_escalation", skillId: "sk_jira_create" },
  { agentId: "ag_kb_search", skillId: "sk_kb_search" },
  { agentId: "ag_crm_lookup", skillId: "sk_crm_read" }, // shares Salesforce connector with ag_triage & ag_prospect_research
  { agentId: "ag_prospect_research", skillId: "sk_crm_read" },
  { agentId: "ag_prospect_research", skillId: "sk_web_research" },
  { agentId: "ag_email_drafter", skillId: "sk_email_send" },
  { agentId: "ag_lead_scorer", skillId: "sk_lead_scoring" },
  { agentId: "ag_lead_scorer", skillId: "sk_sql_query" },
  { agentId: "ag_invoice_processor", skillId: "sk_doc_analysis" },
  { agentId: "ag_invoice_processor", skillId: "sk_sql_query" },
  { agentId: "ag_refund_agent", skillId: "sk_refund_process" },
  { agentId: "ag_refund_agent", skillId: "sk_payment_write" },
  { agentId: "ag_refund_agent", skillId: "sk_payment_read" },
  { agentId: "ag_financial_analyst", skillId: "sk_sql_query" },
  { agentId: "ag_financial_analyst", skillId: "sk_doc_analysis" },
  { agentId: "ag_campaign_reporter", skillId: "sk_sql_query" },
  { agentId: "ag_audience_builder", skillId: "sk_crm_write" },
  { agentId: "ag_onboarding_bot", skillId: "sk_provisioning" },
  { agentId: "ag_ticket_router", skillId: "sk_jira_create" },
  { agentId: "ag_access_auditor", skillId: "sk_audit_scan" },
];

const skillConnectors: { skillId: string; connectorId: string }[] = [
  { skillId: "sk_crm_read", connectorId: "conn_salesforce" },
  { skillId: "sk_crm_write", connectorId: "conn_salesforce" },
  { skillId: "sk_kb_search", connectorId: "conn_gdrive" },
  { skillId: "sk_email_send", connectorId: "conn_gmail" },
  { skillId: "sk_slack_post", connectorId: "conn_slack" },
  { skillId: "sk_web_research", connectorId: "conn_gdrive" },
  { skillId: "sk_lead_scoring", connectorId: "conn_internal_crm" },
  { skillId: "sk_payment_read", connectorId: "conn_stripe" },
  { skillId: "sk_payment_write", connectorId: "conn_stripe" },
  { skillId: "sk_refund_process", connectorId: "conn_stripe" },
  { skillId: "sk_sql_query", connectorId: "conn_snowflake" },
  { skillId: "sk_doc_analysis", connectorId: "conn_gdrive" },
  { skillId: "sk_jira_create", connectorId: "conn_jira" },
  { skillId: "sk_provisioning", connectorId: "conn_internal_crm" },
  { skillId: "sk_audit_scan", connectorId: "conn_snowflake" },
];

const knowledgeBases = [
  { id: "kb_support_macros", name: "Support Macros", description: "Canned responses and macros.", agentIds: ["ag_triage", "ag_kb_search"] },
  { id: "kb_product_docs", name: "Product Docs", description: "Product documentation.", agentIds: ["ag_kb_search", "ag_escalation"] },
  { id: "kb_sales_playbooks", name: "Sales Playbooks", description: "Outreach playbooks.", agentIds: ["ag_prospect_research", "ag_email_drafter"] },
  { id: "kb_finance_policy", name: "Finance Policy", description: "Expense and refund policy.", agentIds: ["ag_refund_agent", "ag_invoice_processor", "ag_financial_analyst"] },
  { id: "kb_it_runbooks", name: "IT Runbooks", description: "Ops runbooks.", agentIds: ["ag_onboarding_bot", "ag_access_auditor"] },
];

const documents = knowledgeBases.flatMap((kb, ki) =>
  Array.from({ length: 6 }, (_, i) => ({
    id: `doc_${kb.id.replace("kb_", "")}_${i + 1}`,
    title: `${kb.name} Article ${i + 1}`,
    classification: (ki * 6 + i) % 7 === 0 ? "CONFIDENTIAL" : "INTERNAL",
    knowledgeBaseId: kb.id,
  }))
);

const permissions = [
  { id: "perm_read_crm", action: "READ", scope: "resource:res_sf_customers", effect: "ALLOW" },
  { id: "perm_write_crm", action: "WRITE", scope: "resource:res_sf_customers", effect: "ALLOW" },
  { id: "perm_read_opportunities", action: "READ", scope: "resource:res_sf_opportunities", effect: "ALLOW" },
  { id: "perm_read_payments", action: "READ", scope: "resource:res_stripe_payments", effect: "ALLOW" },
  { id: "perm_write_payments", action: "WRITE", scope: "resource:res_stripe_payments", effect: "ALLOW" },
  { id: "perm_process_refunds", action: "DELETE", scope: "resource:res_stripe_refunds", effect: "ALLOW" },
  { id: "perm_read_warehouse", action: "READ", scope: "system:sys_snowflake", effect: "ALLOW" },
  { id: "perm_export_pii", action: "EXPORT", scope: "resource:res_gd_shared", effect: "ALLOW" },
  { id: "perm_read_docs", action: "READ", scope: "resource:res_gd_docs", effect: "ALLOW" },
  { id: "perm_send_email", action: "WRITE", scope: "resource:res_gmail_inbox", effect: "ALLOW" },
  { id: "perm_read_slack", action: "READ", scope: "resource:res_slack_messages", effect: "ALLOW" },
  { id: "perm_create_jira", action: "WRITE", scope: "resource:res_jira_tickets", effect: "ALLOW" },
  { id: "perm_read_inbox", action: "READ", scope: "resource:res_gmail_inbox", effect: "ALLOW" },
  { id: "perm_read_tickets", action: "READ", scope: "resource:res_zd_tickets", effect: "ALLOW" },
  { id: "perm_all_resources", action: "READ", scope: "resource:*", effect: "ALLOW" }, // broad scope
  { id: "perm_provision_accounts", action: "WRITE", scope: "resource:res_crm_accounts", effect: "ALLOW" },
  { id: "perm_read_hr", action: "READ", scope: "resource:res_hr_records", effect: "ALLOW" },
  { id: "perm_read_contracts", action: "READ", scope: "resource:res_contracts", effect: "ALLOW" },
  { id: "perm_read_financials", action: "READ", scope: "resource:res_fin_reports", effect: "ALLOW" },
  { id: "perm_write_campaigns", action: "WRITE", scope: "resource:res_hs_campaigns", effect: "ALLOW" },
];

const approvalGates = [
  { id: "gate_manager", name: "Manager Approval", required: true, approverRole: "Manager" },
  { id: "gate_finance", name: "Finance Approval", required: true, approverRole: "FinanceController" },
  { id: "gate_security", name: "Security Approval", required: true, approverRole: "SecurityOfficer" },
  { id: "gate_hr", name: "HR Approval", required: true, approverRole: "HROfficer" },
  { id: "gate_dpo", name: "DPO Approval", required: true, approverRole: "DataProtectionOfficer" },
  { id: "gate_it_lead", name: "IT Lead Approval", required: true, approverRole: "ITLead" },
  { id: "gate_dual_control", name: "Dual Control", required: true, approverRole: "SecondApprover" },
  { id: "gate_legal", name: "Legal Approval", required: true, approverRole: "LegalCounsel" },
];

const policies = [
  { id: "pol_allow_crm_read", name: "Allow CRM Read", description: "Agents may read Salesforce records.", effect: "ALLOW", priority: 10, permissionIds: ["perm_read_crm", "perm_read_opportunities"], gateIds: [], agentIds: ["ag_triage", "ag_crm_lookup", "ag_prospect_research"] },
  { id: "pol_block_payment_write", name: "Block Payment Write", description: "No agent may write payments without approval.", effect: "DENY", priority: 90, permissionIds: ["perm_write_payments"], gateIds: ["gate_finance"], agentIds: ["ag_refund_agent"] },
  { id: "pol_refund_approval", name: "Refund Approval Required", description: "Refunds require finance approval.", effect: "ALLOW_WITH_APPROVAL", priority: 80, permissionIds: ["perm_process_refunds"], gateIds: ["gate_finance", "gate_dual_control"], agentIds: ["ag_refund_agent"] },
  { id: "pol_allow_kb_read", name: "Allow KB Read", description: "Agents may read knowledge bases.", effect: "ALLOW", priority: 5, permissionIds: ["perm_read_docs"], gateIds: [], agentIds: ["ag_kb_search", "ag_triage"] },
  { id: "pol_block_pii_export", name: "Block PII Export", description: "PII export is denied by default.", effect: "DENY", priority: 95, permissionIds: ["perm_export_pii"], gateIds: ["gate_dpo"], agentIds: ["ag_crm_lookup", "ag_access_auditor"] },
  { id: "pol_allow_email_send", name: "Allow Email Send", description: "Sales agents may send email.", effect: "ALLOW", priority: 10, permissionIds: ["perm_send_email"], gateIds: [], agentIds: ["ag_email_drafter"] },
  { id: "pol_allow_jira_write", name: "Allow Jira Write", description: "Agents may create Jira tickets.", effect: "ALLOW", priority: 10, permissionIds: ["perm_create_jira"], gateIds: [], agentIds: ["ag_escalation", "ag_ticket_router"] },
  { id: "pol_deny_hr_access", name: "Deny HR Access", description: "HR records are off limits to agents.", effect: "DENY", priority: 92, permissionIds: ["perm_read_hr"], gateIds: ["gate_hr"], agentIds: ["ag_onboarding_bot", "ag_access_auditor"] },
  // Policy conflict: opposite effects on the same agent (ag_financial_analyst)
  { id: "pol_conflict_allow_export", name: "Allow Data Export", description: "Analysts may export reporting data.", effect: "ALLOW", priority: 50, permissionIds: ["perm_export_pii"], gateIds: [], agentIds: ["ag_financial_analyst", "ag_campaign_reporter"] },
  { id: "pol_conflict_block_export", name: "Block Data Export", description: "Data export is blocked pending review.", effect: "DENY", priority: 60, permissionIds: ["perm_export_pii"], gateIds: ["gate_dpo"], agentIds: ["ag_financial_analyst"] },
  { id: "pol_allow_warehouse_read", name: "Allow Warehouse Read", description: "Analytics agents may query the warehouse.", effect: "ALLOW", priority: 10, permissionIds: ["perm_read_warehouse"], gateIds: [], agentIds: ["ag_financial_analyst", "ag_campaign_reporter", "ag_lead_scorer"] },
  { id: "pol_it_provisioning", name: "IT Provisioning Approval", description: "Provisioning requires IT lead approval.", effect: "ALLOW_WITH_APPROVAL", priority: 70, permissionIds: ["perm_provision_accounts"], gateIds: ["gate_it_lead"], agentIds: ["ag_onboarding_bot"] },
];

// Direct access (Agent CAN_ACCESS Resource) — ag_refund_agent is the excessive-permission case
const directAccess: { agentId: string; resourceId: string }[] = [
  { agentId: "ag_triage", resourceId: "res_zd_tickets" },
  { agentId: "ag_crm_lookup", resourceId: "res_sf_customers" },
  { agentId: "ag_refund_agent", resourceId: "res_stripe_payments" },
  { agentId: "ag_refund_agent", resourceId: "res_stripe_refunds" },
  { agentId: "ag_refund_agent", resourceId: "res_hr_records" }, // excessive
  { agentId: "ag_refund_agent", resourceId: "res_gd_shared" }, // excessive
  { agentId: "ag_refund_agent", resourceId: "res_fin_reports" }, // excessive
  { agentId: "ag_financial_analyst", resourceId: "res_fin_reports" },
  { agentId: "ag_onboarding_bot", resourceId: "res_crm_accounts" },
  { agentId: "ag_access_auditor", resourceId: "res_gd_docs" },
];

const users = [
  { id: "user_maria", name: "Maria Chen", role: "SupportLead", coworkerIds: ["cw_support"] },
  { id: "user_james", name: "James Patel", role: "SalesDirector", coworkerIds: ["cw_sales"] },
  { id: "user_aisha", name: "Aisha Khan", role: "FinanceController", coworkerIds: ["cw_finance"] },
  { id: "user_tom", name: "Tom Becker", role: "MarketingOps", coworkerIds: ["cw_marketing"] },
  { id: "user_priya", name: "Priya Nair", role: "ITLead", coworkerIds: ["cw_it"] },
  { id: "user_dana", name: "Dana Ortiz", role: "SecurityOfficer", coworkerIds: [] },
  { id: "user_ken", name: "Ken Watanabe", role: "DataProtectionOfficer", coworkerIds: [] },
  { id: "user_lea", name: "Lea Fischer", role: "PlatformAdmin", coworkerIds: [] },
];

const ACTION_TYPES = ["READ_RECORD", "WRITE_RECORD", "DELETE_RECORD", "SEND_EMAIL", "CREATE_TICKET", "EXPORT_DATA", "PROCESS_REFUND", "QUERY_DATA"];
const ACTION_STATUSES = ["ALLOWED", "BLOCKED", "ALLOWED_WITH_APPROVAL"];
const actions = Array.from({ length: 50 }, (_, i) => {
  const type = ACTION_TYPES[i % ACTION_TYPES.length];
  const status = ACTION_STATUSES[(i * 3 + 1) % ACTION_STATUSES.length];
  const agent = agents[i % agents.length];
  const resource = resources[(i * 7) % resources.length];
  const policy = policies[(i * 5) % policies.length];
  const day = (i % 28) + 1;
  return {
    id: `act_${String(i + 1).padStart(3, "0")}`,
    type,
    timestamp: `2026-08-${String(day).padStart(2, "0")}T${String(8 + (i % 10)).padStart(2, "0")}:${String((i * 7) % 60).padStart(2, "0")}:00Z`,
    status,
    reason: `${type} via ${agent.name}`,
    agentId: agent.id,
    resourceId: resource.id,
    policyId: policy.id,
  };
});

async function main() {
  const driver = initDriver(env.uri, env.username, env.password);
  const session = driver.session({ defaultAccessMode: "WRITE" });
  try {
    // 1. Clear only nodes created by this seed. The database may contain
    // unrelated graphs that use labels such as Skill, so labels alone are not
    // a safe ownership boundary.
    const cleared = await session.run(
      `MATCH (n) WHERE n.controlGraphDataset = true DETACH DELETE n RETURN count(n) AS deleted`
    );
    console.log(`Cleared ${cleared.records[0]?.get("deleted")} nodes from the ControlGraph dataset.`);

    const run = (cypher: string, params: Record<string, unknown>, what: string) =>
      session.run(cypher, params).then((r) => {
        const c = r.summary.counters;
        console.log(`Created ${what}`);
        return r;
      });

    // 2. Nodes via UNWIND
    await run(
      `UNWIND $rows AS row CREATE (n:System) SET n = row, n.controlGraphDataset = true`,
      { rows: systems }, `Systems (${systems.length})`
    );
    await run(`UNWIND $rows AS row CREATE (n:Connector) SET n = row, n.controlGraphDataset = true`, { rows: connectors }, `Connectors (${connectors.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Resource) SET n = row, n.controlGraphDataset = true`, { rows: resources.map(({ systemId, ...r }) => r) }, `Resources (${resources.length})`);
    await run(`UNWIND $rows AS row CREATE (n:DataAsset) SET n = row, n.controlGraphDataset = true`, { rows: dataAssets.map(({ resourceId, ...d }) => d) }, `DataAssets (${dataAssets.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Coworker) SET n = row, n.controlGraphDataset = true`, { rows: coworkers }, `Coworkers (${coworkers.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Workflow) SET n = row, n.controlGraphDataset = true`, { rows: workflows.map(({ coworkerId, ...w }) => w) }, `Workflows (${workflows.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Agent) SET n = row, n.controlGraphDataset = true`, { rows: agents.map((a) => ({ id: a.id, name: a.name, purpose: a.purpose, status: a.status, riskLevel: a.riskLevel })) }, `Agents (${agents.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Skill) SET n = row, n.controlGraphDataset = true`, { rows: skills }, `Skills (${skills.length})`);
    await run(`UNWIND $rows AS row CREATE (n:KnowledgeBase) SET n = row, n.controlGraphDataset = true`, { rows: knowledgeBases.map(({ agentIds, ...k }) => k) }, `KnowledgeBases (${knowledgeBases.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Document) SET n = row, n.controlGraphDataset = true`, { rows: documents.map(({ knowledgeBaseId, ...d }) => d) }, `Documents (${documents.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Permission) SET n = row, n.controlGraphDataset = true`, { rows: permissions }, `Permissions (${permissions.length})`);
    await run(`UNWIND $rows AS row CREATE (n:ApprovalGate) SET n = row, n.controlGraphDataset = true`, { rows: approvalGates }, `ApprovalGates (${approvalGates.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Policy) SET n = row, n.controlGraphDataset = true`, { rows: policies.map(({ permissionIds, gateIds, agentIds, ...p }) => p) }, `Policies (${policies.length})`);
    await run(`UNWIND $rows AS row CREATE (n:Action) SET n = row, n.controlGraphDataset = true`, { rows: actions.map(({ agentId, resourceId, policyId, ...a }) => a) }, `Actions (${actions.length})`);
    await run(`UNWIND $rows AS row CREATE (n:User) SET n = row, n.controlGraphDataset = true`, { rows: users.map(({ coworkerIds, ...u }) => u) }, `Users (${users.length})`);

    // 3. Relationships
    await run(`UNWIND $rows AS r MATCH (a:Connector {id:r.from}), (b:System {id:r.to}) CREATE (a)-[:CONNECTS_TO]->(b)`,
      { rows: connectors.map((c) => ({ from: c.id, to: `sys_${c.id.replace("conn_", "")}` })) }, "Connector-CONNECTS_TO->System");
    await run(`UNWIND $rows AS r MATCH (a:System {id:r.from}), (b:Resource {id:r.to}) CREATE (a)-[:PROVIDES]->(b)`,
      { rows: resources.map((x) => ({ from: x.systemId, to: x.id })) }, "System-PROVIDES->Resource");
    await run(`UNWIND $rows AS r MATCH (a:Resource {id:r.from}), (b:DataAsset {id:r.to}) CREATE (a)-[:CONTAINS]->(b)`,
      { rows: dataAssets.map((x) => ({ from: x.resourceId, to: x.id })) }, "Resource-CONTAINS->DataAsset");
    await run(`UNWIND $rows AS r MATCH (a:Coworker {id:r.from}), (b:Workflow {id:r.to}) CREATE (a)-[:CONTAINS]->(b)`,
      { rows: workflows.map((x) => ({ from: x.coworkerId, to: x.id })) }, "Coworker-CONTAINS->Workflow");
    const workflowSteps = workflows.flatMap((w, i) =>
      (agents.filter((a) => a.workflowIds.includes(w.id))).map((a, j) => ({ from: w.id, to: a.id, order: i * 10 + j }))
    );
    // ensure every workflow has at least one step and every agent appears in a workflow
    const orphanAgents = agents.filter((a) => !workflowSteps.some((s) => s.to === a.id));
    const extraSteps = orphanAgents.map((a, j) => ({ from: workflows[j % workflows.length].id, to: a.id, order: 900 + j }));
    await run(`UNWIND $rows AS r MATCH (a:Workflow {id:r.from}), (b:Agent {id:r.to}) CREATE (a)-[:HAS_STEP {order:r.order}]->(b)`,
      { rows: [...workflowSteps, ...extraSteps] }, "Workflow-HAS_STEP->Agent");
    await run(`UNWIND $rows AS r MATCH (a:Agent {id:r.from}), (b:Skill {id:r.to}) CREATE (a)-[:USES]->(b)`,
      { rows: agentSkills.map((x) => ({ from: x.agentId, to: x.skillId })) }, "Agent-USES->Skill");
    await run(`UNWIND $rows AS r MATCH (a:Skill {id:r.from}), (b:Connector {id:r.to}) CREATE (a)-[:USES]->(b)`,
      { rows: skillConnectors.map((x) => ({ from: x.skillId, to: x.connectorId })) }, "Skill-USES->Connector");
    const kbAgentEdges = knowledgeBases.flatMap((kb) => kb.agentIds.map((aid) => ({ from: aid, to: kb.id })));
    await run(`UNWIND $rows AS r MATCH (a:Agent {id:r.from}), (b:KnowledgeBase {id:r.to}) CREATE (a)-[:USES]->(b)`,
      { rows: kbAgentEdges }, "Agent-USES->KnowledgeBase");
    await run(`UNWIND $rows AS r MATCH (a:KnowledgeBase {id:r.from}), (b:Document {id:r.to}) CREATE (a)-[:CONTAINS]->(b)`,
      { rows: documents.map((d) => ({ from: d.knowledgeBaseId, to: d.id })) }, "KnowledgeBase-CONTAINS->Document");
    await run(`UNWIND $rows AS r MATCH (a:Agent {id:r.from}), (b:Resource {id:r.to}) CREATE (a)-[:CAN_ACCESS]->(b)`,
      { rows: directAccess.map((x) => ({ from: x.agentId, to: x.resourceId })) }, "Agent-CAN_ACCESS->Resource");
    const govEdges = policies.flatMap((p) => p.agentIds.map((aid) => ({ from: aid, to: p.id })));
    await run(`UNWIND $rows AS r MATCH (a:Agent {id:r.from}), (b:Policy {id:r.to}) CREATE (a)-[:GOVERNED_BY]->(b)`,
      { rows: govEdges }, "Agent-GOVERNED_BY->Policy");
    const appliesToEdges = govEdges.map((x) => ({ from: x.to, to: x.from }));
    await run(`UNWIND $rows AS r MATCH (a:Policy {id:r.from}), (b:Agent {id:r.to}) CREATE (a)-[:APPLIES_TO]->(b)`,
      { rows: appliesToEdges }, "Policy-APPLIES_TO->Agent");
    const grantEdges = policies.flatMap((p) => p.permissionIds.map((pid) => ({ from: p.id, to: pid })));
    await run(`UNWIND $rows AS r MATCH (a:Policy {id:r.from}), (b:Permission {id:r.to}) CREATE (a)-[:GRANTS]->(b)`,
      { rows: grantEdges }, "Policy-GRANTS->Permission");
    const gateEdges = policies.flatMap((p) => p.gateIds.map((gid) => ({ from: p.id, to: gid })));
    await run(`UNWIND $rows AS r MATCH (a:Policy {id:r.from}), (b:ApprovalGate {id:r.to}) CREATE (a)-[:REQUIRES]->(b)`,
      { rows: gateEdges }, "Policy-REQUIRES->ApprovalGate");
    await run(`UNWIND $rows AS r MATCH (a:Agent {id:r.from}), (b:Action {id:r.to}) CREATE (a)-[:CAN_PERFORM]->(b)`,
      { rows: actions.map((x) => ({ from: x.agentId, to: x.id })) }, "Agent-CAN_PERFORM->Action");
    await run(`UNWIND $rows AS r MATCH (a:Action {id:r.from}), (b:Resource {id:r.to}) CREATE (a)-[:ACCESSED]->(b)`,
      { rows: actions.map((x) => ({ from: x.id, to: x.resourceId })) }, "Action-ACCESSED->Resource");
    await run(`UNWIND $rows AS r MATCH (a:Action {id:r.from}), (b:Policy {id:r.to}) CREATE (a)-[:AUTHORIZED_BY]->(b)`,
      { rows: actions.map((x) => ({ from: x.id, to: x.policyId })) }, "Action-AUTHORIZED_BY->Policy");
    await run(`UNWIND $rows AS r MATCH (a:Action {id:r.from}), (b:Agent {id:r.to}) CREATE (a)-[:EXECUTED_BY]->(b)`,
      { rows: actions.map((x) => ({ from: x.id, to: x.agentId })) }, "Action-EXECUTED_BY->Agent");
    const ownsEdges = users.flatMap((u) => u.coworkerIds.map((cid) => ({ from: u.id, to: cid })));
    await run(`UNWIND $rows AS r MATCH (a:User {id:r.from}), (b:Coworker {id:r.to}) CREATE (a)-[:OWNS]->(b)`,
      { rows: ownsEdges }, "User-OWNS->Coworker");

    // 4. Verify counts
    const verify = await session.run(
      `UNWIND $labels AS label
       MATCH (n) WHERE n.controlGraphDataset = true AND label IN labels(n)
       RETURN label, count(n) AS count ORDER BY label`,
      { labels: APP_LABELS }
    );
    console.log("--- Node counts ---");
    for (const rec of verify.records) {
      console.log(`  ${rec.get("label")}: ${rec.get("count")}`);
    }
    console.log("Seed complete.");
  } finally {
    await session.close();
    await closeDriver();
  }
}

main().catch((err) => {
  console.error("Seed failed:", err instanceof Error ? err.message : err);
  process.exit(1);
});
