/**
 * 
 * Common port mappings for various network services
 * 
 */
export const PortByServiceName = {
  // Web Services
  HTTP: 80,
  HTTPS: 443,
  HTTP_ALT: 8080,
  HTTPS_ALT: 8443,
  HTTP_PROXY: 3128,
  NGINX: 8000,
  APACHE: 8888,

  // File Transfer
  FTP: 21,
  FTP_DATA: 20,
  FTPS: 990,
  SFTP: 22,
  TFTP: 69,

  // Remote Access
  SSH: 22,
  TELNET: 23,
  RDP: 3389,
  VNC: 5900,
  VNC_ALT: 5901,

  // Email
  SMTP: 25,
  SMTP_SUBMISSION: 587,
  SMTPS: 465,
  POP3: 110,
  POP3S: 995,
  IMAP: 143,
  IMAPS: 993,

  // Database
  MYSQL: 3306,
  POSTGRESQL: 5432,
  MONGODB: 27017,
  MONGODB_WEB: 27018,
  REDIS: 6379,
  CASSANDRA: 9042,
  ELASTICSEARCH: 9200,
  ELASTICSEARCH_CLUSTER: 9300,
  MSSQL: 1433,
  ORACLE: 1521,
  COUCHDB: 5984,
  NEO4J: 7474,
  NEO4J_BOLT: 7687,
  INFLUXDB: 8086,

  // Message Queues
  RABBITMQ: 5672,
  RABBITMQ_MGMT: 15672,
  KAFKA: 9092,
  ACTIVEMQ: 61616,
  MQTT: 1883,
  MQTTS: 8883,

  // DNS & Network
  DNS: 53,
  DHCP_SERVER: 67,
  DHCP_CLIENT: 68,
  NTP: 123,
  SNMP: 161,
  SNMP_TRAP: 162,
  LDAP: 389,
  LDAPS: 636,
  UPNP_SSDP: 1900,
  MODBUS: 502,  

  // File Sharing
  SMB: 445,
  NETBIOS: 139,
  NFS: 2049,
  AFP: 548,

  // Proxy & VPN
  SOCKS: 1080,
  SQUID: 3128,
  OPENVPN: 1194,
  PPTP: 1723,
  L2TP: 1701,

  // Development & API
  NODEJS_DEFAULT: 3000,
  REACT_DEV: 3000,
  ANGULAR_DEV: 4200,
  VITE_DEV: 5173,
  WEBPACK_DEV: 8080,
  DJANGO: 8000,
  FLASK: 5000,
  RAILS: 3000,
  GRAPHQL: 4000,
  REST_API: 8080,

  // IoT & Smart Home
  HOMEKIT: 5353,
  HOMEASSISTANT: 8123,
  MQTT_IOT: 1883,
  ZIGBEE2MQTT: 8080,
  ZWAVE: 8091,
  HASS_IO: 8123,
  NODE_RED: 1880,
  OCTOPRINT: 5000,
  KLIPPER: 7125,
  HOMEBRIDGE: 51826,
  PHILIPS_HUE: 80,
  LIFX: 56700,
  SONOS: 1400,
  ROKU: 8060,
  PLEX_DLNA: 32469,

  // Media & Streaming
  PLEX: 32400,
  EMBY: 8096,
  JELLYFIN: 8096,
  KODI: 8080,
  SUBSONIC: 4040,
  AIRSONIC: 4040,
  SPOTIFY_CONNECT: 57621,
  CHROMECAST: 8008,
  AIRPLAY: 7000,

  // Docker & Containers
  DOCKER: 2375,
  DOCKER_TLS: 2376,
  DOCKER_REGISTRY: 5000,
  KUBERNETES_API: 6443,
  KUBERNETES_KUBELET: 10250,
  PORTAINER: 9000,
  RANCHER: 8080,

  // Monitoring & Management
  PROMETHEUS: 9090,
  GRAFANA: 3000,
  JENKINS: 8080,
  GITLAB: 80,
  GITLAB_REGISTRY: 5050,
  NEXUS: 8081,
  ARTIFACTORY: 8081,
  SONARQUBE: 9000,
  KIBANA: 5601,

  // Gaming
  MINECRAFT: 25565,
  MINECRAFT_RCON: 25575,
  STEAM: 27015,
  TEAMSPEAK: 9987,
  MUMBLE: 64738,
  DISCORD_RPC: 6463,

  // Printers & Scanners
  IPP: 631,
  LPD: 515,
  HP_JETDIRECT: 9100,

  // Security & Camera
  RTSP: 554,
  ONVIF: 8000,
  HIKVISION: 8000,
  DAHUA: 37777,
  AXIS_CAMERA: 80,

  // Backup & Storage
  SYNOLOGY_DSM: 5000,
  SYNOLOGY_DSM_SECURE: 5001,
  QNAP: 8080,
  UNRAID: 80,
  NEXTCLOUD: 80,
  OWNCLOUD: 80,

  // Network Equipment
  UBIQUITI_UNIFI: 8443,
  UBIQUITI_INFORM: 8080,
  MIKROTIK: 8291,
  MIKROTIK_WINBOX: 8291,
  CISCO_ASA: 443,

  // Other Common Services
  SYSLOG: 514,
  RSYNC: 873,
  GIT: 9418,
  SVNSERVE: 3690,
  MEMCACHED: 11211,
  CUPS: 631,
  SAMBA: 445,
  WEBMIN: 10000,
  COCKPIT: 9090,
} as const;

/**
 * 
 * Common port groupings by service category
 * 
 */
export const CommonPorts = {
  /**
   * Web servers and HTTP services
   */
  Web: [
    PortByServiceName.HTTP,
    PortByServiceName.HTTPS,
    PortByServiceName.HTTP_ALT,
    PortByServiceName.HTTPS_ALT,
    PortByServiceName.HTTP_PROXY,
  ],

  /**
   * File transfer protocols
   */
  FileTransfer: [
    PortByServiceName.FTP,
    PortByServiceName.FTP_DATA,
    PortByServiceName.FTPS,
    PortByServiceName.SFTP,
    PortByServiceName.TFTP,
  ],

  /**
   * Remote access and administration
   */
  RemoteAccess: [
    PortByServiceName.SSH,
    PortByServiceName.TELNET,
    PortByServiceName.RDP,
    PortByServiceName.VNC,
    PortByServiceName.VNC_ALT,
  ],

  /**
   * Email services
   */
  Email: [
    PortByServiceName.SMTP,
    PortByServiceName.SMTP_SUBMISSION,
    PortByServiceName.SMTPS,
    PortByServiceName.POP3,
    PortByServiceName.POP3S,
    PortByServiceName.IMAP,
    PortByServiceName.IMAPS,
  ],

  /**
   * Database servers
   */
  Database: [
    PortByServiceName.MYSQL,
    PortByServiceName.POSTGRESQL,
    PortByServiceName.MONGODB,
    PortByServiceName.REDIS,
    PortByServiceName.MSSQL,
    PortByServiceName.ORACLE,
    PortByServiceName.ELASTICSEARCH,
  ],

  /**
   * IoT and Smart Home devices
   */
  IoT: [
    PortByServiceName.MQTT_IOT,
    PortByServiceName.MQTTS,
    PortByServiceName.HOMEASSISTANT,
    PortByServiceName.HOMEBRIDGE,
    PortByServiceName.NODE_RED,
    PortByServiceName.ZIGBEE2MQTT,
    PortByServiceName.HOMEKIT,
    PortByServiceName.UPNP_SSDP,
  ],

  /**
   * Media servers and streaming
   */
  Media: [
    PortByServiceName.PLEX,
    PortByServiceName.EMBY,
    PortByServiceName.JELLYFIN,
    PortByServiceName.KODI,
    PortByServiceName.CHROMECAST,
    PortByServiceName.AIRPLAY,
    PortByServiceName.SONOS,
  ],

  /**
   * Development servers
   */
  Development: [
    PortByServiceName.NODEJS_DEFAULT,
    PortByServiceName.REACT_DEV,
    PortByServiceName.ANGULAR_DEV,
    PortByServiceName.VITE_DEV,
    PortByServiceName.WEBPACK_DEV,
    PortByServiceName.DJANGO,
    PortByServiceName.FLASK,
  ],

  /**
   * Docker and container services
   */
  Docker: [
    PortByServiceName.DOCKER,
    PortByServiceName.DOCKER_TLS,
    PortByServiceName.DOCKER_REGISTRY,
    PortByServiceName.KUBERNETES_API,
    PortByServiceName.PORTAINER,
    PortByServiceName.RANCHER,
  ],

  /**
   * Monitoring and management tools
   */
  Monitoring: [
    PortByServiceName.PROMETHEUS,
    PortByServiceName.GRAFANA,
    PortByServiceName.KIBANA,
    PortByServiceName.JENKINS,
    PortByServiceName.SONARQUBE,
  ],

  /**
   * Network infrastructure
   */
  Network: [
    PortByServiceName.DNS,
    PortByServiceName.DHCP_SERVER,
    PortByServiceName.NTP,
    PortByServiceName.SNMP,
    PortByServiceName.LDAP,
    PortByServiceName.LDAPS,
    PortByServiceName.MODBUS,
  ],

  /**
   * File sharing protocols
   */
  FileSharing: [
    PortByServiceName.SMB,
    PortByServiceName.NETBIOS,
    PortByServiceName.NFS,
    PortByServiceName.AFP,
    PortByServiceName.RSYNC,
  ],

  /**
   * Security cameras and surveillance
   */
  Security: [
    PortByServiceName.RTSP,
    PortByServiceName.ONVIF,
    PortByServiceName.HIKVISION,
    PortByServiceName.DAHUA,
    PortByServiceName.AXIS_CAMERA,
  ],

  /**
   * Gaming servers
   */
  Gaming: [
    PortByServiceName.MINECRAFT,
    PortByServiceName.MINECRAFT_RCON,
    PortByServiceName.STEAM,
    PortByServiceName.TEAMSPEAK,
    PortByServiceName.MUMBLE,
  ],

  /**
   * Most commonly scanned ports (quick scan)
   */
  Common: [
    PortByServiceName.HTTP,
    PortByServiceName.HTTPS,
    PortByServiceName.SSH,
    PortByServiceName.FTP,
    PortByServiceName.TELNET,
    PortByServiceName.SMTP,
    PortByServiceName.DNS,
    PortByServiceName.POP3,
    PortByServiceName.IMAP,
    PortByServiceName.MYSQL,
    PortByServiceName.POSTGRESQL,
    PortByServiceName.RDP,
    PortByServiceName.SMB,
    PortByServiceName.HTTP_ALT,
  ],


  /**
   * All ports for comprehensive scan
   */
  All: Object.values(PortByServiceName).filter(
    (value, index, self) => self.indexOf(value) === index
  ),
};
