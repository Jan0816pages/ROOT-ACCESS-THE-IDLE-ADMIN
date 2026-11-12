// ============================================================================
// ROOT ACCESS: THE IDLE ADMIN - GAME DATA & EDUCATIONAL MODULES
// ============================================================================

window.GAME_DATA = {
  stages: [
    { id: 0, name: "Kinderzimmer Homelab", minTotalCompute: 0, badge: "STAGE 01 // HOMELAB" },
    { id: 1, name: "Keller-Serverrack", minTotalCompute: 500, badge: "STAGE 02 // BASEMENT RACK" },
    { id: 2, name: "Startup Serverraum", minTotalCompute: 5000, badge: "STAGE 03 // ON-PREM SERVER ROOM" },
    { id: 3, name: "Regionales Colocation-RZ", minTotalCompute: 50000, badge: "STAGE 04 // COLOCATION DC" },
    { id: 4, name: "Globaler Hyperscale Cloud-Cluster", minTotalCompute: 500000, badge: "STAGE 05 // GLOBAL CLOUD ROOT" }
  ],

  hardware: [
    {
      id: "thinkpad",
      name: "Altes Homelab-Laptop",
      category: "Compute",
      desc: "Ein gebrauchtes ThinkPad mit Debian ohne Displaydeckel. Dein erster eigener Server.",
      baseCost: { traffic: 10, compute: 0, storage: 0 },
      costScale: 1.15,
      prod: { traffic: 2, compute: 3, storage: 1 },
      storageCapBonus: 200,
      rackIcon: "LAPTOP",
      leds: 2
    },
    {
      id: "switch_managed",
      name: "Managed Gigabit Switch",
      category: "Network",
      desc: "24-Port Layer-2 Switch mit VLAN-Tagging (802.1Q) und Port-Mirroring.",
      baseCost: { traffic: 45, compute: 30, storage: 10 },
      costScale: 1.16,
      prod: { traffic: 12, compute: 2, storage: 1 },
      storageCapBonus: 300,
      rackIcon: "SWITCH",
      leds: 8
    },
    {
      id: "rpi_cluster",
      name: "Raspberry Pi K3s Cluster",
      category: "Compute",
      desc: "Vier Platinenrechner mit PoE-HATs für leichtgewichtige Container-Workloads.",
      baseCost: { traffic: 160, compute: 120, storage: 60 },
      costScale: 1.17,
      prod: { traffic: 8, compute: 22, storage: 5 },
      storageCapBonus: 600,
      rackIcon: "PI_CLUSTER",
      leds: 4
    },
    {
      id: "nas_raid",
      name: "NAS Storage Array (RAID 5)",
      category: "Storage",
      desc: "4-Bay Netzwerkspeicher mit Paritäts-Redundanz und schnellem iSCSI-Target.",
      baseCost: { traffic: 380, compute: 260, storage: 180 },
      costScale: 1.17,
      prod: { traffic: 10, compute: 8, storage: 35 },
      storageCapBonus: 3500,
      rackIcon: "NAS",
      leds: 4
    },
    {
      id: "bare_metal",
      name: "19\" 2U Bare-Metal Server",
      category: "Compute",
      desc: "Dual-Socket Xeon mit ECC-RAM, IPMI-Management und redundanten Netzteilen.",
      baseCost: { traffic: 1100, compute: 950, storage: 500 },
      costScale: 1.18,
      prod: { traffic: 35, compute: 90, storage: 25 },
      storageCapBonus: 8000,
      rackIcon: "SERVER_2U",
      leds: 6
    },
    {
      id: "firewall_appliance",
      name: "Next-Gen Hardware Firewall",
      category: "Network",
      desc: "Deep Packet Inspection, WireGuard VPN-Offloading und BGP-Routing in Hardware.",
      baseCost: { traffic: 3400, compute: 2200, storage: 1200 },
      costScale: 1.18,
      prod: { traffic: 180, compute: 45, storage: 20 },
      storageCapBonus: 15000,
      rackIcon: "FIREWALL",
      leds: 6
    },
    {
      id: "blade_chassis",
      name: "High-Density Blade Center",
      category: "Compute",
      desc: "10U Chassis mit 16 Hot-Swap Compute-Blades für massive Virtualisierung.",
      baseCost: { traffic: 9500, compute: 8500, storage: 4800 },
      costScale: 1.19,
      prod: { traffic: 110, compute: 380, storage: 90 },
      storageCapBonus: 40000,
      rackIcon: "BLADE",
      leds: 8
    },
    {
      id: "nvme_san",
      name: "All-Flash NVMe SAN Cluster",
      category: "Storage",
      desc: "Fibre-Channel Storage Area Network mit Sub-Millisekunden-Latenz für Datenbanken.",
      baseCost: { traffic: 24000, compute: 18000, storage: 16000 },
      costScale: 1.19,
      prod: { traffic: 160, compute: 140, storage: 620 },
      storageCapBonus: 180000,
      rackIcon: "SAN",
      leds: 8
    },
    {
      id: "cdn_edge",
      name: "Global Anycast CDN PoP",
      category: "Network",
      desc: "Edge-Caching-Knoten an internationalen Internet-Knotenpunkten (DE-CIX / AMS-IX).",
      baseCost: { traffic: 75000, compute: 50000, storage: 42000 },
      costScale: 1.20,
      prod: { traffic: 1400, compute: 420, storage: 380 },
      storageCapBonus: 450000,
      rackIcon: "CDN",
      leds: 10
    },
    {
      id: "cloud_pod",
      name: "Hyperscale Cloud Spine-Leaf Pod",
      category: "Cloud",
      desc: "Vollautomatisiertes Rechenzentrums-Modul mit 400GbE Spine-Leaf-Architektur.",
      baseCost: { traffic: 250000, compute: 220000, storage: 160000 },
      costScale: 1.21,
      prod: { traffic: 3600, compute: 4200, storage: 2900 },
      storageCapBonus: 2000000,
      rackIcon: "CLOUD",
      leds: 12
    }
  ],

  techTree: [
    {
      id: "tech_bash",
      name: "Bash Automation & Cron Daemons",
      tier: 1,
      cost: { traffic: 150, compute: 150, storage: 50 },
      req: null,
      domain: "Automatisierung",
      effectText: "Schaltet den Auto-Klicker Daemon (2 Klicks/Sek) & +20% Compute frei.",
      bonus: { computeMult: 0.20, autoClickPerSec: 2 }
    },
    {
      id: "tech_vlan",
      name: "IEEE 802.1Q VLAN-Segmentierung",
      tier: 1,
      cost: { traffic: 350, compute: 180, storage: 80 },
      req: null,
      domain: "Netzwerke",
      effectText: "Reduziert Broadcast-Stürme: +50% Traffic-Ertrag dauerhaft.",
      bonus: { trafficMult: 0.50 }
    },
    {
      id: "tech_btree",
      name: "B-Tree Datenbank-Indizierung",
      tier: 2,
      cost: { traffic: 600, compute: 500, storage: 400 },
      req: "tech_bash",
      domain: "Datenbanken",
      effectText: "Optimierte Index-Seeks: +60% Storage-I/O & +50% Storage-Kapazität.",
      bonus: { storageMult: 0.60, storageCapMult: 0.50 }
    },
    {
      id: "tech_tls",
      name: "Zero-Trust Firewall & TLS 1.3",
      tier: 2,
      cost: { traffic: 1200, compute: 900, storage: 450 },
      req: "tech_vlan",
      domain: "Cyber-Security",
      effectText: "+40% Bug-Bounty Belohnungen bei gelösten IT-Challenges & +25% Traffic.",
      bonus: { bountyMult: 0.40, trafficMult: 0.25 }
    },
    {
      id: "tech_docker",
      name: "Docker Containerization Engine",
      tier: 3,
      cost: { traffic: 3500, compute: 4000, storage: 2200 },
      req: "tech_btree",
      domain: "DevOps",
      effectText: "Isolierte Microservices: +75% Compute-Ertrag & +4 Klicks/Sek Daemon.",
      bonus: { computeMult: 0.75, autoClickPerSec: 4 }
    },
    {
      id: "tech_cicd",
      name: "GitOps CI/CD Deployment Pipeline",
      tier: 3,
      cost: { traffic: 8500, compute: 7500, storage: 5000 },
      req: "tech_tls",
      domain: "DevOps",
      effectText: "Automatisierte Tests & Rollouts: +45% auf alle Ressourcen.",
      bonus: { trafficMult: 0.45, computeMult: 0.45, storageMult: 0.45 }
    },
    {
      id: "tech_k8s",
      name: "Kubernetes (K8s) Orchestrierung",
      tier: 4,
      cost: { traffic: 28000, compute: 32000, storage: 20000 },
      req: "tech_docker",
      domain: "Cloud & DevOps",
      effectText: "Self-Healing Pods & Horizontal Autoscaling: +100% auf alle Ressourcen.",
      bonus: { trafficMult: 1.0, computeMult: 1.0, storageMult: 1.0, autoClickPerSec: 8 }
    },
    {
      id: "tech_terraform",
      name: "Global Infrastructure as Code (Terraform)",
      tier: 4,
      cost: { traffic: 95000, compute: 95000, storage: 75000 },
      req: "tech_cicd",
      domain: "Cloud & DevOps",
      effectText: "Multi-Region Cloud-Fabric: +150% auf alle Ressourcen & +100% Storage-Cap.",
      bonus: { trafficMult: 1.5, computeMult: 1.5, storageMult: 1.5, storageCapMult: 1.0 }
    }
  ],

  // --------------------------------------------------------------------------
  // 4.1 NETWORK & SUBNETTING PUZZLES ("VLAN & Routing Manager")
  // --------------------------------------------------------------------------
  subnetChallenges: [
    {
      id: "sub_50_srv",
      difficulty: 1,
      title: "VLAN-Segmentierung: Web-Server Farm",
      baseIp: "192.168.1.0",
      minHosts: 50,
      optimalPrefix: 26,
      acceptablePrefixes: [26],
      scenario: "Erstelle aus dem Netz 192.168.1.0 ein kleinstmögliches Subnetz für mindestens 50 Server (ohne IP-Verschwendung).",
      explanation: "Bei /26 (255.255.255.192) bleiben 6 Host-Bits: 2^6 - 2 = 62 nutzbare Hosts. /27 hätte nur 30 Hosts (zu klein), /25 hätte 126 Hosts (Verschwendung)."
    },
    {
      id: "sub_12_mgmt",
      difficulty: 1,
      title: "Management-VLAN für IPMI-Interfaces",
      baseIp: "10.10.4.0",
      minHosts: 12,
      optimalPrefix: 28,
      acceptablePrefixes: [28],
      scenario: "Segmentiere das Netz 10.10.4.0 für genau 12 Out-of-Band Management-Ports (IPMI/iLO) mit minimaler Subnetzgröße.",
      explanation: "Mit /28 (255.255.255.240) hast du 4 Host-Bits: 2^4 - 2 = 14 nutzbare IP-Adressen. Perfekt für 12 Server!"
    },
    {
      id: "sub_25_db",
      difficulty: 1,
      title: "Datenbank-Replikations-Subnetz",
      baseIp: "172.16.20.0",
      minHosts: 25,
      optimalPrefix: 27,
      acceptablePrefixes: [27],
      scenario: "Richte ein isoliertes Subnetz aus 172.16.20.0 für 25 Datenbank-Nodes und Read-Replicas ein.",
      explanation: "/27 (255.255.255.224) bietet 2^5 - 2 = 30 nutzbare Host-Adressen. /28 (14 Hosts) reicht nicht aus."
    },
    {
      id: "sub_110_vdi",
      difficulty: 2,
      title: "DevOps Worker-Pool Subnetz",
      baseIp: "192.168.100.0",
      minHosts: 110,
      optimalPrefix: 25,
      acceptablePrefixes: [25],
      scenario: "Für 110 dynamische CI/CD Runner-VMs wird ein effizientes Subnetz in 192.168.100.0 benötigt.",
      explanation: "/25 (255.255.255.128) reserviert 7 Host-Bits: 2^7 - 2 = 126 nutzbare Hosts."
    },
    {
      id: "sub_p2p_router",
      difficulty: 2,
      title: "Point-to-Point Core-Router Transfernetz",
      baseIp: "10.255.255.0",
      minHosts: 2,
      optimalPrefix: 30,
      acceptablePrefixes: [30],
      scenario: "Verbinde zwei Core-Router über ein direktes Transfernetz (genau 2 nutzbare IP-Adressen benötigt).",
      explanation: "/30 (255.255.255.252) lässt 2 Host-Bits übrig: 2^2 - 2 = 2 nutzbare Host-IPs. Standard für klassische Point-to-Point Links!"
    },
    {
      id: "sub_5_dmz",
      difficulty: 2,
      title: "DMZ Reverse-Proxy Segment",
      baseIp: "192.168.55.0",
      minHosts: 5,
      optimalPrefix: 29,
      acceptablePrefixes: [29],
      scenario: "In der DMZ sollen 5 gehärtete Reverse-Proxies stehen. Wähle das kleinste passende Subnetz.",
      explanation: "/29 (255.255.255.248) nutzt 3 Host-Bits: 2^3 - 2 = 6 nutzbare Hosts."
    },
    {
      id: "sub_200_k8s",
      difficulty: 3,
      title: "Kubernetes Pod-CIDR Segment (VLSM)",
      baseIp: "10.42.0.0",
      minHosts: 200,
      optimalPrefix: 24,
      acceptablePrefixes: [24],
      scenario: "Ein Kubernetes-Worker-Node benötigt ein Subnetz für mindestens 200 gleichzeitige Pods.",
      explanation: "/24 (255.255.255.0) bietet 8 Host-Bits: 2^8 - 2 = 254 nutzbare IP-Adressen."
    },
    {
      id: "sub_450_cloud",
      difficulty: 3,
      title: "Multi-AZ Cloud VPC Subnetting",
      baseIp: "172.31.0.0",
      minHosts: 450,
      optimalPrefix: 23,
      acceptablePrefixes: [23],
      scenario: "Skaliere das VPC-Subnetz für 450 Microservice-Instanzen in einer Availability Zone (Supernetting / CIDR).",
      explanation: "/23 (255.255.254.0) bündelt zwei /24-Netze (9 Host-Bits): 2^9 - 2 = 510 nutzbare Hosts!"
    }
  ],

  // --------------------------------------------------------------------------
  // 4.2 LINUX-TERMINAL FÜR INCIDENT MANAGEMENT ("CLI Emergency Panel")
  // --------------------------------------------------------------------------
  cliChallenges: [
    {
      id: "cli_chmod_config",
      difficulty: 1,
      title: "Incident #104: Permission Denied bei config.conf",
      alert: "CRITICAL: Webserver kann `config.conf` nicht lesen (Rechte stehen auf 000)!",
      promptContext: "Setze die Dateirechte von `config.conf` auf Standard-Konfigurationsrechte `644` (rw-r--r--).",
      initialOutput: [
        "systemd[1]: nginx.service: Failed to read /etc/app/config.conf: Permission denied",
        "---------- 1 root root 1042 Nov 12 11:58 config.conf",
        "Tipp: Nutze `chmod <oktal> <datei>` zum Ändern von Berechtigungen."
      ],
      hints: ["chmod 644 config.conf", "ls -la", "cat config.conf"],
      acceptedCommands: ["chmod 644 config.conf", "sudo chmod 644 config.conf"],
      successOutput: "mode of 'config.conf' changed from 0000 (---------) to 0644 (rw-r--r--). Service recovered!",
      explanation: "`chmod 644` gibt dem Besitzer Lese-/Schreibrechte (6 = 4+2) und Gruppe/Anderen nur Leserechte (4)."
    },
    {
      id: "cli_kill_zombie",
      difficulty: 1,
      title: "Incident #209: Amoklaufender Worker-Prozess (PID 4096)",
      alert: "HIGH CPU LOAD: Prozess `crypto_miner_rogue` (PID 4096) blockiert 99.8% CPU!",
      promptContext: "Erzwinge das sofortige Beenden des Prozesses mit der PID `4096` mittels SIGKILL (-9).",
      initialOutput: [
        "PID   USER     %CPU %MEM COMMAND",
        "4096  www-data 99.8 42.1 /tmp/crypto_miner_rogue --threads=64",
        "1102  root      0.4  1.2 /usr/sbin/sshd -D"
      ],
      hints: ["kill -9 4096", "ps aux", "top"],
      acceptedCommands: ["kill -9 4096", "sudo kill -9 4096", "kill -SIGKILL 4096", "kill -s 9 4096"],
      successOutput: "[1]+  Killed                  /tmp/crypto_miner_rogue (PID 4096). CPU load dropped to 1.8%!",
      explanation: "`kill -9 <PID>` sendet das Signal SIGKILL, das vom Prozess nicht abgefangen oder ignoriert werden kann."
    },
    {
      id: "cli_rm_syslog",
      difficulty: 1,
      title: "Incident #312: Disk Full (/var/log bei 100%)",
      alert: "STORAGE FULL: Partition `/` ist zu 100% belegt! Alte Logdatei `/var/log/syslog.old` ist 48 GB groß.",
      promptContext: "Prüfe den Speicherplatz oder lösche direkt die veraltete Datei `/var/log/syslog.old`.",
      initialOutput: [
        "Filesystem      Size  Used Avail Use% Mounted on",
        "/dev/sda1        50G   50G    0B 100% /",
        "-rw-r----- 1 syslog adm 48G Nov 01 00:00 /var/log/syslog.old"
      ],
      hints: ["df -h", "rm /var/log/syslog.old", "ls -lh /var/log"],
      acceptedCommands: ["rm /var/log/syslog.old", "rm -f /var/log/syslog.old", "sudo rm /var/log/syslog.old"],
      successOutput: "Removed '/var/log/syslog.old'. 48 GB Speicherplatz freigegeben (/dev/sda1 Use% -> 4%)!",
      explanation: "Mit `df -h` prüft man die Belegung von Dateisystemen, mit `rm /pfad/datei` wird die blockierende Datei gelöscht."
    },
    {
      id: "cli_restart_nginx",
      difficulty: 2,
      title: "Incident #418: 502 Bad Gateway – Nginx Service hängt",
      alert: "SERVICE DOWN: Reverse-Proxy `nginx` reagiert nicht mehr nach Konfigurations-Reload.",
      promptContext: "Starte den Systemd-Dienst `nginx` über `systemctl` neu.",
      initialOutput: [
        "● nginx.service - A high performance web server and a reverse proxy server",
        "   Active: failed (Result: timeout)",
        "Tipp: Verwende `systemctl restart <service>`."
      ],
      hints: ["systemctl restart nginx", "systemctl status nginx"],
      acceptedCommands: ["systemctl restart nginx", "sudo systemctl restart nginx", "service nginx restart", "systemctl restart nginx.service"],
      successOutput: "systemd[1]: Restarted nginx.service. HTTP/2 200 OK healthcheck passed!",
      explanation: "`systemctl restart <unit>` beendet und startet einen Systemd-Daemon sauber neu."
    },
    {
      id: "cli_ufw_https",
      difficulty: 2,
      title: "Incident #505: Firewall blockiert HTTPS (Port 443)",
      alert: "TLS TIMEOUT: Nach dem Aktivieren der Firewall erreicht kein Client mehr Port `443/tcp`.",
      promptContext: "Gib den Port `443/tcp` in der Uncomplicated Firewall (`ufw`) frei.",
      initialOutput: [
        "Status: active",
        "To                         Action      From",
        "22/tcp                     ALLOW       Anywhere",
        "80/tcp                     ALLOW       Anywhere"
      ],
      hints: ["ufw allow 443/tcp", "ufw status", "ufw allow 443"],
      acceptedCommands: ["ufw allow 443/tcp", "sudo ufw allow 443/tcp", "ufw allow 443", "sudo ufw allow 443", "ufw allow https"],
      successOutput: "Rule added: 443/tcp ALLOW Anywhere. HTTPS-Traffic fließt wieder mit voller Geschwindigkeit!",
      explanation: "Mit `ufw allow 443/tcp` wird eingehender HTTPS-Verkehr auf TCP-Port 443 in den Netfilter-Regeln erlaubt."
    },
    {
      id: "cli_chmod_ssh",
      difficulty: 3,
      title: "Incident #621: SSH Private Key ist zu offen ('UNPROTECTED PRIVATE KEY')",
      alert: "SSH REJECTED: `id_rsa` hat Rechte 0644 – OpenSSH verweigert den Schlüssel aus Sicherheitsgründen!",
      promptContext: "Setze die Berechtigungen von `id_rsa` auf `600` (nur Besitzer darf lesen/schreiben).",
      initialOutput: [
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
        "@         WARNING: UNPROTECTED PRIVATE KEY FILE!          @",
        "@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@",
        "Permissions 0644 for 'id_rsa' are too open."
      ],
      hints: ["chmod 600 id_rsa", "ls -l id_rsa"],
      acceptedCommands: ["chmod 600 id_rsa", "chmod 400 id_rsa", "sudo chmod 600 id_rsa"],
      successOutput: "Permissions of 'id_rsa' restricted to 0600 (rw-------). SSH-Key-Authentifizierung erfolgreich!",
      explanation: "Private SSH-Keys dürfen niemals für andere Benutzer lesbar sein (`chmod 600` oder `400`)."
    }
  ],

  // --------------------------------------------------------------------------
  // 4.3 SKRIPTING & AUTOMATISIERUNG ("Cronjob Engine")
  // --------------------------------------------------------------------------
  scriptChallenges: [
    {
      id: "scr_autoscale",
      difficulty: 1,
      lang: "Python 3",
      title: "Auto-Scaler Daemon (CPU-Schwellenwert)",
      desc: "Wenn die CPU-Auslastung über 90% steigt, soll automatisch eine neue Server-Instanz gestartet werden.",
      daemonReward: "Auto-Scaler Daemon (+15% Compute & Auto-Pulse)",
      template: [
        "def monitor_cluster(cpu_usage):",
        "    ___0___ cpu_usage ___1___ 90:",
        "        ___2___()",
        "    else:",
        "        log_status('OK')"
      ],
      blanks: [
        { index: 0, options: ["if", "for", "while", "def"], correct: "if" },
        { index: 1, options: [">", "<", "==", "in"], correct: ">" },
        { index: 2, options: ["scale_up", "shutdown", "drop_db", "sleep"], correct: "scale_up" }
      ],
      explanation: "Mit `if cpu_usage > 90:` prüft das Skript den Schwellenwert und ruft `scale_up()` auf."
    },
    {
      id: "scr_healthcheck",
      difficulty: 1,
      lang: "Python 3",
      title: "Cluster Heartbeat Ping-Loop",
      desc: "Iteriere über alle Server im Cluster-Array und prüfe deren Erreichbarkeit per Ping.",
      daemonReward: "Heartbeat Daemon (+15% Traffic-Stabilität)",
      template: [
        "cluster = ['srv-01', 'srv-02', 'srv-03']",
        "___0___ server ___1___ cluster:",
        "    response = ___2___(server)",
        "    if not response:",
        "        restart_node(server)"
      ],
      blanks: [
        { index: 0, options: ["for", "if", "return", "import"], correct: "for" },
        { index: 1, options: ["in", "==", ">=", "from"], correct: "in" },
        { index: 2, options: ["ping", "delete", "format", "exit"], correct: "ping" }
      ],
      explanation: "`for server in cluster:` durchläuft jedes Element der Liste und führt `ping(server)` aus."
    },
    {
      id: "scr_bash_backup",
      difficulty: 2,
      lang: "Bash",
      title: "Nächtlicher Datenbank-Dump Cronjob",
      desc: "Erstelle ein Bash-Skript, das prüft, ob das Backup-Verzeichnis existiert, und anschließend ein komprimiertes Archiv anlegt.",
      daemonReward: "Backup Cronjob (+20% Storage-Durchsatz)",
      template: [
        "#!/bin/bash",
        "BACKUP_DIR=\"/var/backups/db\"",
        "___0___ [ ! -d \"$BACKUP_DIR\" ]; ___1___",
        "    mkdir -p \"$BACKUP_DIR\"",
        "fi",
        "___2___ -czf \"$BACKUP_DIR/dump.tar.gz\" /var/lib/postgres"
      ],
      blanks: [
        { index: 0, options: ["if", "loop", "case", "when"], correct: "if" },
        { index: 1, options: ["then", "do", "else", "fi"], correct: "then" },
        { index: 2, options: ["tar", "cat", "chmod", "ping"], correct: "tar" }
      ],
      explanation: "In Bash folgt auf `if [ Bedingung ];` immer `then`, und `tar -czf` erstellt ein gzip-komprimiertes Archiv."
    },
    {
      id: "scr_log_cleanup",
      difficulty: 2,
      lang: "Python 3",
      title: "Automatische Log-Rotation & Speicher-Wächter",
      desc: "Bereinige alle Log-Dateien, die größer als 500 MB sind, um Disk-Full-Incidents vorzubeugen.",
      daemonReward: "LogRotate Daemon (+25% Storage & Auto-Klick)",
      template: [
        "def rotate_logs(log_files):",
        "    for file in log_files:",
        "        if file.size_mb ___0___ 500 ___1___ file.is_archived == False:",
        "            file.___2___()"
      ],
      blanks: [
        { index: 0, options: [">=", "==", "<", "!="], correct: ">=" },
        { index: 1, options: ["and", "or", "not", "in"], correct: "and" },
        { index: 2, options: ["compress", "corrupt", "panic", "infinite_loop"], correct: "compress" }
      ],
      explanation: "Mit dem logischen Operator `and` werden beide Bedingungen verknüpft, bevor `file.compress()` aufgerufen wird."
    },
    {
      id: "scr_rate_limiter",
      difficulty: 3,
      lang: "Python 3",
      title: "DDoS Rate-Limiter Middleware",
      desc: "Blockiere IP-Adressen automatisch in der Firewall, wenn sie mehr als 1000 Requests pro Sekunde senden.",
      daemonReward: "DDoS Shield Daemon (+30% Traffic-Ertrag)",
      template: [
        "def inspect_traffic(requests_per_ip):",
        "    for ip, count in requests_per_ip.___0___():",
        "        if count > 1000:",
        "            firewall.___1___(ip)",
        "            ___2___ True"
      ],
      blanks: [
        { index: 0, options: ["items", "keys_only", "pop", "clear"], correct: "items" },
        { index: 1, options: ["block_ip", "allow_all", "open_port", "drop_table"], correct: "block_ip" },
        { index: 2, options: ["return", "break_os", "import", "yield_none"], correct: "return" }
      ],
      explanation: "`.items()` liefert Schlüssel-Wert-Paare (`ip, count`) eines Python-Dictionaries."
    }
  ],

  // --------------------------------------------------------------------------
  // 4.4 SQL-DATENBANK-OPTIMIERUNG ("Query Performance Tuner")
  // --------------------------------------------------------------------------
  sqlChallenges: [
    {
      id: "sql_active_users",
      difficulty: 1,
      title: "Slow Query #01: Aktive Benutzer chronologisch abrufen",
      scenario: "Das Login-Dashboard lädt 1.400 ms lang. Baue eine saubere Abfrage, die alle Spalten aus `users` holt, bei denen `status = 'active'` ist, absteigend sortiert nach `created_at`.",
      beforeLatencyMs: 1420,
      afterLatencyMs: 12,
      targetTokens: ["SELECT *", "FROM users", "WHERE status = 'active'", "ORDER BY created_at DESC;"],
      distractorTokens: ["DELETE FROM", "GROUP BY status", "HAVING count > 0", "DROP TABLE users;"],
      explanation: "Die korrekte SQL-Reihenfolge lautet: `SELECT` -> `FROM` -> `WHERE` -> `ORDER BY ... DESC`."
    },
    {
      id: "sql_create_index",
      difficulty: 1,
      title: "Slow Query #02: Full Table Scan auf 10 Mio. Bestellungen",
      scenario: "Suche nach `customer_id` in der Tabelle `orders` dauert 3.800 ms, weil ein B-Tree Index fehlt. Erstelle den Index `idx_customer` auf `orders(customer_id)`!",
      beforeLatencyMs: 3850,
      afterLatencyMs: 4,
      targetTokens: ["CREATE INDEX", "idx_customer", "ON orders", "(customer_id);"],
      distractorTokens: ["SELECT INDEX", "FROM orders", "WHERE customer_id", "ALTER TABLE"],
      explanation: "`CREATE INDEX <name> ON <tabelle> (<spalte>);` legt einen B-Tree-Index an und ersetzt langsame Full Table Scans durch schnelle Index Seeks."
    },
    {
      id: "sql_join_logs",
      difficulty: 2,
      title: "Slow Query #03: Server-Namen mit Fehler-Logs verknüpfen (JOIN)",
      scenario: "Verknüpfe die Tabellen `servers` und `alerts` über die Fremdschlüssel-Beziehung `servers.id = alerts.server_id`.",
      beforeLatencyMs: 2100,
      afterLatencyMs: 18,
      targetTokens: ["SELECT servers.hostname, alerts.msg", "FROM servers", "INNER JOIN alerts", "ON servers.id = alerts.server_id;"],
      distractorTokens: ["WHERE servers = alerts", "OUTER MERGE", "GROUP BY id", "VALUES (1, 2);"],
      explanation: "Ein `INNER JOIN <tabelle2> ON <bedingung>` kombiniert zusammengehörige Datensätze zweier Tabellen effizient über Primär-/Fremdschlüssel."
    },
    {
      id: "sql_group_errors",
      difficulty: 2,
      title: "Slow Query #04: Fehler-Statistik pro HTTP-Statuscode aggregieren",
      scenario: "Zähle die Anzahl der Requests pro `status_code` aus der Tabelle `access_logs`, gruppiert nach dem Statuscode.",
      beforeLatencyMs: 1950,
      afterLatencyMs: 22,
      targetTokens: ["SELECT status_code, COUNT(*)", "FROM access_logs", "WHERE status_code >= 400", "GROUP BY status_code;"],
      distractorTokens: ["ORDER BY COUNT", "JOIN status_code", "SET status_code = 500", "LIMIT 0;"],
      explanation: "Aggregatfunktionen wie `COUNT(*)` erfordern `GROUP BY <spalte>`, um Ergebnisse pro Gruppe zusammenzufassen."
    },
    {
      id: "sql_limit_recent",
      difficulty: 3,
      title: "Slow Query #05: Nur die 10 neuesten kritischen Telemetrie-Events",
      scenario: "Die App lädt versehentlich 2 Millionen Zeilen in den RAM! Begrenze die Abfrage der kritischen Events aus `telemetry` auf genau 10 Datensätze.",
      beforeLatencyMs: 5400,
      afterLatencyMs: 3,
      targetTokens: ["SELECT id, payload", "FROM telemetry", "WHERE severity = 'CRITICAL'", "ORDER BY ts DESC", "LIMIT 10;"],
      distractorTokens: ["TOP 10", "MAX(10)", "HAVING 10", "OFFSET ALL;"],
      explanation: "`ORDER BY ts DESC LIMIT 10;` sorgt in Kombination mit einem Index dafür, dass nur die 10 neuesten Einträge gelesen werden."
    }
  ],

  // --------------------------------------------------------------------------
  // TAB 3: WISSENS-LEXIKON & CHEAT-SHEETS
  // --------------------------------------------------------------------------
  cheatSheets: [
    {
      id: "cs_subnet",
      category: "Netzwerke & Protokolle",
      title: "IPv4 CIDR & Subnetting-Referenz",
      badge: "CIDR / VLSM",
      summary: "Formel für nutzbare Hosts: 2^(32 - Präfix) - 2 (Netz-ID und Broadcast werden abgezogen).",
      rows: [
        { key: "/23 (255.255.254.0)", val: "512 IPs | 510 nutzbare Hosts (2x /24 Supernet)" },
        { key: "/24 (255.255.255.0)", val: "256 IPs | 254 nutzbare Hosts (Klassisches Klasse-C Netz)" },
        { key: "/25 (255.255.255.128)", val: "128 IPs | 126 nutzbare Hosts (Halbes /24 Netz)" },
        { key: "/26 (255.255.255.192)", val: "64 IPs  | 62 nutzbare Hosts (Ideal für 31–62 Server)" },
        { key: "/27 (255.255.255.224)", val: "32 IPs  | 30 nutzbare Hosts (Ideal für 15–30 Server)" },
        { key: "/28 (255.255.255.240)", val: "16 IPs  | 14 nutzbare Hosts (Kleine Management-VLANs)" },
        { key: "/29 (255.255.255.248)", val: "8 IPs   | 6 nutzbare Hosts (DMZ / Mini-Segmente)" },
        { key: "/30 (255.255.255.252)", val: "4 IPs   | 2 nutzbare Hosts (Point-to-Point Router-Link)" }
      ]
    },
    {
      id: "cs_osi_ports",
      category: "Netzwerke & Protokolle",
      title: "OSI-7-Schichten-Modell & Wichtige Ports",
      badge: "OSI & PORTS",
      summary: "Merksatz (Schicht 1 -> 7): Please Do Not Throw Salami Pizza Away.",
      rows: [
        { key: "Layer 7 – Application", val: "HTTP (80), HTTPS (443), SSH (22), DNS (53)" },
        { key: "Layer 4 – Transport", val: "TCP (Verbindungsorientiert), UDP (Verbindungslos)" },
        { key: "Layer 3 – Network", val: "IP (IPv4/IPv6), ICMP (Ping), Routing (BGP/OSPF)" },
        { key: "Layer 2 – Data Link", val: "Ethernet, MAC-Adressen, VLANs (IEEE 802.1Q), Switches" },
        { key: "Layer 1 – Physical", val: "Glasfaser (LWL), Kupferkabel (Cat 6A/7), SFP+ Transceiver" },
        { key: "Port 22 / 80 / 443", val: "22 = SSH/SFTP | 80 = HTTP | 443 = HTTPS (TLS)" },
        { key: "Port 3306 / 5432 / 6379", val: "3306 = MySQL/MariaDB | 5432 = PostgreSQL | 6379 = Redis" }
      ]
    },
    {
      id: "cs_linux",
      category: "Linux-Administration",
      title: "Linux Shell & Berechtigungen (chmod)",
      badge: "BASH / POSIX",
      summary: "Oktale Rechte setzen sich aus Read (4) + Write (2) + Execute (1) für Owner, Group, Others zusammen.",
      rows: [
        { key: "chmod 644 <datei>", val: "rw-r--r-- (Besitzer: Lesen/Schreiben, Rest: nur Lesen – Standard für Configs)" },
        { key: "chmod 600 <datei>", val: "rw------- (Nur Besitzer hat Zugriff – Pflicht für private SSH-Keys id_rsa)" },
        { key: "chmod 755 <skript>", val: "rwxr-xr-x (Ausführbares Programm/Skript für alle, Schreibrecht nur Owner)" },
        { key: "kill -9 <PID>", val: "Sendet SIGKILL (9) an Prozess-ID – beendet hängende Prozesse sofort" },
        { key: "df -h & du -sh", val: "df -h zeigt freie Partitionen; du -sh zeigt Ordnergröße menschenlesbar" },
        { key: "systemctl restart <svc>", val: "Startet einen Systemd-Hintergrunddienst (z.B. nginx, sshd) neu" },
        { key: "ufw allow 443/tcp", val: "Öffnet TCP-Port 443 in der Uncomplicated Firewall" }
      ]
    },
    {
      id: "cs_sql",
      category: "Datenbanken",
      title: "SQL Abfrage-Reihenfolge & Performance Tuning",
      badge: "SQL & INDEX",
      summary: "Indizes (B-Tree) beschleunigen WHERE-, JOIN- und ORDER BY-Operationen von O(n) auf O(log n).",
      rows: [
        { key: "1. SELECT <spalten>", val: "Bestimmt die gewünschten Rückgabespalten oder Aggregatfunktionen (COUNT, SUM)" },
        { key: "2. FROM <tabelle>", val: "Gibt die Quell-Tabelle der Abfrage an" },
        { key: "3. INNER JOIN <tab2> ON ...", val: "Verknüpft Datensätze zweier Tabellen über Primär-/Fremdschlüssel" },
        { key: "4. WHERE <bedingung>", val: "Filtert Zeilen vor einer Gruppierung (z.B. WHERE status = 'active')" },
        { key: "5. GROUP BY <spalte>", val: "Fasst gleiche Werte für Aggregatfunktionen wie COUNT(*) zusammen" },
        { key: "6. ORDER BY <spalte> DESC", val: "Sortiert das Ergebnis aufsteigend (ASC) oder absteigend (DESC)" },
        { key: "7. LIMIT <anzahl>", val: "Begrenzt die Anzahl der zurückgegebenen Datensätze (schont RAM & I/O)" },
        { key: "CREATE INDEX idx ON tab(col);", val: "Erstellt einen Suchindex auf Spalte `col`, um Full Table Scans zu vermeiden" }
      ]
    },
    {
      id: "cs_scripting",
      category: "Automatisierung & DevOps",
      title: "Python & Bash Automatisierungs-Muster",
      badge: "CRON & PYTHON",
      summary: "Automatisierte Skripte ersetzen manuelle Klick-Arbeit durch zuverlässige Hintergrund-Daemons.",
      rows: [
        { key: "if cpu_usage > 90:", val: "Bedingte Ausführung in Python bei Überschreiten eines Schwellenwerts" },
        { key: "for server in cluster:", val: "For-Schleife über alle Elemente einer Liste in Python" },
        { key: "for k, v in dict.items():", val: "Iteriert über Schlüssel und Werte eines Python-Dictionaries" },
        { key: "if [ ! -d \"$DIR\" ]; then", val: "Bash-Prüfung, ob ein Verzeichnis noch NICHT existiert" },
        { key: "tar -czf backup.tar.gz /pfad", val: "Erstellt ein komprimiertes .tar.gz Archiv (c=create, z=gzip, f=file)" },
        { key: "Cron Syntax: * * * * *", val: "Minute (0-59) | Stunde (0-23) | Tag (1-31) | Monat (1-12) | Wochentag (0-6)" }
      ]
    }
  ],

  // --------------------------------------------------------------------------
  // 8. ACHIEVEMENTS & EXPORTIERBARE IN-GAME-ZERTIFIKATE
  // --------------------------------------------------------------------------
  certificates: [
    {
      id: "cert_network",
      title: "Junior Network Administrator",
      code: "CCNA-ROOT-101",
      domain: "Netzwerktechnik & CIDR Subnetting",
      reqDesc: "Löse 2 Subnetting-Puzzles erfolgreich.",
      check: (state) => (state.stats.subnetSolved || 0) >= 2
    },
    {
      id: "cert_linux",
      title: "Linux Kernel & Shell Guru",
      code: "LPIC-ROOT-202",
      domain: "Linux Systemadministration & Incident Response",
      reqDesc: "Behebe 2 Linux-CLI Incidents im Terminal.",
      check: (state) => (state.stats.cliSolved || 0) >= 2
    },
    {
      id: "cert_devops",
      title: "DevOps Automation Engineer",
      code: "DEVOPS-CRON-303",
      domain: "Python/Bash Scripting & Daemon Engineering",
      reqDesc: "Kompiliere 2 Cronjob-Skripte erfolgreich.",
      check: (state) => (state.stats.scriptSolved || 0) >= 2
    },
    {
      id: "cert_sql",
      title: "Database Performance Architect",
      code: "DBA-SQL-404",
      domain: "SQL Query Tuning & B-Tree Indexing",
      reqDesc: "Optimiere 2 SQL-Abfragen im Performance Tuner.",
      check: (state) => (state.stats.sqlSolved || 0) >= 2
    },
    {
      id: "cert_root",
      title: "Principal Cloud & Root Architect",
      code: "ROOT-UID-000",
      domain: "Full-Stack Infrastructure & Datacenter Operations",
      reqDesc: "Löse insgesamt 8 IT-Challenges und erforsche mindestens 3 Technologien.",
      check: (state) => (state.stats.totalSolved || 0) >= 8 && (state.unlockedTechs || []).length >= 3
    }
  ]
};
