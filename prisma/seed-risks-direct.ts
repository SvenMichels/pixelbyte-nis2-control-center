import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, RiskStatus } from '@prisma/client';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log(' Seeding risks with complete demo data...');

    const existingCount = await prisma.risk.count();

    if (existingCount > 0) {
        console.log(` ${existingCount} risks already exist, skipping seed`);
        return;
    }

    const users = await prisma.user.findMany();
    const adminUser = users.find(u => u.role === 'ADMIN');
    const securityUser = users.find(u => u.role === 'SECURITY');

    const controls = await prisma.control.findMany();

    const risks = [
        {
            title: 'Unzureichende Zugriffskontrollen',
            description: 'Fehlende oder schwache Authentifizierungs- und Autorisierungsmechanismen können zu unbefugtem Zugriff auf kritische Systeme führen.',
            severity: 4,
            likelihood: 3,
            impact: 5,
            status: RiskStatus.IDENTIFIED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'Fehlende Datenverschlüsselung',
            description: 'Sensitive Daten werden nicht oder nur teilweise verschlüsselt übertragen und gespeichert.',
            severity: 5,
            likelihood: 2,
            impact: 5,
            status: RiskStatus.ASSESSED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'Unzureichende Backup-Strategie',
            description: 'Keine regelmäßigen Backups oder fehlende Wiederherstellungsprozesse gefährden die Geschäftskontinuität.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
            ownerId: adminUser?.id || null,
        },
        {
            title: 'Mangelnde Mitarbeiterschulung',
            description: 'Fehlende Awareness-Trainings erhöhen das Risiko für Social Engineering und Phishing-Angriffe.',
            severity: 3,
            likelihood: 4,
            impact: 3,
            status: RiskStatus.MITIGATED,
            ownerId: adminUser?.id || null,
        },
        {
            title: 'Veraltete Software und Systeme',
            description: 'Nicht gepatchte Systeme und veraltete Software-Versionen bieten Angriffsflächen für bekannte Schwachstellen.',
            severity: 5,
            likelihood: 4,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'Fehlende Incident Response Prozesse',
            description: 'Keine dokumentierten Prozesse zur Behandlung von Sicherheitsvorfällen verzögern die Reaktionszeit.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.ASSESSED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'Unzureichende Netzwerksegmentierung',
            description: 'Flache Netzwerkarchitekturen ermöglichen laterale Bewegungen bei erfolgreichen Angriffen.',
            severity: 4,
            likelihood: 3,
            impact: 4,
            status: RiskStatus.IDENTIFIED,
            ownerId: adminUser?.id || null,
        },
        {
            title: 'Fehlende Multi-Faktor-Authentifizierung',
            description: 'Nur Passwort-basierte Authentifizierung bei kritischen Systemen.',
            severity: 3,
            likelihood: 4,
            impact: 3,
            status: RiskStatus.MITIGATED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'DDoS-Angriffe auf kritische Infrastruktur',
            description: 'Fehlende DDoS-Protection und Skalierbarkeit können zu Ausfällen führen.',
            severity: 5,
            likelihood: 3,
            impact: 5,
            status: RiskStatus.IDENTIFIED,
            ownerId: securityUser?.id || null,
        },
        {
            title: 'Supply Chain Angriffe',
            description: 'Kompromittierte Drittanbieter-Software oder -Services können Angriffsvektoren öffnen.',
            severity: 4,
            likelihood: 2,
            impact: 5,
            status: RiskStatus.ASSESSED,
            ownerId: adminUser?.id || null,
        },
    ];

    const createdRisks = await Promise.all(
      risks.map((risk) => prisma.risk.create({ data: risk })),
    );

    console.log(`  Created ${createdRisks.length} risks`);

    if (controls.length > 0) {
        const mappings: Array<{ riskId: string; controlId: string }> = [];

        const accessRisk = createdRisks.find(r => r.title.includes('Zugriffskontrollen'));
        const iamControls = controls.filter(c =>
          c.code.includes('IAM') || c.title.toLowerCase().includes('access') || c.title.toLowerCase().includes('authentifizierung'),
        );
        if (accessRisk && iamControls.length > 0) {
            iamControls.slice(0, 2).forEach(control => {
                mappings.push({ riskId: accessRisk.id, controlId: control.id });
            });
        }

        const cryptoRisk = createdRisks.find(r => r.title.includes('Verschlüsselung'));
        const cryptoControls = controls.filter(c =>
          c.code.includes('CRYPTO') || c.title.toLowerCase().includes('verschlüssel'),
        );
        if (cryptoRisk && cryptoControls.length > 0) {
            cryptoControls.slice(0, 2).forEach(control => {
                mappings.push({ riskId: cryptoRisk.id, controlId: control.id });
            });
        }

        const backupRisk = createdRisks.find(r => r.title.includes('Backup'));
        const backupControls = controls.filter(c =>
          c.code.includes('BACKUP') || c.title.toLowerCase().includes('backup') || c.title.toLowerCase().includes('wiederherstellung'),
        );
        if (backupRisk && backupControls.length > 0) {
            backupControls.slice(0, 2).forEach(control => {
                mappings.push({ riskId: backupRisk.id, controlId: control.id });
            });
        }

        const trainingRisk = createdRisks.find(r => r.title.includes('Mitarbeiterschulung'));
        const trainingControls = controls.filter(c =>
          c.title.toLowerCase().includes('schulung') || c.title.toLowerCase().includes('awareness'),
        );
        if (trainingRisk && trainingControls.length > 0) {
            trainingControls.slice(0, 1).forEach(control => {
                mappings.push({ riskId: trainingRisk.id, controlId: control.id });
            });
        }

        const patchRisk = createdRisks.find(r => r.title.includes('Veraltete Software'));
        const patchControls = controls.filter(c =>
          c.title.toLowerCase().includes('patch') || c.title.toLowerCase().includes('update'),
        );
        if (patchRisk && patchControls.length > 0) {
            patchControls.slice(0, 2).forEach(control => {
                mappings.push({ riskId: patchRisk.id, controlId: control.id });
            });
        }

        const incidentRisk = createdRisks.find(r => r.title.includes('Incident Response'));
        const irControls = controls.filter(c =>
          c.code.includes('IR') || c.title.toLowerCase().includes('incident') || c.title.toLowerCase().includes('vorfall'),
        );
        if (incidentRisk && irControls.length > 0) {
            irControls.slice(0, 2).forEach(control => {
                mappings.push({ riskId: incidentRisk.id, controlId: control.id });
            });
        }

        const mfaRisk = createdRisks.find(r => r.title.includes('Multi-Faktor'));
        const mfaControls = controls.filter(c =>
          c.title.toLowerCase().includes('mfa') || c.title.toLowerCase().includes('multi-faktor'),
        );
        if (mfaRisk && mfaControls.length > 0) {
            mfaControls.slice(0, 1).forEach(control => {
                mappings.push({ riskId: mfaRisk.id, controlId: control.id });
            });
        }

        const risksWithoutMappings = createdRisks.filter(risk =>
          !mappings.some(m => m.riskId === risk.id),
        );

        risksWithoutMappings.forEach((risk, index) => {
            const availableControls = controls.filter(c =>
              !mappings.some(m => m.controlId === c.id && m.riskId === risk.id),
            );
            const numMappings = index % 3 === 0 ? 0 : (index % 2 === 0 ? 1 : 2);
            availableControls.slice(0, numMappings).forEach(control => {
                mappings.push({ riskId: risk.id, controlId: control.id });
            });
        });

        if (mappings.length > 0) {
            await prisma.riskControl.createMany({
                data: mappings,
                skipDuplicates: true,
            });
            console.log(`  Created ${mappings.length} risk-control mappings`);
        }

        const risksWithMappings = [ ...new Set(mappings.map(m => m.riskId)) ].length;
        const risksWithoutMitigationsCount = createdRisks.length - risksWithMappings;

        console.log(`  Stats:`);
        console.log(`     - Risks with mitigations: ${risksWithMappings}`);
        console.log(`     - Risks without mitigations: ${risksWithoutMitigationsCount}`);
    } else {
        console.log(`  No controls found, skipping risk-control mappings`);
    }

    console.log('  Risk seeding complete.');
}

main()
  .catch((e) => {
      console.error(e);
      process.exit(1);
  })
  .finally(async () => {
      await prisma.$disconnect();
  });

