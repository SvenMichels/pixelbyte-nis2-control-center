import { PrismaClient, RiskStatus } from '@prisma/client';

type RiskSeed = {
    title: string;
    description: string;
    severity: number;
    likelihood: number;
    impact: number;
    status: RiskStatus;
    ownerId?: string | null;
};

export async function seedRisks(prisma: PrismaClient) {
    const users = await prisma.user.findMany({
        where: { email: { in: [ 'admin@pixelbyte.dev', 'security@pixelbyte.dev', 'auditor@pixelbyte.dev' ] } },
        select: { id: true },
    });

    const ownerIds = users.map((u) => u.id);
    const risks: RiskSeed[] = [
        {
            title: 'Weak access control enforcement',
            description: 'Inconsistent enforcement of access controls across systems can allow unauthorized access.',
            severity: 4,
            likelihood: 3,
            impact: 5,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Insufficient data encryption',
            description: 'Sensitive data is not consistently encrypted at rest or in transit.',
            severity: 5,
            likelihood: 2,
            impact: 5,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Backup recovery gaps',
            description: 'Recovery procedures are not regularly tested, leading to uncertain recovery times.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Security awareness gaps',
            description: 'Limited security training increases phishing and social engineering risk.',
            severity: 3,
            likelihood: 4,
            impact: 3,
            status: RiskStatus.MITIGATED,
        },
        {
            title: 'Outdated software exposure',
            description: 'Delayed patching increases exposure to known vulnerabilities.',
            severity: 5,
            likelihood: 4,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Incident response delays',
            description: 'Lack of documented procedures delays containment and recovery.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Flat network architecture',
            description: 'Limited segmentation allows lateral movement between environments.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Missing MFA on critical systems',
            description: 'Only password-based authentication protects privileged access.',
            severity: 3,
            likelihood: 4,
            impact: 3,
            status: RiskStatus.MITIGATED,
        },
        {
            title: 'Third-party access visibility',
            description: 'Incomplete inventory of vendor access and integrations.',
            severity: 3,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Inadequate logging coverage',
            description: 'Critical systems do not forward security logs centrally.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Credential reuse across systems',
            description: 'Shared credentials increase the blast radius of compromises.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Weak secrets management',
            description: 'Secrets are stored in plaintext or shared locations.',
            severity: 5,
            likelihood: 3,
            impact: 5,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Unclear data retention',
            description: 'Retention requirements are not consistently applied.',
            severity: 3,
            likelihood: 2,
            impact: 3,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Excessive privileged access',
            description: 'Too many users have admin rights without justification.',
            severity: 4,
            likelihood: 4,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Insufficient vulnerability management',
            description: 'Scanning cadence does not cover all critical assets.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Untracked shadow IT',
            description: 'Unapproved services store or process sensitive data.',
            severity: 3,
            likelihood: 3,
            impact: 3,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Delayed incident notification',
            description: 'Regulatory notification timelines are at risk.',
            severity: 4,
            likelihood: 2,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Inconsistent asset classification',
            description: 'Assets are not classified, leading to unclear protection requirements.',
            severity: 3,
            likelihood: 3,
            impact: 3,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Insufficient monitoring of admin actions',
            description: 'Privileged activities are not consistently logged or reviewed.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Weak change management',
            description: 'Changes are implemented without peer review or approval.',
            severity: 3,
            likelihood: 3,
            impact: 3,
            status: RiskStatus.MITIGATED,
        },
        {
            title: 'Limited crisis communications',
            description: 'No defined communication plan for major incidents.',
            severity: 4,
            likelihood: 2,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Third-party incident response gaps',
            description: 'Vendors have unclear SLAs for incident notifications.',
            severity: 3,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Weak endpoint hardening',
            description: 'Endpoints lack hardened baselines and configuration controls.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Insufficient DDoS resilience',
            description: 'No tested DDoS response or mitigation service.',
            severity: 4,
            likelihood: 2,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Limited supplier exit planning',
            description: 'No exit plan for critical suppliers and processors.',
            severity: 3,
            likelihood: 2,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Incomplete audit trail coverage',
            description: 'Key business systems are missing audit logging.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Security tooling sprawl',
            description: 'Overlapping tools reduce detection efficiency.',
            severity: 3,
            likelihood: 3,
            impact: 3,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Limited security KPI visibility',
            description: 'Security metrics are not shared consistently with leadership.',
            severity: 3,
            likelihood: 2,
            impact: 3,
            status: RiskStatus.MITIGATED,
        },
        {
            title: 'Weak data loss prevention',
            description: 'No consistent DLP controls for sensitive data.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
        },
        {
            title: 'Unverified backups',
            description: 'Backups exist but restoration tests are outdated.',
            severity: 4,
            likelihood: 2,
            impact: 4,
            status: RiskStatus.ASSESSED,
        },
        {
            title: 'Incomplete threat intelligence use',
            description: 'Threat intel is not integrated into detection workflows.',
            severity: 3,
            likelihood: 2,
            impact: 3,
            status: RiskStatus.IDENTIFIED,
        },
    ].map((risk, index) => ({
        ...risk,
        ownerId: ownerIds.length > 0 ? ownerIds[index % ownerIds.length] : null,
    }));

    console.log('Seeding risks...');

    for (const risk of risks) {
        const existing = await prisma.risk.findFirst({ where: { title: risk.title } });

        if (existing) {
            await prisma.risk.update({
                where: { id: existing.id },
                data: {
                    description: risk.description,
                    severity: risk.severity,
                    likelihood: risk.likelihood,
                    impact: risk.impact,
                    status: risk.status,
                    ownerId: risk.ownerId ?? null,
                },
            });
        } else {
            await prisma.risk.create({ data: risk });
        }
    }

    return { count: risks.length };
}
