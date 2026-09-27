// Einstieg: Umgebung lesen, Next vorbereiten, Server starten, Signale behandeln.
import { parse } from 'node:url';
import next from 'next';
import { erstelleServer } from './app';
import { leseEinspeiseverguetung, leseKonfig, leseStrompreis } from './konfig';
import { log } from './log';
import { leseVersion } from './version';

async function main(): Promise<void> {
  const konfig = leseKonfig(process.env);
  const version = leseVersion(__dirname);
  const strompreis = leseStrompreis(process.env.STROMPREIS_EUR_PRO_KWH, log);
  const einspeiseverguetung = leseEinspeiseverguetung(process.env.EINSPEISEVERGUETUNG_EUR_PRO_KWH, log);

  const app = next({ dev: konfig.dev, hostname: konfig.hostname, port: konfig.port });
  const handle = app.getRequestHandler();
  await app.prepare();
  const upgrade = konfig.dev ? app.getUpgradeHandler() : undefined;

  const server = await erstelleServer({
    port: konfig.port,
    hostname: konfig.hostname,
    mqttUrl: konfig.mqttUrl,
    strompreis,
    einspeiseverguetung,
    version,
    log,
    erlaubteHosts: konfig.erlaubteHosts,
    requestHandler: (req, res) => handle(req, res, parse(req.url ?? '/', true)),
    upgradeHandler: upgrade ? (req, socket, head) => void upgrade(req, socket, head) : undefined,
  });

  let beendet = false;
  const beenden = (signal: string) => {
    if (beendet) return;
    beendet = true;
    log.info('signal', { signal });
    server
      .schliessen()
      .catch((fehler: unknown) => log.fehler('stopp_fehler', { grund: fehler instanceof Error ? fehler.message : 'unbekannt' }))
      .finally(() => process.exit(0));
  };
  process.on('SIGTERM', () => beenden('SIGTERM'));
  process.on('SIGINT', () => beenden('SIGINT'));
}

process.on('uncaughtException', (fehler) => {
  log.fehler('absturz', { grund: fehler.message });
  process.exit(1);
});

main().catch((fehler: unknown) => {
  log.fehler('start_fehlgeschlagen', { grund: fehler instanceof Error ? fehler.message : 'unbekannt' });
  process.exit(1);
});
