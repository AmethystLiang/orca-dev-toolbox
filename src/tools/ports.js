// Well-known and common development ports: what usually listens there.

export const PORTS = [
  [20, 'tcp', 'FTP data', 'Active-mode FTP transfers.'],
  [21, 'tcp', 'FTP', 'File transfer control channel; plain text.'],
  [22, 'tcp', 'SSH', 'Secure shell, SFTP, scp, Git over SSH.'],
  [23, 'tcp', 'Telnet', 'Unencrypted remote shell; avoid.'],
  [25, 'tcp', 'SMTP', 'Mail between servers; often blocked for home and cloud hosts.'],
  [53, 'tcp/udp', 'DNS', 'Name resolution.'],
  [67, 'udp', 'DHCP server', 'Hands out IP addresses (client side is 68).'],
  [69, 'udp', 'TFTP', 'Trivial file transfer, as for network boot.'],
  [80, 'tcp', 'HTTP', 'The web, unencrypted.'],
  [110, 'tcp', 'POP3', 'Mail download, plain text.'],
  [123, 'udp', 'NTP', 'Clock synchronisation.'],
  [143, 'tcp', 'IMAP', 'Mail access, plain text or STARTTLS.'],
  [161, 'udp', 'SNMP', 'Network device monitoring.'],
  [389, 'tcp', 'LDAP', 'Directory lookups (Active Directory, OpenLDAP).'],
  [443, 'tcp/udp', 'HTTPS', 'The web over TLS; UDP for HTTP/3 (QUIC).'],
  [445, 'tcp', 'SMB', 'Windows file sharing; never expose to the internet.'],
  [465, 'tcp', 'SMTPS', 'Mail submission over implicit TLS.'],
  [514, 'udp', 'Syslog', 'Log forwarding.'],
  [587, 'tcp', 'SMTP submission', 'Mail from clients and apps, with STARTTLS.'],
  [636, 'tcp', 'LDAPS', 'LDAP over TLS.'],
  [873, 'tcp', 'rsync', 'rsync daemon.'],
  [993, 'tcp', 'IMAPS', 'IMAP over TLS.'],
  [995, 'tcp', 'POP3S', 'POP3 over TLS.'],
  [1080, 'tcp', 'SOCKS proxy', 'SOCKS4/5, as from ssh -D.'],
  [1194, 'udp', 'OpenVPN', 'OpenVPN default.'],
  [1433, 'tcp', 'SQL Server', 'Microsoft SQL Server.'],
  [1521, 'tcp', 'Oracle', 'Oracle Database listener.'],
  [1883, 'tcp', 'MQTT', 'IoT messaging (8883 with TLS).'],
  [2049, 'tcp', 'NFS', 'Network file system.'],
  [2181, 'tcp', 'ZooKeeper', 'Client port.'],
  [2375, 'tcp', 'Docker API', 'Docker daemon without TLS: root access to the host, never expose it.'],
  [2376, 'tcp', 'Docker API (TLS)', 'Docker daemon with TLS.'],
  [2379, 'tcp', 'etcd', 'Client API (2380 for peers).'],
  [3000, 'tcp', 'Dev server', 'Node, Next.js, Rails, Grafana default.'],
  [3001, 'tcp', 'Dev server', 'Second Node or React app.'],
  [3306, 'tcp', 'MySQL', 'MySQL and MariaDB.'],
  [3389, 'tcp', 'RDP', 'Windows Remote Desktop.'],
  [4000, 'tcp', 'Dev server', 'Jekyll, Phoenix and others.'],
  [4200, 'tcp', 'Angular', 'ng serve default.'],
  [4222, 'tcp', 'NATS', 'Client connections.'],
  [4317, 'tcp', 'OTLP gRPC', 'OpenTelemetry collector (4318 for HTTP).'],
  [5000, 'tcp', 'Dev server', 'Flask, ASP.NET; AirPlay Receiver on macOS also takes it.'],
  [5037, 'tcp', 'adb', 'Android Debug Bridge server.'],
  [5173, 'tcp', 'Vite', 'Vite dev server (4173 for preview).'],
  [5432, 'tcp', 'PostgreSQL', 'Postgres.'],
  [5555, 'tcp', 'adb over Wi-Fi', 'Android wireless debugging; Prisma Studio too.'],
  [5601, 'tcp', 'Kibana', 'Kibana web UI.'],
  [5672, 'tcp', 'RabbitMQ', 'AMQP (15672 for the management UI).'],
  [5900, 'tcp', 'VNC', 'Remote desktop (display :0).'],
  [6006, 'tcp', 'Storybook / TensorBoard', 'Storybook and TensorBoard default.'],
  [6379, 'tcp', 'Redis', 'Redis and Valkey.'],
  [6443, 'tcp', 'Kubernetes API', 'kube-apiserver.'],
  [7000, 'tcp', 'macOS AirPlay', 'AirPlay Receiver on macOS; Cassandra inter-node too.'],
  [8000, 'tcp', 'Dev server', 'Django, python -m http.server, Laravel artisan serve.'],
  [8080, 'tcp', 'HTTP alternate', 'Tomcat, Jenkins, proxies, Spring Boot.'],
  [8081, 'tcp', 'Metro / alt HTTP', 'React Native Metro bundler.'],
  [8086, 'tcp', 'InfluxDB', 'InfluxDB HTTP API.'],
  [8443, 'tcp', 'HTTPS alternate', 'Tomcat, admin consoles.'],
  [8500, 'tcp', 'Consul', 'Consul HTTP API and UI.'],
  [8888, 'tcp', 'Jupyter', 'Jupyter Notebook and Lab.'],
  [9000, 'tcp', 'PHP-FPM / MinIO', 'PHP-FPM, MinIO API, SonarQube.'],
  [9090, 'tcp', 'Prometheus', 'Prometheus server; Cockpit too.'],
  [9092, 'tcp', 'Kafka', 'Kafka broker.'],
  [9093, 'tcp', 'Alertmanager', 'Prometheus Alertmanager.'],
  [9100, 'tcp', 'Node exporter', 'Prometheus node exporter; raw printing too.'],
  [9200, 'tcp', 'Elasticsearch', 'REST API (9300 between nodes); OpenSearch too.'],
  [9229, 'tcp', 'Node inspector', 'node --inspect debugger.'],
  [9418, 'tcp', 'Git', 'git:// daemon.'],
  [11211, 'tcp', 'Memcached', 'Memcached.'],
  [11434, 'tcp', 'Ollama', 'Ollama local model API.'],
  [19000, 'tcp', 'Expo', 'Expo dev tools (8081 in newer versions).'],
  [25565, 'tcp', 'Minecraft', 'Minecraft Java server.'],
  [27017, 'tcp', 'MongoDB', 'MongoDB.'],
  [51820, 'udp', 'WireGuard', 'WireGuard default.']
]

/** Ports matching a number, a range like 8000-8999, or words in the service or notes. */
export function searchPorts(query) {
  const q = String(query).trim().toLowerCase().replace(/^(port\s+|:)/, '')
  if (!q) return PORTS
  const range = q.match(/^(\d+)\s*[-–]\s*(\d+)$/)
  if (range) return PORTS.filter(([port]) => port >= Number(range[1]) && port <= Number(range[2]))
  if (/^\d+$/.test(q)) {
    const exact = PORTS.filter(([port]) => port === Number(q))
    return exact.length ? exact : PORTS.filter(([port]) => String(port).startsWith(q))
  }
  const words = q.split(/\s+/)
  return PORTS.filter(([port, proto, name, about]) => words.every((word) => `${port} ${proto} ${name} ${about}`.toLowerCase().includes(word)))
}

/** Where a port number falls in the IANA ranges. */
export function portRange(port) {
  if (!Number.isInteger(port) || port < 0 || port > 65535) return 'Not a port: they run from 0 to 65535.'
  if (port < 1024) return 'System port (0–1023): binding it needs root or CAP_NET_BIND_SERVICE on Linux.'
  if (port < 49152) return 'Registered port (1024–49151).'
  return 'Dynamic or private port (49152–65535): the OS hands these out for outgoing connections.'
}
