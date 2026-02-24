import { ControlStatus, PrismaClient } from '@prisma/client';

type ControlSeed = {
    code: string;
    title: string;
    description?: string;
    category?: string;
    status: ControlStatus;
    ownerId?: string | null;
};

const STATUSES: ControlStatus[] = [
    ControlStatus.NOT_STARTED,
    ControlStatus.IN_PROGRESS,
    ControlStatus.IMPLEMENTED,
    ControlStatus.NOT_APPLICABLE,
];

type ControlCatalogItem = {
    code: string;
    title: string;
    description: string;
    category: string;
};

const CONTROL_CATALOG: ControlCatalogItem[] = [
    { code: 'GOV-01', title: 'Security policy management', description: 'Maintain approved security policies and review annually.', category: 'Governance' },
    { code: 'GOV-02', title: 'Risk ownership assignments', description: 'Define risk owners and accountability for all critical risks.', category: 'Governance' },
    { code: 'GOV-03', title: 'Exception management', description: 'Track and approve policy exceptions with expiration dates.', category: 'Governance' },
    { code: 'GOV-04', title: 'Security metrics', description: 'Define KPIs for control effectiveness and risk reduction.', category: 'Governance' },
    { code: 'GOV-05', title: 'Regulatory mapping', description: 'Map controls to NIS2 requirements and update quarterly.', category: 'Governance' },
    { code: 'GOV-06', title: 'Board reporting', description: 'Provide security posture updates to leadership monthly.', category: 'Governance' },

    { code: 'RISK-01', title: 'Risk assessment cadence', description: 'Perform risk assessments at least twice per year.', category: 'Risk Management' },
    { code: 'RISK-02', title: 'Risk scoring model', description: 'Use severity, likelihood, and impact to score risks.', category: 'Risk Management' },
    { code: 'RISK-03', title: 'Risk treatment plans', description: 'Track treatment plans with owners and due dates.', category: 'Risk Management' },
    { code: 'RISK-04', title: 'Residual risk acceptance', description: 'Document residual risks and formal acceptance.', category: 'Risk Management' },
    { code: 'RISK-05', title: 'Third-party risks', description: 'Assess vendor risks before onboarding and annually.', category: 'Risk Management' },
    { code: 'RISK-06', title: 'Risk register accuracy', description: 'Maintain an up-to-date risk register.', category: 'Risk Management' },

    { code: 'IR-01', title: 'Incident response plan', description: 'Maintain and test the incident response plan.', category: 'Incident Response' },
    { code: 'IR-02', title: 'Incident classification', description: 'Define severity tiers for incidents.', category: 'Incident Response' },
    { code: 'IR-03', title: 'On-call escalation', description: 'Establish on-call and escalation procedures.', category: 'Incident Response' },
    { code: 'IR-04', title: 'Post-incident review', description: 'Perform lessons learned reviews within 5 days.', category: 'Incident Response' },
    { code: 'IR-05', title: 'Regulatory notification', description: 'Notify authorities within required timelines.', category: 'Incident Response' },
    { code: 'IR-06', title: 'Tabletop exercises', description: 'Run tabletop exercises quarterly.', category: 'Incident Response' },

    { code: 'LOG-01', title: 'Centralized logging', description: 'Aggregate logs to a centralized platform.', category: 'Logging' },
    { code: 'LOG-02', title: 'Log retention', description: 'Retain security logs for at least 12 months.', category: 'Logging' },
    { code: 'LOG-03', title: 'Alerting coverage', description: 'Alert on critical authentication and admin events.', category: 'Logging' },
    { code: 'LOG-04', title: 'Log integrity', description: 'Protect log integrity with access controls.', category: 'Logging' },
    { code: 'LOG-05', title: 'Sensitive data logging', description: 'Avoid logging secrets and PII by default.', category: 'Logging' },
    { code: 'LOG-06', title: 'Audit log review', description: 'Review audit logs weekly for anomalies.', category: 'Logging' },

    { code: 'AC-01', title: 'Access reviews', description: 'Perform access reviews for privileged users.', category: 'Access Control' },
    { code: 'AC-02', title: 'MFA enforcement', description: 'Enforce MFA for admin and remote access.', category: 'Access Control' },
    { code: 'AC-03', title: 'Least privilege', description: 'Ensure roles grant minimum required permissions.', category: 'Access Control' },
    { code: 'AC-04', title: 'Privileged access monitoring', description: 'Monitor privileged sessions and changes.', category: 'Access Control' },
    { code: 'AC-05', title: 'Account lifecycle', description: 'Disable inactive accounts within 30 days.', category: 'Access Control' },
    { code: 'AC-06', title: 'Service account governance', description: 'Review service account usage and ownership.', category: 'Access Control' },

    { code: 'AM-01', title: 'Asset inventory', description: 'Maintain inventory of critical assets.', category: 'Asset Management' },
    { code: 'AM-02', title: 'Asset classification', description: 'Classify assets based on criticality.', category: 'Asset Management' },
    { code: 'AM-03', title: 'Endpoint hardening', description: 'Apply hardening baselines to endpoints.', category: 'Asset Management' },
    { code: 'AM-04', title: 'Patch management', description: 'Apply critical patches within 15 days.', category: 'Asset Management' },
    { code: 'AM-05', title: 'Vulnerability scanning', description: 'Scan critical assets monthly.', category: 'Asset Management' },
    { code: 'AM-06', title: 'Configuration drift', description: 'Detect and remediate configuration drift.', category: 'Asset Management' },

    { code: 'BC-01', title: 'Business continuity plan', description: 'Maintain and test continuity plans annually.', category: 'Business Continuity' },
    { code: 'BC-02', title: 'Backup verification', description: 'Test backups and restorations quarterly.', category: 'Business Continuity' },
    { code: 'BC-03', title: 'Recovery time objectives', description: 'Define RTOs for critical services.', category: 'Business Continuity' },
    { code: 'BC-04', title: 'Recovery point objectives', description: 'Define RPOs for critical data.', category: 'Business Continuity' },
    { code: 'BC-05', title: 'Alternate processing', description: 'Maintain alternate processing capabilities.', category: 'Business Continuity' },
    { code: 'BC-06', title: 'Crisis communication', description: 'Maintain crisis communication templates.', category: 'Business Continuity' },

    { code: 'SUP-01', title: 'Supplier onboarding', description: 'Perform security review before onboarding.', category: 'Supplier Security' },
    { code: 'SUP-02', title: 'Contractual security clauses', description: 'Include security obligations in contracts.', category: 'Supplier Security' },
    { code: 'SUP-03', title: 'Supplier monitoring', description: 'Monitor suppliers for changes and incidents.', category: 'Supplier Security' },
    { code: 'SUP-04', title: 'Sub-processor visibility', description: 'Track sub-processors and data flows.', category: 'Supplier Security' },
    { code: 'SUP-05', title: 'Vendor incident response', description: 'Require vendor incident notification SLAs.', category: 'Supplier Security' },
    { code: 'SUP-06', title: 'Vendor exit plans', description: 'Define exit plans for critical suppliers.', category: 'Supplier Security' },

    { code: 'NET-01', title: 'Network segmentation', description: 'Segment networks by trust zone.', category: 'Network Security' },
    { code: 'NET-02', title: 'Firewall rule review', description: 'Review firewall rules quarterly.', category: 'Network Security' },
    { code: 'NET-03', title: 'Secure remote access', description: 'Restrict remote access via VPN.', category: 'Network Security' },
    { code: 'NET-04', title: 'DDoS protection', description: 'Implement DDoS mitigation controls.', category: 'Network Security' },
    { code: 'NET-05', title: 'DNS security', description: 'Use DNS filtering for malicious domains.', category: 'Network Security' },
    { code: 'NET-06', title: 'Zero trust network', description: 'Adopt zero trust network principles.', category: 'Network Security' },

    { code: 'MON-01', title: 'Security monitoring', description: 'Monitor security signals 24/7.', category: 'Monitoring' },
    { code: 'MON-02', title: 'Threat intelligence', description: 'Consume threat intel and tune detections.', category: 'Monitoring' },
    { code: 'MON-03', title: 'Anomaly detection', description: 'Detect anomalies in authentication activity.', category: 'Monitoring' },
    { code: 'MON-04', title: 'Detection tuning', description: 'Review and tune detection rules monthly.', category: 'Monitoring' },
    { code: 'MON-05', title: 'Security dashboards', description: 'Maintain dashboards for key security KPIs.', category: 'Monitoring' },
    { code: 'MON-06', title: 'Coverage reporting', description: 'Report control coverage and evidence gaps.', category: 'Monitoring' },
];

export async function seedControls(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        where: { email: { in: [ 'admin@pixelbyte.dev', 'security@pixelbyte.dev', 'auditor@pixelbyte.dev' ] } },
        select: { id: true, email: true },
    });

    const ownerIds = users.map((u) => u.id);
    const controls: ControlSeed[] = CONTROL_CATALOG.map((item, index) => ({
        code: item.code,
        title: item.title,
        description: item.description,
        category: item.category,
        status: STATUSES[index % STATUSES.length],
        ownerId: ownerIds.length > 0 ? ownerIds[index % ownerIds.length] : null,
    }));

    for (const c of controls) {
        await prisma.control.upsert({
            where: { code: c.code },
            update: {
                title: c.title,
                description: c.description,
                category: c.category,
                status: c.status,
                ownerId: c.ownerId ?? null,
            },
            create: c,
        });
    }

    return { count: controls.length };
}
