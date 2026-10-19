export type PanelInfo = {
  ok: boolean;
  panel: string;
  name: string;
  version: string;
};

export type PanelUser = {
  id: number;
  uuid: string;
  username: string;
  email: string;
  root_admin: boolean;
  language: string;
  totp_enabled: boolean;
  created_at?: string;
};

export type LoginPayload = {
  identifier?: string;
  password?: string;
  totp?: string;
  challenge?: string;
  installId?: string;
};

export type LoginResponse = {
  ok: boolean;
  require2fa: boolean;
  challenge?: string;
  user?: PanelUser;
  apiKey?: string;
  name?: string;
  version?: string;
};

export type LiveStats = {
  connected?: boolean;
  status?: string | null;
  cpu?: number;
  memory?: number;
  memory_limit?: number;
  disk?: number;
  disk_limit?: number;
  network_rx?: number;
  network_tx?: number;
  uptime?: number;
};

export type Allocation = {
  id: number;
  node_id?: number;
  server_id?: number | null;
  ip: string;
  port: number;
  alias?: string | null;
  node_name?: string;
  server_name?: string | null;
  server_owner?: string | null;
};

export type Server = {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  status: string;
  memory: number;
  swap?: number;
  disk: number;
  cpu: number;
  io?: number;
  database_limit?: number;
  backups_limit?: number;
  allocation_id?: number | null;
  node_id?: number;
  user_id?: number;
  egg_id?: number | null;
  startup_command?: string;
  image?: string | null;
  install_status?: string | null;
  install_error?: string | null;
  node_name?: string;
  fqdn?: string;
  scheme?: string;
  allocation_ip?: string | null;
  allocation_port?: number | null;
  owner_username?: string;
  owner_email?: string;
  egg_name?: string | null;
  is_owner?: boolean;
  permissions?: string[] | null;
  live?: LiveStats;
  created_at?: string;
};

export type FileEntry = {
  name: string;
  size?: number;
  isDirectory: boolean;
  modified?: string;
  mode?: string;
  mimetype?: string;
};

export type ServerDatabase = {
  id: number;
  name: string;
  username: string;
  password: string;
  host?: string;
  port?: number;
};

export type Backup = {
  id: number;
  name: string;
  file?: string;
  size: number;
  size_text?: string;
  ignored_files?: string | null;
  locked: number | boolean;
  created_at: string;
};

export type ScheduleTask = {
  id: number;
  action: string;
  cron: string;
  last_run_at?: string | null;
};

export type Subuser = {
  id: number;
  username: string;
  email: string;
  permissions: string[];
  created_at?: string;
};

export type PermissionGroup = {
  id: string;
  perms: { key: string; group: string }[];
};

export type EggVariable = {
  id?: number;
  egg_id?: number;
  name: string;
  description?: string | null;
  env_var: string;
  default_value?: string | null;
  current_value?: string | null;
  user_viewable?: number | boolean;
  user_editable?: number | boolean;
  rules?: string | null;
  field_type?: string;
  sort_order?: number;
};

export type StartupInfo = {
  egg: { id: number; name: string } | null;
  variables: EggVariable[];
  startup_command: string;
  egg_images: { image: string; label?: string | null }[];
  current_image: string | null;
  can_edit?: boolean;
};

export type ServerSettings = {
  name: string;
  description: string;
  sftp: { address: string; username: string; password: string };
  container_id: string | null;
  install_status: string | null;
  install_error: string | null;
  is_owner: boolean;
};

export type AdminOverview = {
  counts: {
    users: number;
    servers: number;
    nodes: number;
    locations: number;
    eggs: number;
    nests: number;
    allocations: number;
    used_allocations: number;
    memory: number;
    disk: number;
  };
  recent_users: PanelUser[];
  recent_servers: (Pick<Server, 'id' | 'uuid' | 'name' | 'status' | 'memory' | 'disk' | 'created_at'> & {
    username?: string;
    node_name?: string;
  })[];
};

export type Node = {
  id: number;
  uuid?: string;
  location_id?: number;
  location_name?: string;
  name: string;
  description?: string | null;
  fqdn: string;
  scheme?: string;
  port?: number;
  daemon_token?: string;
  daemon_listen?: string;
  daemon_type?: string;
  sftp_port?: number;
  memory: number;
  disk: number;
  cpu?: number;
  memory_overallocate?: number;
  disk_overallocate?: number;
  maintenance_mode?: number | boolean;
  online?: boolean;
  server_count?: number;
  allocation_count?: number;
  created_at?: string;
};

export type Location = {
  id: number;
  short: string;
  long: string;
  node_count?: number;
  server_count?: number;
  created_at?: string;
};

export type Nest = {
  id: number;
  uuid?: string;
  name: string;
  description?: string | null;
  egg_count?: number;
  server_count?: number;
  author?: string | null;
  created_at?: string;
};

export type AdminEgg = {
  id: number;
  uuid?: string;
  nest_id: number;
  name: string;
  description?: string | null;
  author?: string | null;
  docker_image?: string | null;
  docker_images?: string | null;
  startup?: string | null;
  config_from?: number | null;
  config?: string | null;
  features?: string | null;
  file_denylist?: string | null;
  install_script?: string | null;
  nest_name?: string;
  created_at?: string;
};

export type AdminUserResponse = {
  user: PanelUser;
  servers: Server[];
  api_keys: { id: number; memo: string; last_used_at: string | null; created_at: string }[];
};

export type AdminServerOptions = {
  users: { id: number; username: string; email: string }[];
  nodes: { id: number; name: string }[];
  eggs: { id: number; name: string; nest_id: number; docker_image: string | null; startup: string | null }[];
  nests: { id: number; name: string }[];
  allocations: Allocation[];
};

export type AdminServerDetail = {
  server: Server & {
    username?: string;
    user_email?: string;
    alloc_ip?: string | null;
    alloc_port?: number | null;
  };
  options: AdminServerOptions;
  free_allocations: Allocation[];
  server_allocations: Allocation[];
  databases: ServerDatabase[];
  egg_variables: EggVariable[];
  node_mem_allocated: number;
  node_disk_allocated: number;
};

export type AdminNodeDetail = {
  node: Node;
  allocations: Allocation[];
  servers: Server[];
  locations: Location[];
  mem_allocated: number;
  disk_allocated: number;
};

export type PanelSettings = {
  data: Record<string, string | boolean>;
};

export type AdminEggDetail = {
  egg: AdminEgg;
  variables: EggVariable[];
  egg_images: { image: string; label: string }[];
  options: { nests: { id: number; name: string }[] };
};
