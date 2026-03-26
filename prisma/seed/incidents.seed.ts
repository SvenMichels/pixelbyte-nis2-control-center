import { IncidentSeverity, IncidentStatus, PrismaClient } from '@prisma/client';

interface SeedIncident {
    title: string;
    description: string;
    severity: IncidentSeverity;
    status: IncidentStatus;
    reportedAt: Date;
    resolvedAt: Date | null;
}

function daysAgo(days: number): Date {
    return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

export async function seedIncidents(prisma: PrismaClient) {
    const users = await prisma.user.findMany({ select: { id: true, email: true } });
    const admin = users.find((u) => u.email === 'admin@pixelbyte.dev');
    const security = users.find((u) => u.email === 'security@pixelbyte.dev');

    const incidents: SeedIncident[] = [
        {
            title: 'Ransomware-Angriff auf Dateiserver',
            description: 'Am 15. März wurde eine Ransomware-Verschlüsselung auf dem zentralen Dateiserver erkannt. Mehrere Abteilungen waren betroffen. Die Backup-Wiederherstellung wurde eingeleitet.',
            severity: IncidentSeverity.CRITICAL,
            status: IncidentStatus.RESOLVED,
            reportedAt: daysAgo(11),
            resolvedAt: daysAgo(8),
        },
        {
            title: 'Phishing-Kampagne gegen Mitarbeiter',
            description: 'Eine gezielte Phishing-Kampagne wurde identifiziert, bei der Mitarbeiter-Credentials abgefangen werden sollten. 3 von 150 Mitarbeitern haben auf den Link geklickt.',
            severity: IncidentSeverity.HIGH,
            status: IncidentStatus.CONTAINED,
            reportedAt: daysAgo(5),
            resolvedAt: null,
        },
        {
            title: 'Unbefugter Zugriff auf Admin-Panel',
            description: 'Mehrere fehlgeschlagene Login-Versuche auf das Admin-Panel aus einer externen IP-Adresse wurden erkannt. IP wurde blockiert, Brute-Force-Schutz aktiviert.',
            severity: IncidentSeverity.MEDIUM,
            status: IncidentStatus.REPORTED_24H,
            reportedAt: daysAgo(3),
            resolvedAt: null,
        },
        {
            title: 'SSL-Zertifikat abgelaufen',
            description: 'Das SSL-Zertifikat des internen Monitoring-Systems ist abgelaufen. Benutzer erhielten Sicherheitswarnungen. Zertifikat wurde innerhalb von 2 Stunden erneuert.',
            severity: IncidentSeverity.LOW,
            status: IncidentStatus.CLOSED,
            reportedAt: daysAgo(20),
            resolvedAt: daysAgo(20),
        },
        {
            title: 'Datenleck in Cloud-Storage',
            description: 'Ein S3-Bucket war kurzzeitig öffentlich zugänglich. Interne Dokumente waren potenziell exponiert. Zugriffslogs werden ausgewertet.',
            severity: IncidentSeverity.CRITICAL,
            status: IncidentStatus.ANALYSING,
            reportedAt: daysAgo(1),
            resolvedAt: null,
        },
        {
            title: 'DDoS-Angriff auf Webserver',
            description: 'Distributed Denial of Service Angriff auf die öffentliche Webseite. Cloudflare DDoS Protection hat den Großteil abgefangen. Kurzer Ausfall von ca. 15 Minuten.',
            severity: IncidentSeverity.HIGH,
            status: IncidentStatus.REPORT_FINAL,
            reportedAt: daysAgo(25),
            resolvedAt: daysAgo(25),
        },
        {
            title: 'Malware auf Entwickler-Laptop',
            description: 'Auf einem Entwickler-Laptop wurde Malware erkannt. Gerät wurde isoliert, forensische Analyse läuft. Keine Ausbreitung im Netzwerk festgestellt.',
            severity: IncidentSeverity.MEDIUM,
            status: IncidentStatus.DETECTED,
            reportedAt: daysAgo(0),
            resolvedAt: null,
        },
        {
            title: 'Kompromittiertes Dienstkonto',
            description: 'Ein Dienstkonto mit erhöhten Rechten wurde kompromittiert. Passwort wurde sofort geändert, alle Sessions invalidiert. Audit-Log-Analyse läuft.',
            severity: IncidentSeverity.HIGH,
            status: IncidentStatus.CONTAINED,
            reportedAt: daysAgo(7),
            resolvedAt: null,
        },
    ];

    const ownerPool = [admin, security].filter(Boolean);

    let created = 0;
    for (let i = 0; i < incidents.length; i++) {
        const inc = incidents[i];
        const owner = ownerPool[i % ownerPool.length];

        const exists = await prisma.incident.findFirst({
            where: { title: inc.title },
            select: { id: true },
        });

        if (exists) continue;

        await prisma.incident.create({
            data: {
                title: inc.title,
                description: inc.description,
                severity: inc.severity,
                status: inc.status,
                reportedAt: inc.reportedAt,
                resolvedAt: inc.resolvedAt,
                ownerId: owner?.id ?? null,
                createdAt: inc.reportedAt,
            },
        });
        created++;
    }

    return { count: created };
}

